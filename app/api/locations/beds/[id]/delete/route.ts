
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/getPublicUrl";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId)) {
        return NextResponse.redirect(
            new URL(
                "/locations/beds",
                getPublicUrl(request)
            )
        );
    }

    const bed =
        await prisma.doubleBed.findUnique({
            where: {
                id: bedId,
            },
            select: {
                id: true,
                locationId: true,
                screenshotURL: true,
            },
        });

    if (!bed) {
        return NextResponse.redirect(
            new URL(
                "/locations/beds",
                getPublicUrl(request)
            )
        );
    }

    // Delete the database record first.
    // Assignment history is removed through the
    // cascade relation on DoubleBed.
    await prisma.doubleBed.delete({
        where: {
            id: bedId,
        },
    });

    // Delete the bed's screenshot from MinIO.
    if (bed.screenshotURL) {
        try {
            await minio.send(
                new DeleteObjectCommand({
                    Bucket: MINIO_BUCKET,
                    Key: bed.screenshotURL,
                })
            );
        } catch (error) {
            console.error(
                `Failed to delete bed screenshot "${bed.screenshotURL}":`,
                error
            );
        }
    }

    return NextResponse.redirect(
        new URL(
            `/locations/beds?location=${bed.locationId}`,
            getPublicUrl(request)
        )
    );
}
