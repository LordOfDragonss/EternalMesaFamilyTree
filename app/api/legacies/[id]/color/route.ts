import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const legacyId = Number(id);

        const body = await request.json();
        const color = body.color?.trim();

        if (!color) {
            return NextResponse.json(
                { error: "Color is required" },
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

        await prisma.legacy.update({
            where: {
                id: legacyId,
            },
            data: {
                color,
            },
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Failed to update legacy color:", error);

        return NextResponse.json(
            { error: "Failed to update legacy color" },
            { status: 500 }
        );
    }
}