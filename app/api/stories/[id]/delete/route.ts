import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getPublicUrl } from "@/lib/getPublicUrl";
import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

function collectInlineStoryAssetIds(value: unknown): number[] {
    const found = new Set<number>();

    function visit(node: unknown): void {
        if (
            !node ||
            typeof node !== "object" ||
            Array.isArray(node)
        ) {
            return;
        }

        const record = node as {
            type?: unknown;
            attrs?: unknown;
            content?: unknown;
        };

        if (
            record.type === "storyImage" &&
            record.attrs &&
            typeof record.attrs === "object" &&
            !Array.isArray(record.attrs)
        ) {
            const assetId = (
                record.attrs as Record<string, unknown>
            ).assetId;

            if (
                typeof assetId === "number" &&
                Number.isSafeInteger(assetId) &&
                assetId > 0
            ) {
                found.add(assetId);
            }
        }

        if (Array.isArray(record.content)) {
            record.content.forEach(visit);
        }
    }

    visit(value);

    return [...found];
}

function removeLinksToDeletedStory(
    value: unknown,
    storyId: number,
): { value: unknown; changed: boolean } {
    if (!value || typeof value !== "object") {
        return { value, changed: false };
    }

    if (Array.isArray(value)) {
        let changed = false;

        const result = value.map((item) => {
            const cleaned = removeLinksToDeletedStory(
                item,
                storyId,
            );

            if (cleaned.changed) {
                changed = true;
            }

            return cleaned.value;
        });

        return { value: result, changed };
    }

    const node = value as Record<string, unknown>;
    const result: Record<string, unknown> = { ...node };
    let changed = false;

    if (Array.isArray(node.marks)) {
        const marks = node.marks.filter((mark) => {
            if (
                !mark ||
                typeof mark !== "object" ||
                Array.isArray(mark)
            ) {
                return true;
            }

            const item = mark as Record<string, unknown>;

            if (
                item.type !== "link" ||
                !item.attrs ||
                typeof item.attrs !== "object" ||
                Array.isArray(item.attrs)
            ) {
                return true;
            }

            const attrs = item.attrs as Record<string, unknown>;

            const matchesArchiveRecord =
                String(attrs.archiveRecordType).toLowerCase() ===
                "story" &&
                String(attrs.archiveRecordId) === String(storyId);

            // Also handle older internal links that don't contain
            // archive-record metadata. Don't match external URLs.
            let matchesUrl = false;

            if (
                typeof attrs.href === "string" &&
                attrs.href.startsWith("/") &&
                !attrs.href.startsWith("//")
            ) {
                const pathname = attrs.href
                    .split(/[?#]/, 1)[0]
                    .replace(/\/+$/, "");

                matchesUrl =
                    pathname === `/stories/${storyId}` ||
                    pathname === `/stories/${storyId}/edit`;
            }

            return !matchesArchiveRecord && !matchesUrl;
        });

        if (marks.length !== node.marks.length) {
            result.marks = marks;
            changed = true;
        }
    }

    if (Array.isArray(node.content)) {
        const cleaned = node.content.map((child) =>
            removeLinksToDeletedStory(child, storyId),
        );

        if (cleaned.some((child) => child.changed)) {
            result.content = cleaned.map((child) => child.value);
            changed = true;
        }
    }

    return { value: result, changed };
}

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    },
) {
    const { id } = await params;
    const storyId = Number(id);

    const redirectToStories = () =>
        NextResponse.redirect(
            new URL("/stories", getPublicUrl(request)),
        );

    if (!Number.isSafeInteger(storyId) || storyId < 1) {
        return redirectToStories();
    }

    const story = await prisma.story.findUnique({
        where: {
            id: storyId,
        },
        select: {
            content: true,
            inlineAssets: {
                select: {
                    assetId: true,
                },
            },
        },
    });

    if (!story) {
        return redirectToStories();
    }

    // Record candidate image assets before the story is deleted.
    const assetIds = new Set([
        ...collectInlineStoryAssetIds(story.content),
        ...story.inlineAssets.map((asset) => asset.assetId),
    ]);

    const candidateAssets = assetIds.size
        ? await prisma.storedAsset.findMany({
            where: {
                id: {
                    in: [...assetIds],
                },
            },
            select: {
                id: true,
            },
        })
        : [];

    // Remove inline links to this story from other saved stories,
    // then delete the story in the same transaction.
    const updatedStoryIds = await prisma.$transaction(
        async (tx) => {
            const otherStories = await tx.story.findMany({
                where: {
                    id: {
                        not: storyId,
                    },
                },
                select: {
                    id: true,
                    content: true,
                },
            });

            const updatedIds: number[] = [];

            for (const otherStory of otherStories) {
                const cleaned = removeLinksToDeletedStory(
                    otherStory.content,
                    storyId,
                );

                if (!cleaned.changed) {
                    continue;
                }

                await tx.story.update({
                    where: {
                        id: otherStory.id,
                    },
                    data: {
                        content:
                            cleaned.value as Prisma.InputJsonValue,
                    },
                });

                updatedIds.push(otherStory.id);
            }

            // Story-specific relations are removed through the
            // existing Prisma cascade rules.
            await tx.story.delete({
                where: {
                    id: storyId,
                },
            });

            return updatedIds;
        },
    );

    revalidatePath("/stories");
    revalidatePath(`/stories/${storyId}`);
    revalidatePath(`/stories/${storyId}/edit`);

    for (const otherStoryId of updatedStoryIds) {
        revalidatePath(`/stories/${otherStoryId}`);
        revalidatePath(`/stories/${otherStoryId}/edit`);
    }

    // Check remaining stories' content before removing image files.
    const remainingStories = await prisma.story.findMany({
        select: {
            content: true,
        },
    });

    const remainingAssetIds = new Set<number>();

    for (const remainingStory of remainingStories) {
        for (const assetId of collectInlineStoryAssetIds(
            remainingStory.content,
        )) {
            remainingAssetIds.add(assetId);
        }
    }

    // Clean up only assets that are no longer used by any story
    // or attached to a reusable reference.
    for (const candidate of candidateAssets) {
        if (remainingAssetIds.has(candidate.id)) {
            continue;
        }

        const asset = await prisma.storedAsset.findUnique({
            where: {
                id: candidate.id,
            },
            select: {
                id: true,
                objectKey: true,
                referenceMaterial: {
                    select: {
                        id: true,
                    },
                },
                inlineStories: {
                    select: {
                        storyId: true,
                    },
                },
            },
        });

        if (
            !asset ||
            asset.referenceMaterial ||
            asset.inlineStories.length > 0
        ) {
            continue;
        }

        try {
            await minio.send(
                new DeleteObjectCommand({
                    Bucket: MINIO_BUCKET,
                    Key: asset.objectKey,
                }),
            );

            await prisma.storedAsset.delete({
                where: {
                    id: asset.id,
                },
            });
        } catch (error) {
            // The story deletion has already succeeded. Log any
            // storage cleanup issue for later investigation.
            console.error(
                `Failed to clean up unused story asset ${asset.id}:`,
                error,
            );
        }
    }

    return redirectToStories();
}