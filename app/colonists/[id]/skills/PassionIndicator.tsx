import { Flame } from "lucide-react";
import { Group, Text } from "@mantine/core";

type Passion =
    | "Apathy"
    | "None"
    | "Interested"
    | "Burning"
    | "Natural"
    | "Critical";

type PassionIndicatorProps = {
    passion: Passion;
};

function PassionFlame({
    size = 15,
}: {
    size?: number;
}) {
    return (
        <Flame
            size={size}
            strokeWidth={2.75}
            fill="currentColor"
            style={{
                filter: "drop-shadow(0 0 3px currentColor)",
            }}
        />
    );
}

export default function PassionIndicator({
    passion,
}: PassionIndicatorProps) {
    switch (passion) {
        case "Interested":
            return (
                <Text
                    component="span"
                    c="orange.5"
                    style={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <PassionFlame size={13} />
                </Text>
            );

        case "Burning":
            return (
                <Group
                    gap={0}
                    wrap="nowrap"
                    c="orange.5"
                >
                    <PassionFlame size={16} />
                    <PassionFlame size={16} />
                </Group>
            );

        case "Natural":
            return (
                <Text
                    component="span"
                    c="yellow.4"
                    style={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <PassionFlame size={19} />
                </Text>
            );

        case "Critical":
            return (
                <Text
                    component="span"
                    c="orange.8"
                    style={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <Flame
                        size={23}
                        strokeWidth={2.75}
                        fill="currentColor"
                        style={{
                            transform: "scaleX(1.35)",
                            filter:
                                "drop-shadow(0 0 7px currentColor)",
                        }}
                    />
                </Text>
            );

        case "Apathy":
            return (
                <Flame
                    size={14}
                    strokeWidth={2}
                    color="var(--mantine-color-dark-3)"
                />
            );
        case "None":
        default:
            return null;
    }
}