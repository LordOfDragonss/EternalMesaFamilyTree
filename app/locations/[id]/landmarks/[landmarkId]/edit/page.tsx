import {
    Card,
    Stack,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../../../LocationHeader";
import LocationNavigation from "../../../LocationNavigation";
import LandmarkForm from "./LandmarkForm";

export default async function EditLandmarkPage({
    params,
}: {
    params: Promise<{
        id: string;
        landmarkId: string;
    }>;
}) {
    const { id, landmarkId } = await params;

    const locationId = Number(id);
    const landmarkIdNumber = Number(landmarkId);

    const location = await prisma.location.findUnique({
        where: {
            id: locationId,
        },
        include: {
            previousNames: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    if (!location) {
        return <h1>Location not found</h1>;
    }

    const landmark =
        await prisma.locationLandmark.findFirst({
            where: {
                id: landmarkIdNumber,
                locationId,
            },
            include: {
                images: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

    if (!landmark) {
        return <h1>Landmark not found</h1>;
    }

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <LocationHeader location={location} />

                <LocationNavigation
                    locationId={location.id}
                />

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
                    <LandmarkForm
                        locationId={location.id}
                        landmark={landmark}
                    />
                </Card>
            </Stack>
        </main>
    );
}