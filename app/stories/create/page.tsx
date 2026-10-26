import { prisma } from "@/lib/prisma";
import { getStoryArchiveRecords } from "../archive-records";
import { getReferenceMaterialLibrary } from "../reference-materials";
import StoryEditor from "../StoryEditor";

export default async function CreateStoryPage() {
    const [collections, archiveRecords, references] = await Promise.all([
        prisma.storyCollection.findMany({
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
            availableArchiveRecords={archiveRecords}
            initialAvailableReferences={references}
        />
    );
}