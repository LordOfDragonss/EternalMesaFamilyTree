import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const name = (formData.get("name") as string)?.trim();
        const description =
            (formData.get("description") as string)?.trim() || null;

        if (!name) {
            return NextResponse.json(
                { error: "Group name is required." },
                { status: 400 }
            );
        }

        const group = await prisma.group.create({
            data: {
                name,
                description,
            },
        });

        return NextResponse.redirect(
            new URL(`/groups/${group.id}`, request.url)
        );
    } catch (error) {
        console.error("Failed to create group:", error);

        return NextResponse.json(
            { error: "Failed to create group." },
            { status: 500 }
        );
    }
}