import { prisma } from "@/lib/prisma";
import StoryCollectionsManager from "./StoryCollectionsManager";
import classes from "../story-library.module.css";

export default async function StoryCollectionsPage() {
    const collections = await prisma.storyCollection.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    stories: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <main className={classes.page}>
            <StoryCollectionsManager collections={collections} />
        </main>
    );
}