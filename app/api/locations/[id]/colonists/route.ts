import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const locationId = Number(id);

        const formData = await request.formData();
        const colonistId = Number(formData.get("colonistId"));

        if (!colonistId) {
            return NextResponse.json(
                { error: "Colonist is required" },
                { status: 400 }
            );
        }

        const location = await prisma.location.findUnique({
            where: {
                id: locationId,
            },
        });

        if (!location) {
            return NextResponse.json(
                { error: "Location not found" },
                { status: 404 }
            );
        }

        const colonist = await prisma.colonist.findUnique({
            where: {
                id: colonistId,
            },
        });

        if (!colonist) {
            return NextResponse.json(
                { error: "Colonist not found" },
                { status: 404 }
            );
        }

        const alreadyAssociated =
            await prisma.location.findFirst({
                where: {
                    id: locationId,
                    colonists: {
                        some: {
                            id: colonistId,
                        },
                    },
                },
            });

        if (alreadyAssociated) {
            return NextResponse.json(
                {
                    error: "Colonist is already associated with this location",
                },
                { status: 409 }
            );
        }

        await prisma.location.update({
            where: {
                id: locationId,
            },
            data: {
                colonists: {
                    connect: {
                        id: colonistId,
                    },
                },
            },
        });

        return NextResponse.redirect(
            new URL(
                `/locations/${locationId}/colonists`,
                getPublicUrl(request)
            )
        );
    } catch (error) {
        console.error(
            "Failed to add colonist to location:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to add colonist to location",
            },
            {
                status: 500,
            }
        );
    }
}