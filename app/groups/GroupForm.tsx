"use client";

import {
    Button,
    Stack,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useState } from "react";

type GroupFormProps = {
    group?: {
        id: number;
        name: string;
        description: string | null;
    };
};

export default function GroupForm({ group }: GroupFormProps) {
    const isEditing = !!group;

    const [name, setName] = useState(group?.name ?? "");
    const [description, setDescription] = useState(
        group?.description ?? ""
    );
    const [error, setError] = useState<string | null>(null);

    return (
        <form
            action={
                isEditing
                    ? `/api/groups/${group.id}/edit`
                    : "/api/groups"
            }
            method="POST"
            onSubmit={(event) => {
                if (!name.trim()) {
                    event.preventDefault();
                    setError("Group name is required.");
                    return;
                }

                setError(null);
            }}
        >
            <Stack gap="md">
                <TextInput
                    name="name"
                    label="Name"
                    placeholder="e.g. Eternals"
                    value={name}
                    onChange={(event) =>
                        setName(event.currentTarget.value)
                    }
                    required
                />

                <Textarea
                    name="description"
                    label="Description"
                    placeholder="Describe this group and its significance..."
                    minRows={4}
                    autosize
                    value={description}
                    onChange={(event) =>
                        setDescription(event.currentTarget.value)
                    }
                />

                {error && (
                    <div
                        style={{
                            color: "#fa5252",
                            fontSize: "0.875rem",
                        }}
                    >
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    color="mesa"
                >
                    {isEditing
                        ? "Save Changes"
                        : "Create Group"}
                </Button>
            </Stack>
        </form>
    );
}