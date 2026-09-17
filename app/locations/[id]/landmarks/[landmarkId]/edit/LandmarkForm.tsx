"use client";

import {
    ActionIcon,
    Button,
    Card,
    Group,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import LocationLandmarkImageUpload from "../../LocationLandmarkImageUpload";

type ExistingImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LandmarkFormProps = {
    locationId: number;
    landmark: {
        id: number;
        name: string;
        description: string | null;
        images: ExistingImage[];
    };
};

export default function LandmarkForm({
    locationId,
    landmark,
}: LandmarkFormProps) {
    const [saving, setSaving] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData(
                event.currentTarget
            );

            const response = await fetch(
                `/api/locations/${locationId}/landmarks/${landmark.id}/edit`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText =
                    await response.text();

                console.error(
                    "Landmark save failed:",
                    response.status,
                    response.statusText,
                    errorText
                );

                throw new Error(
                    `Failed to save landmark (${response.status})`
                );
            }

            window.location.href = response.url;
        } catch (error) {
            console.error(
                "Failed to save landmark:",
                error
            );

            setSaving(false);
        }
    }

    return (
        <form
            method="POST"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
        >
            <Stack gap="lg">
                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <div>
                        <Title order={2}>
                            Edit Landmark
                        </Title>

                        <Text
                            c="dimmed"
                            size="sm"
                            mt={2}
                        >
                            Edit information about this landmark.
                        </Text>
                    </div>

                    <Tooltip label="Back to landmark">
                        <ActionIcon
                            component="a"
                            href={`/locations/${locationId}/landmarks/${landmark.id}`}
                            variant="subtle"
                            color="mesa"
                            size="lg"
                            aria-label="Back to landmark"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <TextInput
                    name="name"
                    label="Name"
                    placeholder="e.g. Oven Hotel"
                    defaultValue={landmark.name}
                    required
                />

                <Textarea
                    name="description"
                    label="Description"
                    placeholder="Describe this landmark..."
                    defaultValue={
                        landmark.description ?? ""
                    }
                    minRows={4}
                />

                <div>
                    <Text fw={500} mb="xs">
                        Images
                    </Text>

                    <LocationLandmarkImageUpload
                        existingImages={landmark.images}
                    />
                </div>

                <Group justify="flex-end">
                    <Button
                        type="submit"
                        color="mesa"
                        loading={saving}
                    >
                        Save Changes
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}