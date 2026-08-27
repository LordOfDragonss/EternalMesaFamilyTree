import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const colonistId = Number(id);

        await prisma.colonist.delete({
            where: {
                id: colonistId,
            },
        });

        return Response.redirect(
            new URL("/colonists", getPublicUrl(request))
        );
    } catch (error) {
        console.error("Failed to delete colonist:", error);

        return Response.json(
            { error: "Failed to delete colonist" },
            { status: 500 }
        );
    }
}