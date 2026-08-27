import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            colonistId: string;
        }>;
    }
) {
    try {
        const { id, colonistId } = await params;

        const groupIdNumber = Number(id);
        const colonistIdNumber = Number(colonistId);

        const group = await prisma.group.findUnique({
            where: {
                id: groupIdNumber,
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
                id: colonistIdNumber,
            },
        });

        if (!colonist) {
            return NextResponse.json(
                { error: "Colonist not found" },
                { status: 404 }
            );
        }

        const membership =
            await prisma.colonistGroup.findUnique({
                where: {
                    colonistId_groupId: {
                        colonistId: colonistIdNumber,
                        groupId: groupIdNumber,
                    },
                },
            });

        if (!membership) {
            return NextResponse.json(
                {
                    error: "Colonist is not a member of this group",
                },
                { status: 404 }
            );
        }

        await prisma.colonistGroup.delete({
            where: {
                colonistId_groupId: {
                    colonistId: colonistIdNumber,
                    groupId: groupIdNumber,
                },
            },
        });

        return NextResponse.redirect(
            new URL(`/groups/${groupIdNumber}`, request.url)
        );
    } catch (error) {
        console.error(
            "Failed to remove colonist from group:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to remove colonist from group",
            },
            {
                status: 500,
            }
        );
    }
}