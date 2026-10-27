
import { prisma } from "@/lib/prisma";
import { getReferenceMaterialLibrary } from "@/app/stories/reference-materials";
import ReferenceMaterialLibrary from "./ReferenceMaterialLibrary";
import classes from "../story-library.module.css";

export default async function ReferenceMaterialsPage() {
    const [references, storyReferences] = await Promise.all([
        getReferenceMaterialLibrary(),
        prisma.storyReference.findMany({
            select: {
                referenceId: true,
                contextNote: true,
                story: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                story: {
                    title: "asc",
                },
            },
        }),
    ]);

    const storiesByReference = new Map<
        number,
        {
            id: number;
            title: string;
            contextNote: string | null;
        }[]
    >();

    for (const association of storyReferences) {
        const stories = storiesByReference.get(association.referenceId) ?? [];

        stories.push({
            id: association.story.id,
            title: association.story.title,
            contextNote: association.contextNote,
        });

        storiesByReference.set(association.referenceId, stories);
    }

    const referencesWithStories = references.map((reference) => ({
        ...reference,
        stories: storiesByReference.get(reference.id) ?? [],
    }));

    return (
        <main className={classes.page}>
            <ReferenceMaterialLibrary initialReferences={referencesWithStories} />
        </main>
    );
}
