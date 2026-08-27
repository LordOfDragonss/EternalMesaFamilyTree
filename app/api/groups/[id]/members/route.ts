import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const groupId = Number(id);

        const formData = await request.formData();
        const colonistId = Number(formData.get("colonistId"));

        if (!colonistId) {
            return NextResponse.json(
                { error: "Colonist is required" },
                { status: 400 }
            );
        }

        const group = await prisma.group.findUnique({
            where: {
                id: groupId,
            },
        });

        if (!group) {
            return NextResponse.json(
                { error: "Group not found" },
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

        const existingMembership =
            await prisma.colonistGroup.findUnique({
                where: {
                    colonistId_groupId: {
                        colonistId,
                        groupId,
                    },
                },
            });

        if (existingMembership) {
            return NextResponse.json(
                {
                    error: "Colonist already belongs to this group",
                },
                { status: 409 }
            );
        }

        await prisma.colonistGroup.create({
            data: {
                colonistId,
                groupId,
            },
        });

        return NextResponse.redirect(
            new URL(`/groups/${groupId}`, getPublicUrl(request))
        );
    } catch (error) {
        console.error(
            "Failed to add colonist to group:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to add colonist to group",
            },
            {
                status: 500,
            }
        );
    }
}