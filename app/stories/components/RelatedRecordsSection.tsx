"use client";

import { useState } from "react";
import {
    Button,
    Card,
    Collapse,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import classes from "../story-editor.module.css";

export default function RelatedRecordsSection() {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <Card
            withBorder
            radius="md"
            p="md"
            className={classes.refrenceCard}
        >
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Stack gap={2}>
                        <Text fw={600}>Related archive records</Text>
                        <Text size="sm" c="dimmed">
                            Archive record linking has not been connected yet.
                        </Text>
                    </Stack>

                    <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        rightSection={
                            collapsed
                                ? <ChevronDown size={16} />
                                : <ChevronUp size={16} />
                        }
                        onClick={() => setCollapsed((value) => !value)}
                        aria-expanded={!collapsed}
                    >
                        {collapsed ? "Show records" : "Hide records"}
                    </Button>
                </Group>

                <Collapse expanded={!collapsed}>
                    <Text size="sm" c="dimmed">
                        This section will show records linked in the story text
                        and records added manually, including whether each
                        association is inline, manual, or both. The toolbar
                        already reserves its original position for linking
                        records.
                    </Text>
                </Collapse>
            </Stack>
        </Card>
    );
}