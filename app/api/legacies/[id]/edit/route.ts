import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const legacyId = Number(id);

        const formData = await request.formData();

        const name = (formData.get("name") as string)?.trim();

        const description =
            (formData.get("description") as string)?.trim() || null;

        const color =
            (formData.get("color") as string)?.trim() || null;

        const foundingColonistValue =
            formData.get("foundingColonistId");

        const foundingColonistId = foundingColonistValue
            ? Number(foundingColonistValue)
            : null;

        if (!name) {
            return NextResponse.json(
                { error: "Legacy name is required" },
                { status: 400 }
            );
        }

        const legacy = await prisma.legacy.findUnique({
            where: {
                id: legacyId,
            },
        });

        if (!legacy) {
            return NextResponse.json(
                { error: "Legacy not found" },
                { status: 404 }
            );
        }

        const duplicate = await prisma.legacy.findFirst({
            where: {
                name,
                NOT: {
                    id: legacyId,
                },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { error: "A legacy with this name already exists" },
                { status: 409 }
            );
        }

        if (foundingColonistId !== null) {
            const colonist = await prisma.colonist.findUnique({
                where: {
                    id: foundingColonistId,
                },
            });

            if (!colonist) {
                return NextResponse.json(
                    { error: "Founding colonist not found" },
                    { status: 404 }
                );
            }
        }

        await prisma.legacy.update({
            where: {
                id: legacyId,
            },
            data: {
                name,
                description,
                color,

                foundingColonist:
                    foundingColonistId !== null
                        ? {
                              connect: {
                                  id: foundingColonistId,
                              },
                          }
                        : {
                              disconnect: true,
                          },
            },
        });

        return NextResponse.redirect(
            new URL(`/legacies/${legacyId}`, request.url)
        );
    } catch (error) {
        console.error("Failed to edit legacy:", error);

        return NextResponse.json(
            { error: "Failed to edit legacy" },
            { status: 500 }
        );
    }
}