import { prisma } from "@/lib/prisma";
import FamilyTree from "@/app/components/FamilyTree";

export default async function FamilyTreePage() {
    const colonists = await prisma.colonist.findMany({
        include: {
            legacy: true,
        },
        orderBy: {
            id: "asc",
        },
    });

    const parentChildren = await prisma.parentChild.findMany({
        select: {
            parentId: true,
            childId: true,
        },
    });

    const partnerships = await prisma.partnership.findMany({
        select: {
            partnerAId: true,
            partnerBId: true,
        },
    });

    return (
        <FamilyTree
            colonists={colonists}
            parentChildren={parentChildren}
            partnerships={partnerships}
        />
    );
}