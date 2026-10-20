
"use client";

import {
    Card,
    Group,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { useColonistIdentity } from "@/app/lib/ColonistIdentityContext";
import PortraitUpload from "./PortraitUpload";
import GenderSelect from "./GenderSelect";

export default function ColonistIdentityFields() {
    const {
        firstName,
        nickname,
        setFirstName,
        setNickname,
    } = useColonistIdentity();

    return (
        <Card
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            bg="#161616"
            style={{
                borderColor: "#292929",
            }}
        >
            <Stack gap="md">
                <div>
                    <Title order={3}>
                        Identity
                    </Title>

                    <Text c="dimmed" size="sm" mt={2}>
                        The colonist's name and basic information.
                    </Text>
                </div>

                <Group align="flex-start" wrap="nowrap">
                    <PortraitUpload />

                    <Stack
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                        gap="md"
                    >
                        <Group grow>
                            <TextInput
                                name="firstName"
                                label="First name"
                                placeholder="First name"
                                value={firstName}
                                onChange={(event) =>
                                    setFirstName(event.currentTarget.value)
                                }
                                required
                            />

                            <TextInput
                                name="nickname"
                                label="Nickname"
                                placeholder="Nickname"
                                value={nickname}
                                onChange={(event) =>
                                    setNickname(event.currentTarget.value)
                                }
                            />

                            <TextInput
                                name="lastName"
                                label="Last name"
                                placeholder="Last name"
                                required
                            />
                        </Group>

                        <Group align="flex-end" wrap="nowrap">
                            <TextInput
                                name="title"
                                label="Title"
                                placeholder="Optional title"
                                style={{
                                    flex: 1,
                                }}
                            />

                            <GenderSelect />
                        </Group>
                    </Stack>
                </Group>
            </Stack>
        </Card>
    );
}
