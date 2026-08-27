import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPublicUrl } from "@/lib/getPublicUrl";

export async function POST(request: Request) {
    try {
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

        const existingLegacy = await prisma.legacy.findUnique({
            where: {
                name,
            },
        });

        if (existingLegacy) {
            return NextResponse.json(
                { error: "A legacy with this name already exists" },
                { status: 409 }
            );
        }

        const legacy = await prisma.legacy.create({
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
                        : undefined,
            },
        });

        return NextResponse.redirect(
            new URL(`/legacies/${legacy.id}`, 
                getPublicUrl(request))
        );
    } catch (error) {
        console.error("Failed to create legacy:", error);

        return NextResponse.json(
            { error: "Failed to create legacy" },
            { status: 500 }
        );
    }
}