import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            colonistId: string;
        }>;
    }
) {
    try {
        const { id, colonistId } = await params;

        const locationId = Number(id);
        const colonistIdNumber = Number(colonistId);

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
                id: colonistIdNumber,
            },
        });

        if (!colonist) {
            return NextResponse.json(
                { error: "Colonist not found" },
                { status: 404 }
            );
        }

        const associated =
            await prisma.location.findFirst({
                where: {
                    id: locationId,
                    colonists: {
                        some: {
                            id: colonistIdNumber,
                        },
                    },
                },
            });

        if (!associated) {
            return NextResponse.json(
                {
                    error: "Colonist is not associated with this location",
                },
                { status: 404 }
            );
        }

        await prisma.location.update({
            where: {
                id: locationId,
            },
            data: {
                colonists: {
                    disconnect: {
                        id: colonistIdNumber,
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
            "Failed to remove colonist from location:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to remove colonist from location",
            },
            {
                status: 500,
            }
        );
    }
}