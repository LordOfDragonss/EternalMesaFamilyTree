import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ assetId: string }> },
) {
    const { assetId: rawAssetId } = await params;
    const assetId = Number(rawAssetId);

    if (!Number.isSafeInteger(assetId) || assetId < 1) {
        return NextResponse.json(
            { error: "Invalid asset ID." },
            { status: 400 },
        );
    }

    try {
        const asset = await prisma.storedAsset.findUnique({
            where: { id: assetId },
            select: {
                objectKey: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
            },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found." },
                { status: 404 },
            );
        }

        const object = await minio.send(
            new GetObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: asset.objectKey,
            }),
        );

        if (!object.Body) {
            return NextResponse.json(
                { error: "Stored asset has no content." },
                { status: 404 },
            );
        }

        const download = new URL(request.url).searchParams.get("download") === "1";
        const isImage = asset.mimeType?.startsWith("image/") ?? false;
        const disposition = download || !isImage ? "attachment" : "inline";
        const encodedFileName = encodeURIComponent(asset.originalFileName);
        const body = await object.Body.transformToByteArray();

        return new Response(new Uint8Array(body), {
            headers: {
                "Content-Type": asset.mimeType || "application/octet-stream",
                ...(asset.sizeBytes !== null
                    ? { "Content-Length": String(asset.sizeBytes) }
                    : {}),
                "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedFileName}`,
                "Cache-Control": "private, max-age=3600",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error(`Failed to retrieve story asset ${assetId}:`, error);
        return NextResponse.json(
            { error: "The stored asset could not be retrieved." },
            { status: 500 },
        );
    }
}
