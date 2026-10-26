import { prisma } from "@/lib/prisma";
import type { ReferenceMaterialData } from "./types";

export async function getReferenceMaterialLibrary(): Promise<
    ReferenceMaterialData[]
> {
    return prisma.referenceMaterial.findMany({
        select: {
            id: true,
            title: true,
            kind: true,
            source: true,
            content: true,
            asset: {
                select: {
                    id: true,
                    originalFileName: true,
                    mimeType: true,
                    sizeBytes: true,
                },
            },
        },
        orderBy: [{ title: "asc" }, { id: "asc" }],
    });
}