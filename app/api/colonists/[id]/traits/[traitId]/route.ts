import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    _request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            traitId: string;
        }>;
    }
) {
    const { id, traitId } = await params;

    const colonistId = Number(id);
    const parsedTraitId = Number(traitId);

    if (!Number.isInteger(colonistId) || colonistId <= 0) {
        return NextResponse.json(
            { error: "Invalid colonist ID." },
            { status: 400 }
        );
    }

    if (!Number.isInteger(parsedTraitId) || parsedTraitId <= 0) {
        return NextResponse.json(
            { error: "Invalid trait ID." },
            { status: 400 }
        );
    }

    const colonistTrait = await prisma.colonistTrait.findUnique({
        where: {
            colonistId_traitId: {
                colonistId,
                traitId: parsedTraitId,
            },
        },
    });

    if (!colonistTrait) {
        return NextResponse.json(
            {
                error: "Trait is not assigned to this colonist.",
            },
            { status: 404 }
        );
    }

    await prisma.colonistTrait.delete({
        where: {
            colonistId_traitId: {
                colonistId,
                traitId: parsedTraitId,
            },
        },
    });

    return NextResponse.json({
        success: true,
    });
}