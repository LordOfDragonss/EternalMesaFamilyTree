"use client";

import { useState } from "react";

export default function ImageTestPage() {
    const [message, setMessage] = useState("");

    async function upload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        setMessage("Uploading...");

        const response = await fetch("/api/images/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            setMessage(result.error ?? "Upload failed");
            return;
        }

        setMessage(`Uploaded: ${result.key}`);
    }

    return (
        <main style={{ padding: "2rem" }}>
            <h1>Image Upload Test</h1>

            <form onSubmit={upload}>
                <input
                    type="file"
                    name="file"
                    accept="image/*"
                    required
                />

                <button type="submit">
                    Upload
                </button>
            </form>

            {message && (
                <p>{message}</p>
            )}
        </main>
    );
}