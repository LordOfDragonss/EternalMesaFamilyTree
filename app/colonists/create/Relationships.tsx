"use client";

import {
    ActionIcon,
    Button,
    Group,
    Select,
    Stack,
    Text,
} from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type ColonistOption = {
    value: string;
    label: string;
};

type RelationshipType =
    | "Biological"
    | "OvumDonor"
    | "Other";

type ParentRow = {
    id: string;
    colonistId: string;
    type: RelationshipType;
};

type ChildRow = {
    id: string;
    colonistId: string;
    type: RelationshipType;
};

type PartnerRow = {
    id: string;
    colonistId: string;
    type: "Lover" | "Married" | "Ex";
};

type RelationshipsProps = {
    colonistOptions: ColonistOption[];
};

const parentTypes = [
    {
        value: "Biological",
        label: "Biological",
    },
    {
        value: "OvumDonor",
        label: "Ovum donor",
    },
    {
        value: "Other",
        label: "Other",
    },
];

const partnershipTypes = [
    {
        value: "Lover",
        label: "Lover",
    },
    {
        value: "Married",
        label: "Married",
    },
    {
        value: "Ex",
        label: "Ex",
    },
];

export default function Relationships({
    colonistOptions,
}: RelationshipsProps) {
    const [parents, setParents] = useState<ParentRow[]>([]);
    const [children, setChildren] = useState<ChildRow[]>([]);
    const [partners, setPartners] = useState<PartnerRow[]>([]);

    function addParent() {
        setParents((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Biological",
            },
        ]);
    }

    function removeParent(id: string) {
        setParents((current) =>
            current.filter((parent) => parent.id !== id)
        );
    }

    function updateParent(
        id: string,
        field: "colonistId" | "type",
        value: string
    ) {
        setParents((current) =>
            current.map((parent) =>
                parent.id === id
                    ? {
                        ...parent,
                        [field]: value,
                    }
                    : parent
            )
        );
    }

    function addChild() {
        setChildren((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Biological",
            },
        ]);
    }

    function removeChild(id: string) {
        setChildren((current) =>
            current.filter((child) => child.id !== id)
        );
    }

    function updateChild(
        id: string,
        field: "colonistId" | "type",
        value: string
    ) {
        setChildren((current) =>
            current.map((child) =>
                child.id === id
                    ? {
                        ...child,
                        [field]: value,
                    }
                    : child
            )
        );
    }

    function addPartner() {
        setPartners((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Lover",
            },
        ]);
    }

    function removePartner(id: string) {
        setPartners((current) =>
            current.filter((partner) => partner.id !== id)
        );
    }

    function updatePartner(
        id: string,
        field: "colonistId" | "type",
        value: string
    ) {
        setPartners((current) =>
            current.map((partner) =>
                partner.id === id
                    ? {
                        ...partner,
                        [field]: value,
                    }
                    : partner
            )
        );
    }

    return (
        <Stack gap="xl">
            {/* Parents */}
            <Stack gap="sm">
                <div>
                    <Text fw={600}>Parents</Text>
                    <Text size="xs" c="dimmed">
                        Existing colonists who are parents of this colonist.
                    </Text>
                </div>

                {parents.map((parent) => (
                    <Group
                        key={parent.id}
                        align="flex-end"
                        wrap="nowrap"
                        gap="sm"
                    >
                        <Select
                            name="parentId[]"
                            label="Parent"
                            placeholder="Select a colonist"
                            data={colonistOptions}
                            value={parent.colonistId}
                            onChange={(value) =>
                                updateParent(
                                    parent.id,
                                    "colonistId",
                                    value ?? ""
                                )
                            }
                            searchable
                            style={{ flex: 1 }}
                        />

                        <Select
                            name="parentType[]"
                            label="Relationship"
                            data={parentTypes}
                            value={parent.type}
                            onChange={(value) =>
                                updateParent(
                                    parent.id,
                                    "type",
                                    value as RelationshipType
                                )
                            }
                            style={{ width: 160 }}
                        />

                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="red"
                            size="lg"
                            aria-label="Remove parent"
                            onClick={() => removeParent(parent.id)}
                        >
                            <Trash2 size={18} />
                        </ActionIcon>
                    </Group>
                ))}

                <Button
                    type="button"
                    variant="light"
                    color="mesa"
                    leftSection={<Plus size={16} />}
                    onClick={addParent}
                    style={{ alignSelf: "flex-start" }}
                >
                    Add parent
                </Button>
            </Stack>

            {/* Children */}
            <Stack gap="sm">
                <div>
                    <Text fw={600}>Children</Text>
                    <Text size="xs" c="dimmed">
                        Existing colonists who are children of this colonist.
                    </Text>
                </div>

                {children.map((child) => (
                    <Group
                        key={child.id}
                        align="flex-end"
                        wrap="nowrap"
                        gap="sm"
                    >
                        <Select
                            name="childId[]"
                            label="Child"
                            placeholder="Select a colonist"
                            data={colonistOptions}
                            value={child.colonistId}
                            onChange={(value) =>
                                updateChild(
                                    child.id,
                                    "colonistId",
                                    value ?? ""
                                )
                            }
                            searchable
                            style={{ flex: 1 }}
                        />

                        <Select
                            name="childType[]"
                            label="Relationship"
                            data={parentTypes}
                            value={child.type}
                            onChange={(value) =>
                                updateChild(
                                    child.id,
                                    "type",
                                    value as RelationshipType
                                )
                            }
                            style={{ width: 160 }}
                        />

                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="red"
                            size="lg"
                            aria-label="Remove child"
                            onClick={() => removeChild(child.id)}
                        >
                            <Trash2 size={18} />
                        </ActionIcon>
                    </Group>
                ))}

                <Button
                    type="button"
                    variant="light"
                    color="mesa"
                    leftSection={<Plus size={16} />}
                    onClick={addChild}
                    style={{ alignSelf: "flex-start" }}
                >
                    Add child
                </Button>
            </Stack>

            {/* Partners */}
            <Stack gap="sm">
                <div>
                    <Text fw={600}>Partners</Text>
                    <Text size="xs" c="dimmed">
                        Add romantic or former relationships for this colonist.
                    </Text>
                </div>

                {partners.map((partner) => (
                    <Group
                        key={partner.id}
                        align="flex-end"
                        wrap="nowrap"
                        gap="sm"
                    >
                        <Select
                            name="partnerId[]"
                            label="Partner"
                            placeholder="Select a colonist"
                            data={colonistOptions}
                            value={partner.colonistId}
                            onChange={(value) =>
                                updatePartner(
                                    partner.id,
                                    "colonistId",
                                    value ?? ""
                                )
                            }
                            searchable
                            style={{ flex: 1 }}
                        />

                        <Select
                            name="partnerType[]"
                            label="Relationship"
                            data={partnershipTypes}
                            value={partner.type}
                            onChange={(value) =>
                                updatePartner(
                                    partner.id,
                                    "type",
                                    value as PartnerRow["type"]
                                )
                            }
                            style={{ width: 160 }}
                        />

                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="red"
                            size="lg"
                            aria-label="Remove partner"
                            onClick={() => removePartner(partner.id)}
                        >
                            <Trash2 size={18} />
                        </ActionIcon>
                    </Group>
                ))}

                <Button
                    type="button"
                    variant="light"
                    color="mesa"
                    leftSection={<Plus size={16} />}
                    onClick={addPartner}
                    style={{ alignSelf: "flex-start" }}
                >
                    Add partner
                </Button>
            </Stack>
        </Stack>
    );
}