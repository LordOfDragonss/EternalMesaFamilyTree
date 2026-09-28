import { prisma } from "@/lib/prisma";
import LegacyTracker from "./LegacyTracker";

export default async function LegacyTrackerPage() {
    const legacies = await prisma.legacy.findMany({
        include: {
            members: {
                include: {
                    children: {
                        select: {
                            id: true,
                        },
                    },
                    partnerARelationships: {
                        where: {
                            type: {
                                in: ["Lover", "Married"],
                            },
                        },
                        select: {
                            id: true,
                        },
                    },
                    partnerBRelationships: {
                        where: {
                            type: {
                                in: ["Lover", "Married"],
                            },
                        },
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <main style={{ padding: "2rem" }}>
            <LegacyTracker legacies={legacies} />
        </main>
    );
}