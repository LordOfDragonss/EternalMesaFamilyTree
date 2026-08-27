import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { minio } from "@/lib/minio";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const bucket = process.env.MINIO_BUCKET;

        if (!bucket) {
            throw new Error("MINIO_BUCKET is not configured");
        }

        await minio.send(
            new HeadBucketCommand({
                Bucket: bucket,
            })
        );

        return NextResponse.json({
            success: true,
            bucket,
        });
    } catch (error) {
        console.error("MinIO test failed:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to connect to MinIO",
            },
            {
                status: 500,
            }
        );
    }
}