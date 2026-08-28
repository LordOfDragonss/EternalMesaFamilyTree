"use client";

import { Select } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

export default function GenderSelect() {
    const [error, setError] = useState<string | undefined>();
    const selectRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const input = selectRef.current;

        if (!input) {
            return;
        }

        const form = input.form;

        if (!form) {
            return;
        }

        const handleSubmit = (event: SubmitEvent) => {
            if (!input.value) {
                event.preventDefault();
                setError("Gender is required.");

                input.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                input.focus();
            }
        };

        form.addEventListener("submit", handleSubmit);

        return () => {
            form.removeEventListener("submit", handleSubmit);
        };
    }, []);

    return (
        <Select
            ref={selectRef}
            name="gender"
            label="Gender"
            placeholder="Gender"
            data={[
                {
                    value: "Male",
                    label: "Male",
                },
                {
                    value: "Female",
                    label: "Female",
                },
            ]}
            required
            error={error}
            onChange={() => setError(undefined)}
            style={{
                width: 140,
            }}
        />
    );
}