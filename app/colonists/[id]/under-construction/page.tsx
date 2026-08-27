import { prisma } from "@/lib/prisma";

import ColonistTabUnderConstruction from "../ColonistTabUnderConstruction";

export default async function ColonistUnderConstructionPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ section?: string }>;
}) {
    const { id } = await params;
    const { section } = await searchParams;

    const colonistId = Number(id);

    const colonist = await prisma.colonist.findUnique({
        where: {
            id: colonistId,
        },
        include: {
            legacy: true,
        },
    });

    if (!colonist) {
        return <h1>Colonist not found</h1>;
    }

    const displaySection = section
        ? section.charAt(0).toUpperCase() + section.slice(1)
        : "Under Construction";

    return (
        <ColonistTabUnderConstruction
            colonist={colonist}
            section={displaySection}
        />
    );
}