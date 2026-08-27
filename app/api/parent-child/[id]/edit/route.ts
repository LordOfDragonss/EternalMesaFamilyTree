import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relationshipId = Number(id);
    const formData = await request.formData();
    const returnTo = Number(formData.get("returnTo"));
    const type = formData.get("type") as
    | "Biological"
    | "OvumDonor"
    | "Other";

    const relationship = await prisma.parentChild.findUnique({
      where: {
        id: relationshipId,
      },
    });

    if(!relationship){
      return Response.json(
        {error: "Parent-child relationship not found"},
        {status: 404}
      )
    }

    await prisma.parentChild.update({
        where: {
          id: relationshipId
        },
        data: {
          type: type,
        },
      });

    return Response.redirect(
      new URL(`/colonists/${returnTo}/edit`, request.url)
    );
  } catch (error) {
    console.error("Failed to update parent-child relationship:", error);

    return Response.json(
      { error: "Failed to update parent-child relationship" },
      { status: 500 }
    );
  }
}