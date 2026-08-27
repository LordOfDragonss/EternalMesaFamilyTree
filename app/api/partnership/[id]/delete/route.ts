import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const relationshipId = Number(id);
        const formData = await request.formData();
        const returnTo = Number(formData.get("returnTo"));

        const relationship = await prisma.partnership.findUnique({
            where: {
                id: relationshipId,
            },
        });

        if (!relationship) {
            return Response.json(
                { error: "Partnership not found" },
                { status: 404 }
            );
        }

        await prisma.partnership.delete({
            where: {
                id: relationshipId,
            },
        });

        return Response.redirect(
            new URL(
                `/colonists/${returnTo}/edit`,
                getPublicUrl(request)
            )
        );
    } catch (error) {
        console.error(
            "Failed to delete partnership:",
            error
        );

        return Response.json(
            { error: "Failed to delete partnership" },
            { status: 500 }
        );
    }
}