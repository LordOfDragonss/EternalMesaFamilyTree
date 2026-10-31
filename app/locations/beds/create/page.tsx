import { prisma } from "@/lib/prisma";
import BedForm from "../BedForm";

export default async function CreateBedPage() {
    const locations =
        await prisma.location.findMany({
            where: {
                type: "PLAYABLE_MAP",
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
            },
        });

    return (
        <BedForm
            mode="create"
            locations={locations.map((location) => ({
                value: String(location.id),
                label: location.name,
            }))}
        />
    );
}