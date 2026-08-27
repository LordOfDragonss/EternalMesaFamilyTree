import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        id: string;
        colonistId: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: RouteContext
) {
    const { id, colonistId } = await params;

    const legacyId = Number(id);
    const parsedColonistId = Number(colonistId);

    if (
        Number.isNaN(legacyId) ||
        Number.isNaN(parsedColonistId)
    ) {
        return NextResponse.json(
            { error: "Invalid ID" },
            { status: 400 }
        );
    }

    const body = await request.json();

    const description =
        typeof body.description === "string" &&
        body.description.trim().length > 0
            ? body.description.trim()
            : null;

    const notable = await prisma.legacyNotableColonist.findUnique({
        where: {
            legacyId_colonistId: {
                legacyId,
                colonistId: parsedColonistId,
            },
        },
    });

    if (!notable) {
        return NextResponse.json(
            { error: "Notable colonist not found" },
            { status: 404 }
        );
    }

    const updated = await prisma.legacyNotableColonist.update({
        where: {
            legacyId_colonistId: {
                legacyId,
                colonistId: parsedColonistId,
            },
        },
        data: {
            description,
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(
    request: Request,
    { params }: RouteContext
) {
    const { id, colonistId } = await params;

    const legacyId = Number(id);
    const parsedColonistId = Number(colonistId);

    if (
        Number.isNaN(legacyId) ||
        Number.isNaN(parsedColonistId)
    ) {
        return NextResponse.json(
            { error: "Invalid ID" },
            { status: 400 }
        );
    }

    const notable = await prisma.legacyNotableColonist.findUnique({
        where: {
            legacyId_colonistId: {
                legacyId,
                colonistId: parsedColonistId,
            },
        },
    });

    if (!notable) {
        return NextResponse.json(
            { error: "Notable colonist not found" },
            { status: 404 }
        );
    }

    await prisma.legacyNotableColonist.delete({
        where: {
            legacyId_colonistId: {
                legacyId,
                colonistId: parsedColonistId,
            },
        },
    });

    return NextResponse.json({
        success: true,
    });
}