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

type ParentChildType =
    | "Biological"
    | "OvumDonor"
    | "Other";

type PartnershipType =
    | "Lover"
    | "Married"
    | "Ex";

type ParentRow = {
    id: string;
    colonistId: string;
    name?: string;
    type: ParentChildType;
    existing: boolean;
    relationshipId?: number;
};

type ChildRow = {
    id: string;
    colonistId: string;
    name?: string;
    type: ParentChildType;
    existing: boolean;
    relationshipId?: number;
};

type PartnerRow = {
    id: string;
    colonistId: string;
    name?: string;
    type: PartnershipType;
    existing: boolean;
    relationshipId?: number;
};

type Props = {
    colonistId: number;

    parentOptions: ColonistOption[];
    childOptions: ColonistOption[];
    partnerOptions: ColonistOption[];

    existingParents: {
        id: string;
        colonistId: string;
        name: string;
        type: ParentChildType;
        relationshipId: number;
    }[];

    existingChildren: {
        id: string;
        colonistId: string;
        name: string;
        type: ParentChildType;
        relationshipId: number;
    }[];

    existingPartners: {
        id: string;
        colonistId: string;
        name: string;
        type: PartnershipType;
        relationshipId: number;
    }[];
};

const relationshipTypes = [
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

export default function EditRelationships({
    colonistId,
    parentOptions,
    childOptions,
    partnerOptions,
    existingParents,
    existingChildren,
    existingPartners,
}: Props) {
    const [parents, setParents] = useState<ParentRow[]>(
        existingParents.map((parent) => ({
            id: parent.id,
            colonistId: parent.colonistId,
            name: parent.name,
            type: parent.type,
            existing: true,
            relationshipId: parent.relationshipId,
        }))
    );

    const [children, setChildren] = useState<ChildRow[]>(
        existingChildren.map((child) => ({
            id: child.id,
            colonistId: child.colonistId,
            name: child.name,
            type: child.type,
            existing: true,
            relationshipId: child.relationshipId,
        }))
    );

    const [partners, setPartners] = useState<PartnerRow[]>(
        existingPartners.map((partner) => ({
            id: partner.id,
            colonistId: partner.colonistId,
            name: partner.name,
            type: partner.type,
            existing: true,
            relationshipId: partner.relationshipId,
        }))
    );

    function addParent() {
        setParents((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Biological",
                existing: false,
            },
        ]);
    }

    function addChild() {
        setChildren((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Biological",
                existing: false,
            },
        ]);
    }

    function addPartner() {
        setPartners((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                colonistId: "",
                type: "Lover",
                existing: false,
            },
        ]);
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

    function removeNewParent(id: string) {
        setParents((current) =>
            current.filter((parent) => parent.id !== id)
        );
    }

    function removeNewChild(id: string) {
        setChildren((current) =>
            current.filter((child) => child.id !== id)
        );
    }

    function removeNewPartner(id: string) {
        setPartners((current) =>
            current.filter((partner) => partner.id !== id)
        );
    }

    function deleteExisting(
        endpoint: string
    ) {
        const form = document.createElement("form");

        form.method = "POST";
        form.action = endpoint;

        const returnInput = document.createElement("input");
        returnInput.type = "hidden";
        returnInput.name = "returnTo";
        returnInput.value = colonistId.toString();

        form.appendChild(returnInput);

        document.body.appendChild(form);
        form.submit();
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
                        {parent.existing ? (
                            <>
                                <Text
                                    style={{
                                        flex: 1,
                                        paddingBottom: 9,
                                    }}
                                >
                                    {parent.name}
                                </Text>

                                <form
                                    action={`/api/parent-child/${parent.relationshipId}/edit`}
                                    method="POST"
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="returnTo"
                                        value={colonistId}
                                    />

                                    <Select
                                        name="type"
                                        label="Relationship"
                                        data={relationshipTypes}
                                        defaultValue={parent.type}
                                        style={{ width: 160 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="light"
                                        color="mesa"
                                    >
                                        Save
                                    </Button>
                                </form>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove parent"
                                    onClick={() =>
                                        deleteExisting(
                                            `/api/parent-child/${parent.relationshipId}/delete`
                                        )
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </>
                        ) : (
                            <form
                                action={`/api/colonists/${colonistId}/parents`}
                                method="POST"
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    gap: "0.75rem",
                                    alignItems: "flex-end",
                                }}
                            >
                                <Select
                                    name="parentId"
                                    label="Parent"
                                    placeholder="Select a colonist"
                                    data={parentOptions}
                                    value={parent.colonistId}
                                    onChange={(value) =>
                                        updateParent(
                                            parent.id,
                                            "colonistId",
                                            value ?? ""
                                        )
                                    }
                                    searchable
                                    required
                                    style={{ flex: 1 }}
                                />

                                <Select
                                    name="type"
                                    label="Relationship"
                                    data={relationshipTypes}
                                    value={parent.type}
                                    onChange={(value) =>
                                        updateParent(
                                            parent.id,
                                            "type",
                                            value as ParentChildType
                                        )
                                    }
                                    style={{ width: 160 }}
                                />

                                <Button
                                    type="submit"
                                    variant="light"
                                    color="mesa"
                                    leftSection={<Plus size={16} />}
                                >
                                    Add
                                </Button>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove parent"
                                    onClick={() =>
                                        removeNewParent(parent.id)
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </form>
                        )}
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
                        {child.existing ? (
                            <>
                                <Text
                                    style={{
                                        flex: 1,
                                        paddingBottom: 9,
                                    }}
                                >
                                    {child.name}
                                </Text>

                                <form
                                    action={`/api/parent-child/${child.relationshipId}/edit`}
                                    method="POST"
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="returnTo"
                                        value={colonistId}
                                    />

                                    <Select
                                        name="type"
                                        label="Relationship"
                                        data={relationshipTypes}
                                        defaultValue={child.type}
                                        style={{ width: 160 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="light"
                                        color="mesa"
                                    >
                                        Save
                                    </Button>
                                </form>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove child"
                                    onClick={() =>
                                        deleteExisting(
                                            `/api/parent-child/${child.relationshipId}/delete`
                                        )
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </>
                        ) : (
                            <form
                                action={`/api/colonists/${colonistId}/children`}
                                method="POST"
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    gap: "0.75rem",
                                    alignItems: "flex-end",
                                }}
                            >
                                <Select
                                    name="childId"
                                    label="Child"
                                    placeholder="Select a colonist"
                                    data={childOptions}
                                    value={child.colonistId}
                                    onChange={(value) =>
                                        updateChild(
                                            child.id,
                                            "colonistId",
                                            value ?? ""
                                        )
                                    }
                                    searchable
                                    required
                                    style={{ flex: 1 }}
                                />

                                <Select
                                    name="type"
                                    label="Relationship"
                                    data={relationshipTypes}
                                    value={child.type}
                                    onChange={(value) =>
                                        updateChild(
                                            child.id,
                                            "type",
                                            value as ParentChildType
                                        )
                                    }
                                    style={{ width: 160 }}
                                />

                                <Button
                                    type="submit"
                                    variant="light"
                                    color="mesa"
                                >
                                    Add
                                </Button>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove child"
                                    onClick={() =>
                                        removeNewChild(child.id)
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </form>
                        )}
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
                        Romantic and former relationships for this colonist.
                    </Text>
                </div>

                {partners.map((partner) => (
                    <Group
                        key={partner.id}
                        align="flex-end"
                        wrap="nowrap"
                        gap="sm"
                    >
                        {partner.existing ? (
                            <>
                                <Text
                                    style={{
                                        flex: 1,
                                        paddingBottom: 9,
                                    }}
                                >
                                    {partner.name}
                                </Text>

                                <form
                                    action={`/api/partnership/${partner.relationshipId}/edit`}
                                    method="POST"
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="returnTo"
                                        value={colonistId}
                                    />

                                    <Select
                                        name="type"
                                        label="Relationship"
                                        data={partnershipTypes}
                                        defaultValue={partner.type}
                                        style={{ width: 160 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="light"
                                        color="mesa"
                                    >
                                        Save
                                    </Button>
                                </form>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove partner"
                                    onClick={() =>
                                        deleteExisting(
                                            `/api/partnership/${partner.relationshipId}/delete`
                                        )
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </>
                        ) : (
                            <form
                                action={`/api/colonists/${colonistId}/partnerships`}
                                method="POST"
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    gap: "0.75rem",
                                    alignItems: "flex-end",
                                }}
                            >
                                <Select
                                    name="partnerId"
                                    label="Partner"
                                    placeholder="Select a colonist"
                                    data={partnerOptions}
                                    value={partner.colonistId}
                                    onChange={(value) =>
                                        updatePartner(
                                            partner.id,
                                            "colonistId",
                                            value ?? ""
                                        )
                                    }
                                    searchable
                                    required
                                    style={{ flex: 1 }}
                                />

                                <Select
                                    name="type"
                                    label="Relationship"
                                    data={partnershipTypes}
                                    value={partner.type}
                                    onChange={(value) =>
                                        updatePartner(
                                            partner.id,
                                            "type",
                                            value as PartnershipType
                                        )
                                    }
                                    style={{ width: 160 }}
                                />

                                <Button
                                    type="submit"
                                    variant="light"
                                    color="mesa"
                                >
                                    Add
                                </Button>

                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label="Remove partner"
                                    onClick={() =>
                                        removeNewPartner(partner.id)
                                    }
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </form>
                        )}
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