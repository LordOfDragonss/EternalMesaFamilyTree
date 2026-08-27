import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;

    const legacyId = Number(id);

    if (Number.isNaN(legacyId)) {
        return NextResponse.json(
            { error: "Invalid legacy ID" },
            { status: 400 }
        );
    }

    const formData = await request.formData();

    const colonistId = Number(
        formData.get("colonistId")
    );

    const descriptionValue = formData.get("description");

    const description =
        typeof descriptionValue === "string" &&
        descriptionValue.trim().length > 0
            ? descriptionValue.trim()
            : null;

    if (Number.isNaN(colonistId)) {
        return NextResponse.json(
            { error: "Invalid colonist ID" },
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

    const existing = await prisma.legacyNotableColonist.findUnique({
        where: {
            legacyId_colonistId: {
                legacyId,
                colonistId,
            },
        },
    });

    if (existing) {
        return NextResponse.json(
            { error: "Colonist is already notable in this legacy" },
            { status: 409 }
        );
    }

    await prisma.legacyNotableColonist.create({
        data: {
            legacyId,
            colonistId,
            description,
        },
    });

    return NextResponse.redirect(
        new URL(`/legacies/${legacyId}`, request.url)
    );
}