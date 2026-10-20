
import { createElement, type ReactNode } from "react";

type TraitDescriptionColonist = {
    firstName: string;
    nickname?: string | null;
    gender?: "Male" | "Female" | "";
};

const DEFAULT_NAME_COLOR = "#e9904f";
// #e9904f
// "#C8C4BC"
export function formatTraitDescription(
    description: string,
    colonist: TraitDescriptionColonist,
    legacyColor?: string | null
): ReactNode {
    const name =
        colonist.nickname?.trim() ||
        colonist.firstName.trim() ||
        "This colonist";

    const pronouns = {
        Male: {
            pronoun: "he",
            objective: "him",
            possessive: "his",
        },
        Female: {
            pronoun: "she",
            objective: "her",
            possessive: "her",
        },
    }[colonist.gender as "Male" | "Female"] ?? {
        pronoun: "they",
        objective: "them",
        possessive: "their",
    };

    const replacements: Record<string, string> = {
        pawn_namedef: name,
        pawn_pronoun: pronouns.pronoun,
        pawn_objective: pronouns.objective,
        pawn_possessive: pronouns.possessive,
    };

    const nameColor = legacyColor || DEFAULT_NAME_COLOR;
    const parts: ReactNode[] = [];
    const placeholderPattern =
        /\{(PAWN_[a-zA-Z]+)\}|\[(PAWN_[a-zA-Z]+)\]/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = placeholderPattern.exec(description)) !== null) {
        if (match.index > lastIndex) {
            parts.push(description.slice(lastIndex, match.index));
        }

        const token = (match[1] ?? match[2] ?? "").toLowerCase();
        const replacement = replacements[token];

        if (replacement === undefined) {
            parts.push(match[0]);
        } else if (token === "pawn_namedef") {
            parts.push(
                createElement(
                    "span",
                    {
                        key: `name-${match.index}`,
                        style: {
                            color: nameColor,
                            fontWeight: 700,
                        },
                    },
                    replacement
                )
            );
        } else {
            parts.push(replacement);
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < description.length) {
        parts.push(description.slice(lastIndex));
    }

    return parts;
}
