"use client";

import {
    createTheme,
    MantineProvider,
    type CSSVariablesResolver,
} from "@mantine/core";

const theme = createTheme({
    primaryColor: "mesa",

    colors: {
        mesa: [
            "#fff3e6",
            "#ffe5cc",
            "#fbc99f",
            "#f3aa70",
            "#e9904f",
            "#d97b3a",
            "#c86c32",
            "#a95728",
            "#87451f",
            "#633117",
        ],
    },

    primaryShade: 6,
    defaultRadius: "md",
});

const resolver: CSSVariablesResolver = (theme) => ({
    variables: {},
    light: {},
    dark: {
        "--mantine-color-body": "#0D0D0D",
        "--mantine-color-default": "#161616",
        "--mantine-color-default-hover": "#1C1C1C",
    },
});

export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MantineProvider
            theme={theme}
            cssVariablesResolver={resolver}
            defaultColorScheme="dark"
        >
            {children}
        </MantineProvider>
    );
}