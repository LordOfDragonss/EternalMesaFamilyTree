
"use client";

import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

type Gender = "Male" | "Female" | "";

type ColonistIdentity = {
    firstName: string;
    nickname: string;
    gender: Gender;
    legacyColor: string | null;
    setLegacyColor: (value: string | null) => void;
    setFirstName: (value: string) => void;
    setNickname: (value: string) => void;
    setGender: (value: Gender) => void;
};

const ColonistIdentityContext =
    createContext<ColonistIdentity | null>(null);

export function ColonistIdentityProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [firstName, setFirstName] = useState("");
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState<Gender>("");
    const [legacyColor, setLegacyColor] = useState<string | null>(null);

    return (
        <ColonistIdentityContext.Provider
            value={{
                firstName,
                nickname,
                gender,
                setFirstName,
                setNickname,
                setGender,
                legacyColor,
                setLegacyColor,
            }}
        >
            {children}
        </ColonistIdentityContext.Provider>
    );
}

export function useColonistIdentity() {
    const context = useContext(ColonistIdentityContext);

    if (!context) {
        throw new Error(
            "useColonistIdentity must be used inside ColonistIdentityProvider."
        );
    }

    return context;
}
