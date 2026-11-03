"use client";

import {
    ActionIcon,
    Card,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Pencil, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import EditRelationships, {
    type EditRelationshipsProps,
} from "../edit/EditRelationships";

type Props = Omit<EditRelationshipsProps, "returnToPath"> & {
    children: ReactNode;
};

export default function FamilyRelationshipsEditor({ children, ...editorProps }: Props) {
    const [editing, setEditing] = useState(false);

    return (
        <>
            <Group justify="flex-end">
                <Tooltip label={editing ? "Close relationship editor" : "Edit relationships"}>
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label={editing ? "Close relationship editor" : "Edit relationships"}
                        onClick={() => setEditing((current) => !current)}
                    >
                        {editing ? <X size={20} /> : <Pencil size={20} />}
                    </ActionIcon>
                </Tooltip>
            </Group>

            {editing ? (
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{ borderColor: "#292929" }}
                >
                    <Stack gap="xl">
                        <div>
                            <Title order={3}>Edit relationships</Title>
                            <Text c="dimmed" size="sm" mt={2}>
                                Manage this colonist&apos;s parents, children and partnerships.
                            </Text>
                        </div>

                        <EditRelationships
                            {...editorProps}
                            returnToPath={`/colonists/${editorProps.colonistId}/family`}
                        />
                    </Stack>
                </Card>
            ) : (
                children
            )}
        </>
    );
}
