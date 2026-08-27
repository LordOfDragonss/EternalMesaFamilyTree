import "dotenv/config";

import { prisma } from "../lib/prisma";

import { skillNames } from "./seed/skills";
import { expertiseDefinitions } from "./seed/expertises";
import { traits } from "./seed/traits";

async function seedSkills() {
    for (const name of skillNames) {
        await prisma.skill.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    console.log(`Seeded ${skillNames.length} skills.`);
}

async function seedColonistSkills() {
    const skills = await prisma.skill.findMany({
        orderBy: {
            id: "asc",
        },
    });

    const colonists = await prisma.colonist.findMany();

    for (const colonist of colonists) {
        for (const skill of skills) {
            await prisma.colonistSkill.upsert({
                where: {
                    colonistId_skillId: {
                        colonistId: colonist.id,
                        skillId: skill.id,
                    },
                },
                update: {},
                create: {
                    colonistId: colonist.id,
                    skillId: skill.id,
                    level: 0,
                    passion: "None",
                    isKnown: true,
                },
            });
        }
    }

    console.log(
        `Seeded ${skills.length} skills for ${colonists.length} colonists.`
    );
}

async function seedExpertises() {
    for (const definition of expertiseDefinitions) {
        const skill = await prisma.skill.findUnique({
            where: {
                name: definition.skill,
            },
        });

        if (!skill) {
            throw new Error(
                `Skill "${definition.skill}" not found for expertise "${definition.name}".`
            );
        }

        const expertise = await prisma.expertise.upsert({
            where: {
                name: definition.name,
            },
            update: {
                skillId: skill.id,
                description: definition.description,
            },
            create: {
                skillId: skill.id,
                name: definition.name,
                description: definition.description,
            },
        });

        for (const effect of definition.effects) {
            await prisma.expertiseEffect.upsert({
                where: {
                    expertiseId_name: {
                        expertiseId: expertise.id,
                        name: effect.name,
                    },
                },
                update: {
                    value: effect.value,
                    unit: effect.unit,
                },
                create: {
                    expertiseId: expertise.id,
                    name: effect.name,
                    value: effect.value,
                    unit: effect.unit,
                },
            });
        }
    }

    console.log(
        `Seeded ${expertiseDefinitions.length} expertises.`
    );
}

async function seedTraits() {
    for (const trait of traits) {
        await prisma.trait.upsert({
            where: {
                defName: trait.defName,
            },
            update: {
                name: trait.name,
                description: trait.description,
            },
            create: {
                defName: trait.defName,
                name: trait.name,
                description: trait.description,
            },
        });
    }

    console.log(`Seeded ${traits.length} traits.`);
}

async function main() {
    await seedSkills();
    await seedColonistSkills();
    await seedExpertises();
    await seedTraits();
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });