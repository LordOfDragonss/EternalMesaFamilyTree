import {
    S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT;
const bucket = process.env.MINIO_BUCKET;

if (!endpoint) {
    throw new Error("MINIO_ENDPOINT is not configured");
}

if (!bucket) {
    throw new Error("MINIO_BUCKET is not configured");
}

if (!process.env.MINIO_ACCESS_KEY) {
    throw new Error("MINIO_ACCESS_KEY is not configured");
}

if (!process.env.MINIO_SECRET_KEY) {
    throw new Error("MINIO_SECRET_KEY is not configured");
}

export const minio = new S3Client({
    region: process.env.MINIO_REGION ?? "us-east-1",

    endpoint,

    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
    },

    forcePathStyle: true,
});

export const MINIO_BUCKET = bucket;