"use client";

import { Tabs } from "@mantine/core";
import {
    usePathname,
    useRouter,
} from "next/navigation";

type Props = {
    relicId: number;
};

export default function RelicNavigation({
    relicId,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();

    const basePath = `/relics/${relicId}`;

    let activeTab = "overview";

    if (
        pathname.startsWith(
            `${basePath}/gallery`
        )
    ) {
        activeTab = "gallery";
    }

    function navigate(value: string | null) {
        if (!value) {
            return;
        }

        router.push(
            value === "overview"
                ? basePath
                : `${basePath}/${value}`
        );
    }

    return (
        <Tabs
            value={activeTab}
            onChange={navigate}
            variant="default"
            color="mesa"
        >
            <Tabs.List>
                <Tabs.Tab value="overview">
                    Overview
                </Tabs.Tab>

                <Tabs.Tab value="gallery">
                    Gallery
                </Tabs.Tab>
            </Tabs.List>
        </Tabs>
    );
}