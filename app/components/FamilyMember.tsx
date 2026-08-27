import { Text } from "@mantine/core";

type Props = {
    colonist: {
        id: number;
        firstName: string;
        nickname: string | null;
        lastName: string;
        legacy: {
            color: string | null;
        } | null;
    };
    label: string;
};

export default function FamilyMember({
    colonist,
    label,
}: Props) {
    return (
        <div>
            <Text
                size="sm"
                c="dimmed"
            >
                {label}
            </Text>

            <Text
                component="a"
                href={`/colonists/${colonist.id}`}
                fw={500}
                style={
                    colonist.legacy?.color
                        ? {
                            color: colonist.legacy.color,
                        }
                        : undefined
                }
            >
                {colonist.firstName}{" "}
                {colonist.nickname &&
                    `"${colonist.nickname}"`}{" "}
                {colonist.lastName}
            </Text>
        </div>
    );
}