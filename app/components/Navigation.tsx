"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Component,
    MapPin,
    BookOpen,
    Orbit,
    Crown,
    Gem,
    GitBranch,
    TreePine,
} from "lucide-react";

const links = [
    {
        label: "Colonists",
        href: "/colonists",
        icon: Users,
    },
    {
        label: "Legacies",
        href: "/legacies",
        icon: Crown,
    },
    {
        label: "Family Tree",
        href: "/family-tree",
        icon: TreePine,
    },
    {
        label: "Groups",
        href: "/groups",
        icon: Orbit,
    },
    {
        label: "Stories",
        href: "/stories",
        icon: BookOpen,
    },
    {
        label: "Locations",
        href: "/locations",
        icon: MapPin,
    },
    {
        label: "Relics",
        href: "/relics",
        icon: Gem,
    },
];

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="site-navigation">
            <div className="site-navigation-inner">
                <Link href="/" className="site-title">
                    Eternal Mesa
                </Link>

                <div className="navigation-tabs">
                    {links.map(({ label, href, icon: Icon }) => {
                        const isActive =
                            pathname === href ||
                            pathname.startsWith(`${href}/`);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`navigation-tab ${isActive ? "active" : ""
                                    }`}
                            >
                                <Icon size={17} strokeWidth={1.8} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}