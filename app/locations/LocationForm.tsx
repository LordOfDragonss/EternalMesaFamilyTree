"use client";

import {
    ActionIcon,
    Button,
    Collapse,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from "@mantine/core";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
} from "lucide-react";
import { useState } from "react";

import LocationImageUpload from "./LocationImageUpload";

type PreviousName = {
    id: number;
    name: string;
};

type ColonistOption = {
    value: string;
    label: string;
    color: string | null;
};

type LegacyOption = {
    value: string;
    label: string;
    color: string | null;
};

type ExistingImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LocationFormProps = {
    location?: {
        id: number;
        name: string;
        type: string;
        description: string | null;
        previousNames: {
            id: number;
            name: string;
        }[];
        colonists: {
            id: number;
        }[];
        legacies: {
            id: number;
        }[];
        images: ExistingImage[];
    };
    colonistOptions: ColonistOption[];
    legacyOptions: LegacyOption[];
};

export default function LocationForm({
    location,
    colonistOptions,
    legacyOptions,
}: LocationFormProps) {
    const [previousNames, setPreviousNames] = useState<
        PreviousName[]
    >(
        location?.previousNames.map((previousName) => ({
            id: previousName.id,
            name: previousName.name,
        })) ?? []
    );

    const [selectedColonists, setSelectedColonists] =
        useState<string[]>(
            location?.colonists.map((colonist) =>
                colonist.id.toString()
            ) ?? []
        );

    const [selectedLegacies, setSelectedLegacies] =
        useState<string[]>(
            location?.legacies.map((legacy) =>
                legacy.id.toString()
            ) ?? []
        );

    const [colonistToAdd, setColonistToAdd] =
        useState<string | null>(null);

    const [legacyToAdd, setLegacyToAdd] =
        useState<string | null>(null);

    const [previousNamesOpen, setPreviousNamesOpen] =
        useState(false);

    const [colonistsOpen, setColonistsOpen] =
        useState(false);

    const [legaciesOpen, setLegaciesOpen] =
        useState(false);

    const [galleryOpen, setGalleryOpen] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    function addPreviousName() {
        setPreviousNames((current) => [
            ...current,
            {
                id: Date.now(),
                name: "",
            },
        ]);
    }

    function updatePreviousName(
        id: number,
        name: string
    ) {
        setPreviousNames((current) =>
            current.map((previousName) =>
                previousName.id === id
                    ? {
                        ...previousName,
                        name,
                    }
                    : previousName
            )
        );
    }

    function removePreviousName(id: number) {
        setPreviousNames((current) =>
            current.filter(
                (previousName) =>
                    previousName.id !== id
            )
        );
    }

    function addColonist() {
        if (!colonistToAdd) return;

        setSelectedColonists((current) => [
            ...current,
            colonistToAdd,
        ]);

        setColonistToAdd(null);
    }

    function removeColonist(id: string) {
        setSelectedColonists((current) =>
            current.filter(
                (colonistId) =>
                    colonistId !== id
            )
        );
    }

    function addLegacy() {
        if (!legacyToAdd) return;

        setSelectedLegacies((current) => [
            ...current,
            legacyToAdd,
        ]);

        setLegacyToAdd(null);
    }

    function removeLegacy(id: string) {
        setSelectedLegacies((current) =>
            current.filter(
                (legacyId) =>
                    legacyId !== id
            )
        );
    }

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
                isEditing
                    ? `/api/locations/${location.id}/edit`
                    : "/api/locations",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Location save failed:",
                    response.status,
                    response.statusText,
                    errorText
                );

                throw new Error(
                    `Failed to save location (${response.status})`
                );
            }

            window.location.href = response.url;
        } catch (error) {
            console.error(
                "Failed to save location:",
                error
            );

            setSaving(false);
        }
    }

    const availableColonists =
        colonistOptions.filter(
            (colonist) =>
                !selectedColonists.includes(
                    colonist.value
                )
        );

    const selectedColonistOptions =
        selectedColonists
            .map((id) =>
                colonistOptions.find(
                    (colonist) =>
                        colonist.value === id
                )
            )
            .filter(
                (
                    colonist
                ): colonist is ColonistOption =>
                    colonist !== undefined
            )
            .sort((a, b) =>
                a.label.localeCompare(b.label)
            );

    const availableLegacies =
        legacyOptions.filter(
            (legacy) =>
                !selectedLegacies.includes(
                    legacy.value
                )
        );

    const selectedLegacyOptions =
        selectedLegacies
            .map((id) =>
                legacyOptions.find(
                    (legacy) =>
                        legacy.value === id
                )
            )
            .filter(
                (
                    legacy
                ): legacy is LegacyOption =>
                    legacy !== undefined
            )
            .sort((a, b) =>
                a.label.localeCompare(b.label)
            );

    const isEditing = !!location;

    return (
        <form
            method="POST"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
        >
            <Stack gap="lg">
                {/* Basic Information */}
                <div>
                    <Title order={3}>
                        Basic Information
                    </Title>

                    <Text
                        c="dimmed"
                        size="sm"
                        mt={2}
                    >
                        The location's name, type, and description.
                    </Text>
                </div>

                <TextInput
                    name="name"
                    label="Name"
                    placeholder="Location name"
                    defaultValue={location?.name}
                    required
                />

                <Select
                    name="type"
                    label="Type"
                    placeholder="Select location type"
                    data={[
                        {
                            value: "PLAYABLE_MAP",
                            label: "Playable Map",
                        },
                        {
                            value: "OUTPOST",
                            label: "Outpost",
                        },
                        {
                            value: "OTHER",
                            label: "Other",
                        },
                    ]}
                    defaultValue={location?.type}
                    required
                />

                <Textarea
                    name="description"
                    label="Description"
                    placeholder="Describe this location..."
                    defaultValue={
                        location?.description ?? ""
                    }
                    autosize
                    minRows={4}
                />

                {/* Previous Names */}
                <div
                    style={{
                        marginTop: "1rem",
                    }}
                >
                    <Group
                        gap="xs"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            setPreviousNamesOpen(
                                (current) => !current
                            )
                        }
                    >
                        {previousNamesOpen ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}

                        <div>
                            <Title order={3}>
                                Previous Names
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                {previousNames.length > 0
                                    ? `${previousNames.length} previous name${previousNames.length === 1
                                        ? ""
                                        : "s"
                                    }`
                                    : "No previous names"}
                            </Text>
                        </div>
                    </Group>
                </div>

                <Collapse
                    expanded={previousNamesOpen}
                >
                    <Stack gap="sm">
                        <Group justify="flex-end">
                            <Button
                                type="button"
                                variant="subtle"
                                color="mesa"
                                leftSection={
                                    <Plus size={16} />
                                }
                                onClick={
                                    addPreviousName
                                }
                            >
                                Add name
                            </Button>
                        </Group>

                        {previousNames.length > 0 && (
                            <Stack gap="sm">
                                {previousNames.map(
                                    (
                                        previousName,
                                        index
                                    ) => (
                                        <Group
                                            key={
                                                previousName.id
                                            }
                                            align="flex-end"
                                            wrap="nowrap"
                                        >
                                            <TextInput
                                                label={`Previous name ${index + 1
                                                    }`}
                                                placeholder="Previous name"
                                                value={
                                                    previousName.name
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updatePreviousName(
                                                        previousName.id,
                                                        event
                                                            .currentTarget
                                                            .value
                                                    )
                                                }
                                                style={{
                                                    flex: 1,
                                                }}
                                            />

                                            <ActionIcon
                                                type="button"
                                                variant="subtle"
                                                color="red"
                                                size="lg"
                                                aria-label={`Remove previous name ${index + 1
                                                    }`}
                                                onClick={() =>
                                                    removePreviousName(
                                                        previousName.id
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={18}
                                                />
                                            </ActionIcon>

                                            <input
                                                type="hidden"
                                                name="previousNames[]"
                                                value={
                                                    previousName.name
                                                }
                                            />
                                        </Group>
                                    )
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Collapse>

                {/* Colonists */}
                <div
                    style={{
                        marginTop: "1rem",
                    }}
                >
                    <Group
                        gap="xs"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            setColonistsOpen(
                                (current) => !current
                            )
                        }
                    >
                        {colonistsOpen ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}

                        <div>
                            <Title order={3}>
                                Colonists
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                {selectedColonists.length > 0
                                    ? `${selectedColonists.length} associated colonist${selectedColonists.length === 1
                                        ? ""
                                        : "s"
                                    }`
                                    : "No associated colonists"}
                            </Text>
                        </div>
                    </Group>
                </div>

                <Collapse
                    expanded={colonistsOpen}
                >
                    <Stack gap="sm">
                        {selectedColonistOptions.length >
                            0 && (
                                <Stack gap="xs">
                                    {selectedColonistOptions.map(
                                        (colonist) => (
                                            <Group
                                                key={
                                                    colonist.value
                                                }
                                                justify="space-between"
                                                gap="xs"
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            colonist.color ??
                                                            "#a0a0a0",
                                                    }}
                                                >
                                                    {
                                                        colonist.label
                                                    }
                                                </Text>

                                                <ActionIcon
                                                    type="button"
                                                    variant="subtle"
                                                    color="red"
                                                    size="lg"
                                                    aria-label={`Remove ${colonist.label}`}
                                                    onClick={() =>
                                                        removeColonist(
                                                            colonist.value
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={18}
                                                    />
                                                </ActionIcon>

                                                <input
                                                    type="hidden"
                                                    name="colonistIds[]"
                                                    value={
                                                        colonist.value
                                                    }
                                                />
                                            </Group>
                                        )
                                    )}
                                </Stack>
                            )}

                        {selectedColonistOptions.length ===
                            0 && (
                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    No colonists are associated
                                    with this location yet.
                                </Text>
                            )}

                        {availableColonists.length >
                            0 && (
                                <Group
                                    align="flex-end"
                                    gap="xs"
                                    mt="xs"
                                >
                                    <Select
                                        label="Add colonist"
                                        placeholder="Select a colonist"
                                        data={
                                            availableColonists
                                        }
                                        value={
                                            colonistToAdd
                                        }
                                        onChange={
                                            setColonistToAdd
                                        }
                                        searchable
                                        clearable
                                        style={{
                                            flex: 1,
                                        }}
                                        renderOption={({
                                            option,
                                        }) => {
                                            const colonist =
                                                availableColonists.find(
                                                    (
                                                        item
                                                    ) =>
                                                        item.value ===
                                                        option.value
                                                );

                                            return (
                                                <span
                                                    style={{
                                                        color:
                                                            colonist?.color ??
                                                            "#a0a0a0",
                                                    }}
                                                >
                                                    {
                                                        option.label
                                                    }
                                                </span>
                                            );
                                        }}
                                    />

                                    <ActionIcon
                                        type="button"
                                        variant="filled"
                                        color="mesa"
                                        size="lg"
                                        aria-label="Add colonist"
                                        disabled={
                                            !colonistToAdd
                                        }
                                        onClick={
                                            addColonist
                                        }
                                    >
                                        <Plus size={18} />
                                    </ActionIcon>
                                </Group>
                            )}

                        {availableColonists.length ===
                            0 &&
                            selectedColonists.length >
                            0 && (
                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    All colonists are
                                    already associated
                                    with this location.
                                </Text>
                            )}
                    </Stack>
                </Collapse>

                {/* Legacies */}
                <div
                    style={{
                        marginTop: "1rem",
                    }}
                >
                    <Group
                        gap="xs"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            setLegaciesOpen(
                                (current) => !current
                            )
                        }
                    >
                        {legaciesOpen ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}

                        <div>
                            <Title order={3}>
                                Legacies
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                {selectedLegacies.length > 0
                                    ? `${selectedLegacies.length} associated legac${selectedLegacies.length === 1
                                        ? "y"
                                        : "ies"
                                    }`
                                    : "No associated legacies"}
                            </Text>
                        </div>
                    </Group>
                </div>

                <Collapse
                    expanded={legaciesOpen}
                >
                    <Stack gap="sm">
                        {selectedLegacyOptions.length >
                            0 && (
                                <Stack gap="xs">
                                    {selectedLegacyOptions.map(
                                        (legacy) => (
                                            <Group
                                                key={
                                                    legacy.value
                                                }
                                                justify="space-between"
                                                gap="xs"
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            legacy.color ??
                                                            "#a0a0a0",
                                                    }}
                                                >
                                                    {legacy.label}
                                                </Text>

                                                <ActionIcon
                                                    type="button"
                                                    variant="subtle"
                                                    color="red"
                                                    size="lg"
                                                    aria-label={`Remove ${legacy.label}`}
                                                    onClick={() =>
                                                        removeLegacy(
                                                            legacy.value
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={18}
                                                    />
                                                </ActionIcon>

                                                <input
                                                    type="hidden"
                                                    name="legacyIds[]"
                                                    value={
                                                        legacy.value
                                                    }
                                                />
                                            </Group>
                                        )
                                    )}
                                </Stack>
                            )}

                        {selectedLegacyOptions.length ===
                            0 && (
                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    No legacies are associated
                                    with this location yet.
                                </Text>
                            )}

                        {availableLegacies.length >
                            0 && (
                                <Group
                                    align="flex-end"
                                    gap="xs"
                                    mt="xs"
                                >
                                    <Select
                                        label="Add legacy"
                                        placeholder="Select a legacy"
                                        data={
                                            availableLegacies
                                        }
                                        value={
                                            legacyToAdd
                                        }
                                        onChange={
                                            setLegacyToAdd
                                        }
                                        searchable
                                        clearable
                                        style={{
                                            flex: 1,
                                        }}
                                        renderOption={({
                                            option,
                                        }) => {
                                            const legacy =
                                                availableLegacies.find(
                                                    (
                                                        item
                                                    ) =>
                                                        item.value ===
                                                        option.value
                                                );

                                            return (
                                                <span
                                                    style={{
                                                        color:
                                                            legacy?.color ??
                                                            "#a0a0a0",
                                                    }}
                                                >
                                                    {
                                                        option.label
                                                    }
                                                </span>
                                            );
                                        }}
                                    />

                                    <ActionIcon
                                        type="button"
                                        variant="filled"
                                        color="mesa"
                                        size="lg"
                                        aria-label="Add legacy"
                                        disabled={
                                            !legacyToAdd
                                        }
                                        onClick={
                                            addLegacy
                                        }
                                    >
                                        <Plus size={18} />
                                    </ActionIcon>
                                </Group>
                            )}

                        {availableLegacies.length ===
                            0 &&
                            selectedLegacies.length >
                            0 && (
                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    All legacies are
                                    already associated
                                    with this location.
                                </Text>
                            )}
                    </Stack>
                </Collapse>

                {/* Gallery */}
                <div
                    style={{
                        marginTop: "1rem",
                    }}
                >
                    <Group
                        gap="xs"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            setGalleryOpen(
                                (current) => !current
                            )
                        }
                    >
                        {galleryOpen ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}

                        <div>
                            <Title order={3}>
                                Gallery
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                {location?.images?.length
                                    ? `${location.images.length} image${location.images.length ===
                                        1
                                        ? ""
                                        : "s"
                                    }`
                                    : "No images"}
                            </Text>
                        </div>
                    </Group>
                </div>

                <Collapse expanded={galleryOpen}>
                    <LocationImageUpload
                        existingImages={
                            location?.images ?? []
                        }
                    />
                </Collapse>

                {/* Actions */}
                <Group
                    justify="flex-end"
                    mt="md"
                >
                    <Button
                        type="submit"
                        color="mesa"
                        size="md"
                        loading={saving}
                    >
                        {isEditing
                            ? "Save Changes"
                            : "Create Location"}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}