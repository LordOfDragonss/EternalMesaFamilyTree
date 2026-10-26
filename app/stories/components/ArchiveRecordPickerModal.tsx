"use client";

import { useMemo, useState } from "react";
import {
    Check,
    Link as LinkIcon,
    Search,
} from "lucide-react";
import {
    Modal,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import classes from "../story-editor.module.css";
import {
    ARCHIVE_RECORD_CATEGORIES,
    type ArchiveRecord,
    type ArchiveRecordCategory,
} from "../types";

type Props = {
    opened: boolean;
    records: ArchiveRecord[];
    onClose: () => void;
    onSelect: (record: ArchiveRecord) => void;
};

export default function ArchiveRecordPickerModal({
    opened,
    records,
    onClose,
    onSelect,
}: Props) {
    const [category, setCategory] = useState<ArchiveRecordCategory | "All">(
        "All",
    );
    const [search, setSearch] = useState("");

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();

        return records.filter((record) => {
            const categoryMatches =
                category === "All" || record.category === category;

            const searchMatches =
                !query ||
                record.title.toLocaleLowerCase().includes(query) ||
                record.category.toLocaleLowerCase().includes(query) ||
                record.subtitle?.toLocaleLowerCase().includes(query);

            return categoryMatches && searchMatches;
        });
    }, [records, category, search]);

    function closeModal() {
        setCategory("All");
        setSearch("");
        onClose();
    }

    return (
        <Modal
            opened={opened}
            onClose={closeModal}
            title="Link to an archive record"
            centered
            size="lg"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Select text to link that wording, or leave the cursor in
                    place to insert the record title as a new link.
                </Text>

                <Select
                    label="Record type"
                    value={category}
                    onChange={(value) =>
                        setCategory(
                            (value as ArchiveRecordCategory | "All") || "All",
                        )
                    }
                    data={[
                        { label: "All record types", value: "All" },
                        ...ARCHIVE_RECORD_CATEGORIES.map((item) => ({
                            label: item,
                            value: item,
                        })),
                    ]}
                    allowDeselect={false}
                />

                <TextInput
                    label="Search records"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.currentTarget.value)
                    }
                    leftSection={<Search size={15} />}
                />

                <ScrollArea.Autosize mah={320} type="auto">
                    <Stack gap="xs">
                        {filteredRecords.map((record) => (
                            <button
                                type="button"
                                key={record.key}
                                className={classes.archiveRecord}
                                onClick={() => {
                                    onSelect(record);
                                    closeModal();
                                }}
                            >
                                <span
                                    className={classes.recordColor}
                                    style={{
                                        backgroundColor:
                                            record.color ?? "#C8C4BC",
                                    }}
                                />

                                <span className={classes.recordText}>
                                    <span
                                        className={classes.recordTitle}
                                        style={{
                                            color: record.color ?? undefined,
                                        }}
                                    >
                                        {record.title}
                                    </span>

                                    <span className={classes.recordSubtitle}>
                                        {record.category}
                                        {record.subtitle
                                            ? ` · ${record.subtitle}`
                                            : ""}
                                    </span>
                                </span>

                                <Check
                                    size={16}
                                    className={classes.recordAction}
                                />
                            </button>
                        ))}

                        {filteredRecords.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="lg">
                                No matching records.
                            </Text>
                        )}
                    </Stack>
                </ScrollArea.Autosize>
            </Stack>
        </Modal>
    );
}