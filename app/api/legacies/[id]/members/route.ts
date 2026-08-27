import { getPublicUrl } from "@/lib/getPublicUrl";
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
        const colonistId = Number(formData.get("colonistId"));

        if (!colonistId) {
            return NextResponse.json(
                { error: "Colonist is required" },
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

        if (colonist.legacyId !== null) {
            return NextResponse.json(
                {
                    error: "Colonist already belongs to a legacy",
                },
                { status: 409 }
            );
        }

        await prisma.colonist.update({
            where: {
                id: colonistId,
            },
            data: {
                legacyId,
            },
        });

        return NextResponse.redirect(
            new URL(`/legacies/${legacyId}`, getPublicUrl(request))
        );
    } catch (error) {
        console.error(
            "Failed to add colonist to legacy:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to add colonist to legacy",
            },
            {
                status: 500,
            }
        );
    }
}