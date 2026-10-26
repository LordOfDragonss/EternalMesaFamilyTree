"use client";

import { useState } from "react";
import {
    Button,
    Card,
    Collapse,
    Group,
    Stack,
    Text,
    Textarea,
} from "@mantine/core";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function EditorialNotesSection({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <Card
            withBorder
            padding="md"
            radius="md"
            bg="#161616"
            style={{ borderColor: "#292929" }}
        >
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                        <Text fw={600}>Private editorial notes</Text>
                        <Text size="sm" c="dimmed">
                            Drafting reminders and research notes. These are private
                            and will not appear in the published story.
                        </Text>
                    </Stack>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        rightSection={
                            collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />
                        }
                        onClick={() => setCollapsed((current) => !current)}
                        aria-expanded={!collapsed}
                    >
                        {collapsed ? "Show notes" : "Hide notes"}
                    </Button>
                </Group>

                <Collapse expanded={!collapsed}>
                    <Textarea
                        aria-label="Private editorial notes"
                        placeholder="Record uncertainties, future edits, sources to check, or reminders for yourself..."
                        value={value}
                        onChange={(event) => onChange(event.currentTarget.value)}
                        minRows={4}
                        autosize
                    />
                </Collapse>
            </Stack>
        </Card>
    );
}
