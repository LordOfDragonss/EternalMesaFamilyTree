"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
    action: string;
    colonistName: string;
};

export default function DeleteButton({
    action,
    colonistName,
}: DeleteButtonProps) {
    function handleDelete(event: React.FormEvent<HTMLFormElement>) {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${colonistName}?`
        );

        if (!confirmed) {
            event.preventDefault();
        }
    }

    return (
        <form
            action={action}
            method="POST"
            onSubmit={handleDelete}
            style={{ display: "inline" }}
        >
            <Tooltip label="Delete colonist">
                <ActionIcon
                    component="button"
                    type="submit"
                    variant="subtle"
                    color="red"
                    aria-label={`Delete ${colonistName}`}
                >
                    <Trash2 size={18} />
                </ActionIcon>
            </Tooltip>
        </form>
    );
}