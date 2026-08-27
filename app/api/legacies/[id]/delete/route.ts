import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const legacyId = Number(id);

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

        await prisma.legacy.delete({
            where: {
                id: legacyId,
            },
        });

        return NextResponse.redirect(
            new URL("/legacies", request.url)
        );
    } catch (error) {
        console.error("Failed to delete legacy:", error);

        return NextResponse.json(
            { error: "Failed to delete legacy" },
            { status: 500 }
        );
    }
}