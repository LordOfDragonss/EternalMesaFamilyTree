import { prisma } from "@/lib/prisma";
import { Stack } from "@mantine/core";
import ColonistNavigation from "../ColonistNavigation";
import ColonistHeader from "@/app/components/ColonistHeader";
import SkillsCard from "./SkillsCard";
import ExpertiseCard from "./ExpertiseCard";

export default async function ColonistSkillsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const colonistId = Number(id);

    const colonist =
        await prisma.colonist.findUnique({
            where: {
                id: colonistId,
            },
            include: {
                legacy: true,

                colonistSkills: {
                    include: {
                        skill: true,

                        expertises: {
                            include: {
                                expertise: {
                                    include: {
                                        skill: true,
                                        effects: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        skillId: "asc",
                    },
                },
            },
        });

    if (!colonist) {
        return <h1>Colonist not found</h1>;
    }

    const availableExpertises =
        await prisma.expertise.findMany({
            include: {
                skill: true,
                effects: true,
            },
            orderBy: [
                {
                    skillId: "asc",
                },
                {
                    id: "asc",
                },
            ],
        });

    const expertises =
        colonist.colonistSkills.flatMap(
            (colonistSkill) =>
                colonistSkill.expertises
        );

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <ColonistHeader
                    colonist={colonist}
                />

                <ColonistNavigation
                    colonistId={colonist.id}
                />

                <SkillsCard
                    colonistId={colonist.id}
                    skills={colonist.colonistSkills}
                />

                <ExpertiseCard
                    colonistId={colonist.id}
                    expertises={expertises}
                    availableExpertises={
                        availableExpertises
                    }
                />
            </Stack>
        </main>
    );
}