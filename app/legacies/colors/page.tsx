import { prisma } from "@/lib/prisma";
import LegacyColorComparison from "./LegacyColorComparison";

export default async function LegacyColorsPage() {
    const legacies = await prisma.legacy.findMany({
        select: {
            id: true,
            name: true,
            color: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <main style={{ padding: "2rem" }}>
            <LegacyColorComparison legacies={legacies} />
        </main>
    );
}