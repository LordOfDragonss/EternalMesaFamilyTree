import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import BedForm from "../../BedForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditBedPage({
    params,
}: Props) {
    const { id } = await params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId) || bedId <= 0) {
        notFound();
    }

    const [bed, locations] = await Promise.all([
        prisma.doubleBed.findUnique({
            where: {
                id: bedId,
            },
            select: {
                id: true,
                name: true,
                screenshotURL: true,
                notes: true,
                locationId: true,
            },
        }),

        prisma.location.findMany({
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
        }),
    ]);

    if (!bed) {
        notFound();
    }

    return (
        <BedForm
            mode="edit"
            bedId={bed.id}
            locations={locations.map((location) => ({
                value: String(location.id),
                label: location.name,
            }))}
            initialLocationId={bed.locationId}
            initialName={bed.name}
            initialScreenshot={bed.screenshotURL}
            initialNotes={bed.notes}
        />
    );
}