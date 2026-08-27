import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
    const result =
        await prisma.colonist.updateMany({
            where: {
                OR: [
                    { deathYear: { not: null } },
                    { deathMonth: { not: null } },
                    { deathDay: { not: null } },
                ],
            },
            data: {
                isDead: true,
            },
        });

    console.log(
        `Marked ${result.count} colonists as dead.`
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });