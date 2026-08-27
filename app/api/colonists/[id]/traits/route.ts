import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const colonistId = Number(id);

    if (!Number.isInteger(colonistId)) {
        return NextResponse.json(
            { error: "Invalid colonist ID." },
            { status: 400 }
        );
    }

    const body = await request.json();
    const traitId = Number(body.traitId);

    if (!Number.isInteger(traitId)) {
        return NextResponse.json(
            { error: "Invalid trait ID." },
            { status: 400 }
        );
    }

    const colonist = await prisma.colonist.findUnique({
        where: {
            id: colonistId,
        },
    });

    if (!colonist) {
        return NextResponse.json(
            { error: "Colonist not found." },
            { status: 404 }
        );
    }

    const trait = await prisma.trait.findUnique({
        where: {
            id: traitId,
        },
    });

    if (!trait) {
        return NextResponse.json(
            { error: "Trait not found." },
            { status: 404 }
        );
    }

    await prisma.colonistTrait.upsert({
        where: {
            colonistId_traitId: {
                colonistId,
                traitId,
            },
        },
        update: {},
        create: {
            colonistId,
            traitId,
        },
    });

    return NextResponse.json({
        success: true,
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const colonistId = Number(id);

    if (!Number.isInteger(colonistId)) {
        return NextResponse.json(
            { error: "Invalid colonist ID." },
            { status: 400 }
        );
    }

    const body = await request.json();
    const traitId = Number(body.traitId);

    if (!Number.isInteger(traitId)) {
        return NextResponse.json(
            { error: "Invalid trait ID." },
            { status: 400 }
        );
    }

    await prisma.colonistTrait.deleteMany({
        where: {
            colonistId,
            traitId,
        },
    });

    return NextResponse.json({
        success: true,
    });
}