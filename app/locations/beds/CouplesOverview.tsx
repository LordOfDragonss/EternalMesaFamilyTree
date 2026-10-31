import {
    Box,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Blend, Heart } from "lucide-react";

type CoupleColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: {
        color: string | null;
    } | null;
};

type CoupleBed = {
    bedId: number;
    bedName: string;
    locationName: string;
} | undefined;

type Couple = {
    id: string;
    type: string;
    partnerA: CoupleColonist;
    partnerB: CoupleColonist;
    bedA: CoupleBed;
    bedB: CoupleBed;
};

type CouplesOverviewProps = {
    couples: Couple[];
};

function getColonistName(colonist: CoupleColonist) {
    return `${colonist.firstName}${colonist.nickname ? ` "${colonist.nickname}"` : ""} ${colonist.lastName}`;
}

function CoupleMember({
    colonist,
    bed,
}: {
    colonist: CoupleColonist;
    bed: CoupleBed;
}) {
    return (
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text
                component="a"
                href={`/colonists/${colonist.id}`}
                fw={600}
                c={colonist.legacy?.color ?? "var(--mantine-color-text)"}
                style={{
                    textDecoration: "none",
                    overflowWrap: "anywhere",
                }}
            >
                {getColonistName(colonist)}
            </Text>

            <Text size="xs" c="dimmed" lineClamp={2}>
                {bed
                    ? `${bed.bedName} · ${bed.locationName}`
                    : "No bed assigned"}
            </Text>
        </Stack>
    );
}

export default function CouplesOverview({
    couples,
}: CouplesOverviewProps) {
    return (
        <Card
            padding="lg"
            radius="md"
            withBorder
            bg="#131313"
            style={{
                borderColor: "#39302a",
            }}
        >
            <Group justify="space-between" align="center" mb="md">
                <div>
                    <Title order={2}>
                        Couples without a shared bed
                    </Title>

                    <Text size="xs" c="dimmed" mt={4}>
                        Current lovers and married couples who aren't
                        assigned to the same double bed.
                    </Text>
                </div>

                <Text size="sm" c="dimmed">
                    {couples.length}{" "}
                    {couples.length === 1 ? "couple" : "couples"}
                </Text>
            </Group>

            {couples.length > 0 ? (
                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        md: 3,
                    }}
                    spacing="md"
                >
                    {couples.map((couple) => {
                        const isLover = couple.type === "Lover";
                        const relationshipColor = isLover
                            ? "#D66B9A"
                            : "#D4A84F";
                        const RelationshipIcon = isLover
                            ? Heart
                            : Blend;

                        return (
                            <Card
                                key={couple.id}
                                padding="md"
                                radius="md"
                                withBorder
                                bg="#161616"
                                style={{
                                    borderColor: "#292929",
                                }}
                            >
                                <Group
                                    align="center"
                                    gap="sm"
                                    wrap="nowrap"
                                >
                                    <CoupleMember
                                        colonist={couple.partnerA}
                                        bed={couple.bedA}
                                    />

                                    <Tooltip label={couple.type}>
                                        <Box
                                            style={{
                                                flexShrink: 0,
                                                width: 34,
                                                height: 34,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#161616",
                                                border: `2px solid ${relationshipColor}`,
                                                color: relationshipColor,
                                            }}
                                        >
                                            <RelationshipIcon
                                                size={16}
                                                strokeWidth={2.5}
                                            />
                                        </Box>
                                    </Tooltip>

                                    <CoupleMember
                                        colonist={couple.partnerB}
                                        bed={couple.bedB}
                                    />
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Text size="sm" c="dimmed">
                    All current couples share a double bed.
                </Text>
            )}
        </Card>
    );
}