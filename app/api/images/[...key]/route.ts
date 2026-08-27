import {
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import {
    minio,
    MINIO_BUCKET,
} from "@/lib/minio";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;

        const objectKey = key.join("/");

        const result = await minio.send(
            new GetObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
            })
        );

        if (!result.Body) {
            return NextResponse.json(
                {
                    error: "Image not found",
                },
                { status: 404 }
            );
        }

        const body = await result.Body.transformToByteArray();

        return new NextResponse(body.buffer as ArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type":
                    result.ContentType ?? "application/octet-stream",

                "Cache-Control":
                    "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Failed to retrieve image:", error);

        return NextResponse.json(
            {
                error: "Failed to retrieve image",
            },
            { status: 500 }
        );
    }
}