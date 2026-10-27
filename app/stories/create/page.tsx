import { prisma } from "@/lib/prisma";
import { getStoryArchiveRecords } from "../archive-records";
import { getReferenceMaterialLibrary } from "../reference-materials";
import StoryEditor from "../StoryEditor";

export default async function CreateStoryPage() {
    const [
        collections,
        tags,
        archiveRecords,
        references,
    ] = await Promise.all([
        prisma.storyCollection.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        }),
        prisma.tag.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        }),
        getStoryArchiveRecords(),
        getReferenceMaterialLibrary(),
    ]);

    return (
        <StoryEditor
            initialStory={null}
            initialAvailableCollections={collections.map(
                (collection) => collection.name,
            )}
            initialAvailableTags={tags.map((tag) => tag.name)}
            availableArchiveRecords={archiveRecords}
            initialAvailableReferences={references}
        />
    );
}