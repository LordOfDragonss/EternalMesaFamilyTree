import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { minio, MINIO_BUCKET } from "@/lib/minio";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    error: "No image file was provided",
                },
                { status: 400 }
            );
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                {
                    error: "The uploaded file is not an image",
                },
                { status: 400 }
            );
        }

        const extension = file.name.includes(".")
            ? file.name.substring(file.name.lastIndexOf("."))
            : "";

        const objectKey = `colonists/${randomUUID()}${extension}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await minio.send(
            new PutObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
                Body: buffer,
                ContentType: file.type,
            })
        );

        return NextResponse.json({
            success: true,
            key: objectKey,
            filename: file.name,
        });
    } catch (error) {
        console.error("Image upload failed:", error);

        return NextResponse.json(
            {
                error: "Failed to upload image",
            },
            { status: 500 }
        );
    }
}