import { getPublicUrl } from "@/lib/getPublicUrl";
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
            new URL("/groups", getPublicUrl(request))
        );
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description");

    if (typeof name !== "string" || !name.trim()) {
        return NextResponse.redirect(
            new URL(`/groups/${groupId}/edit`, getPublicUrl(request))
        );
    }

    const existingGroup = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
    });

    if (!existingGroup) {
        return NextResponse.redirect(
            getPublicUrl(request)
        );
    }

    const group = await prisma.group.update({
        where: {
            id: groupId,
        },
        data: {
            name: name.trim(),
            description:
                typeof description === "string" &&
                description.trim()
                    ? description.trim()
                    : null,
        },
    });

    return NextResponse.redirect(
        new URL(`/groups/${group.id}`, getPublicUrl(request))
    );
}