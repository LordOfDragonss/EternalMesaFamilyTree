"use client";

import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    Textarea,
} from "@mantine/core";

type EditorialCommentModalProps = {
    opened: boolean;
    activeCommentId: string | null;
    commentText: string;
    onCommentTextChange: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
};

export default function EditorialCommentModal({
    opened,
    activeCommentId,
    commentText,
    onCommentTextChange,
    onClose,
    onSave,
    onDelete,
}: EditorialCommentModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                activeCommentId
                    ? "Edit editorial comment"
                    : "Add editorial comment"
            }
            centered
            size="md"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    This comment is private and will not appear in the
                    reader-facing story.
                </Text>

                <Textarea
                    label="Comment"
                    placeholder="What needs attention in this passage?"
                    value={commentText}
                    onChange={(event) =>
                        onCommentTextChange(event.currentTarget.value)
                    }
                    minRows={3}
                    autosize
                    autoFocus
                />

                <Group justify="space-between">
                    {activeCommentId ? (
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={onDelete}
                        >
                            Delete comment
                        </Button>
                    ) : (
                        <span />
                    )}

                    <Group>
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="mesa"
                            onClick={onSave}
                            disabled={!commentText.trim()}
                        >
                            Save comment
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
}