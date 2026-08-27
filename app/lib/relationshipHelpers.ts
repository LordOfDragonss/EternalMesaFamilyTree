export function getParentLabel(
    type: string,
    gender: string
): string {
    if (type === "Biological") {
        if (gender === "Male") {
            return "Biological father";
        }

        if (gender === "Female") {
            return "Biological mother";
        }

        return "Biological parent";
    }

    if (type === "OvumDonor") {
        if (gender === "Female") {
            return "Birth mother";
        }

        return "Birth parent";
    }

    if (gender === "Male") {
        return "Father";
    }

    if (gender === "Female") {
        return "Mother";
    }

    return "Parent";
}

export function getPartnerLabel(
    type: string,
    gender: string
): string {
    if (type === "Married") {
        if (gender === "Male") {
            return "Husband";
        }

        if (gender === "Female") {
            return "Wife";
        }

        return "Spouse";
    }

    if (type === "Ex") {
        return "Ex-lover";
    }

    return "Lover";
}

export function getChildLabel(
    gender: string
): string {
    if (gender === "Male") {
        return "Son";
    }

    if (gender === "Female") {
        return "Daughter";
    }

    return "Child";
}

export function getSiblingLabel(
    gender: string
): string {
    if (gender === "Male") {
        return "Brother";
    }

    if (gender === "Female") {
        return "Sister";
    }

    return "Sibling";
}

export function getGrandparentLabel(
    gender: string
): string {
    if (gender === "Male") {
        return "Grandfather";
    }

    if (gender === "Female") {
        return "Grandmother";
    }

    return "Grandparent";
}

export function getAuntUncleLabel(
    gender: string
): string {
    if (gender === "Male") {
        return "Uncle";
    }

    if (gender === "Female") {
        return "Aunt";
    }

    return "Aunt / Uncle";
}

export function getCousinLabel(): string {
    return "Cousin";
}