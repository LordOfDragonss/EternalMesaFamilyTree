import { ActionIcon, Group, Text, Title, Tooltip } from "@mantine/core";
import { ArrowLeft, Pencil } from "lucide-react";

type LocationHeaderProps = {
    location: {
        id: number;
        name: string;
        type: string;
        previousNames: {
            name: string;
        }[];
    };
};

export default function LocationHeader({
    location,
}: LocationHeaderProps) {
    const locationType = location.type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const visiblePreviousNames =
        location.previousNames.slice(0, 3);

    const hiddenPreviousNameCount = Math.max(
        location.previousNames.length - 3,
        0
    );

    return (
        <Group justify="space-between" align="flex-start">
            <div>
                <Title order={1}>
                    {location.name}
                </Title>

                <Text
                    mt={4}
                    fw={500}
                    c="mesa"
                >
                    {locationType}
                </Text>

                {visiblePreviousNames.length > 0 && (
                    <Text
                        size="sm"
                        c="dimmed"
                        mt={6}
                    >
                        Previously:{" "}
                        {visiblePreviousNames
                            .map((previousName) => previousName.name)
                            .join(" → ")}
                        {hiddenPreviousNameCount > 0 &&
                            ` → +${hiddenPreviousNameCount} more`}
                    </Text>
                )}
            </div>

            <Group gap="xs">
                <Tooltip label="Back to locations">
                    <ActionIcon
                        component="a"
                        href="/locations"
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label="Back to locations"
                    >
                        <ArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Edit location">
                    <ActionIcon
                        component="a"
                        href={`/locations/${location.id}/edit`}
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label="Edit location"
                    >
                        <Pencil size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
    );
}