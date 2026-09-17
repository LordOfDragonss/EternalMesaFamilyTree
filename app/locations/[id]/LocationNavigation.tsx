"use client";

import { Tabs } from "@mantine/core";
import {
    usePathname,
    useRouter,
} from "next/navigation";

type Props = {
    locationId: number;
};

export default function LocationNavigation({
    locationId,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();

    const basePath = `/locations/${locationId}`;

    let activeTab = "overview";

    if (pathname.startsWith(`${basePath}/gallery`)) {
        activeTab = "gallery";
    } else if (
        pathname.startsWith(`${basePath}/landmarks`)
    ) {
        activeTab = "landmarks";
    } else if (
        pathname.startsWith(`${basePath}/colonists`)
    ) {
        activeTab = "colonists";
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

                <Tabs.Tab value="landmarks">
                    Landmarks
                </Tabs.Tab>

                <Tabs.Tab value="colonists">
                    Colonists
                </Tabs.Tab>
            </Tabs.List>
        </Tabs>
    );
}