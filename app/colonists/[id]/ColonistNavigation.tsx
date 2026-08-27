"use client";

import { Tabs } from "@mantine/core";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

type Props = {
    colonistId: number;
};

export default function ColonistNavigation({
    colonistId,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const basePath = `/colonists/${colonistId}`;

    let activeTab = "overview";

    if (pathname === `${basePath}/under-construction`) {
        activeTab =
            searchParams.get("section") ?? "overview";
    } else if (pathname === `${basePath}/family`) {
        activeTab = "family";
    } else if (pathname === `${basePath}/genes`) {
        activeTab = "genes";
    } else if (pathname === `${basePath}/skills`) {
        activeTab = "skills";
    } else if (pathname === `${basePath}/stories`) {
        activeTab = "stories";
    }

    function navigate(value: string | null) {
        if (!value) {
            return;
        }

        // Tabs that currently have real pages.
        const implementedTabs = [
            "overview",
            "family",
            "skills",
        ];

        if (implementedTabs.includes(value)) {
            router.push(
                value === "overview"
                    ? basePath
                    : `${basePath}/${value}`
            );

            return;
        }

        // Everything else temporarily goes to the fallback.
        router.push(
            `${basePath}/under-construction?section=${value}`
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

                <Tabs.Tab value="family">
                    Family
                </Tabs.Tab>

                <Tabs.Tab value="skills">
                    Skills
                </Tabs.Tab>

                <Tabs.Tab value="genes">
                    Genes
                </Tabs.Tab>


                <Tabs.Tab value="stories">
                    Stories
                </Tabs.Tab>
            </Tabs.List>
        </Tabs>
    );
}