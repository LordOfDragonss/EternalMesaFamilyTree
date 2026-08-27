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

    const groupId = Number(id);

    if (Number.isNaN(groupId)) {
        return NextResponse.redirect(
            new URL("/groups", request.url)
        );
    }

    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
    });

    if (!group) {
        return NextResponse.redirect(
            new URL("/groups", request.url)
        );
    }

    await prisma.group.delete({
        where: {
            id: groupId,
        },
    });

    return NextResponse.redirect(
        new URL("/groups", request.url)
    );
}