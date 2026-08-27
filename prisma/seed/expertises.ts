export const expertiseDefinitions = [
    // =========================
    // Melee
    // =========================
    {
        skill: "Melee",
        name: "Piercing",
        description:
            "An expertise in armor piercing when using sharp melee weapons.",
        effects: [
            {
                name: "Armor penetration factor",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Melee",
        name: "Dueling",
        description:
            "An expertise in the fast-paced armed melee combat.",
        effects: [
            {
                name: "Melee cooldown",
                value: -2.5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Melee",
        name: "Striking",
        description:
            "An expertise in hitting accurately with melee attacks.",
        effects: [
            {
                name: "Melee hit chance",
                value: 0.1,
                unit: null,
            },
        ],
    },

    // =========================
    // Medical
    // =========================
    {
        skill: "Medical",
        name: "Surgery",
        description:
            "An expertise in performing safe and effective surgeries.",
        effects: [
            {
                name: "Medical surgery success chance",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Medical",
        name: "First aid",
        description:
            "An expertise in rapid treatment and medical tending.",
        effects: [
            {
                name: "Medical tend speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Medical",
        name: "Nursing",
        description:
            "An expertise in caring for ill patients, suffering from various diseases.",
        effects: [
            {
                name: "Medical tend quality",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Medical",
        name: "Operating",
        description:
            "An expertise in performing surgeries quickly and efficiently.",
        effects: [
            {
                name: "Medical operation speed",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Shooting
    // =========================
    {
        skill: "Shooting",
        name: "Sharpshooting",
        description:
            "An expertise in accuracy when firing both high-tech and low-tech ranged weapons.",
        effects: [
            {
                name: "Shooting accuracy",
                value: 1.0,
                unit: null,
            },
        ],
    },
    {
        skill: "Shooting",
        name: "Aiming",
        description:
            "An expertise in aiming when firing both high-tech and low-tech ranged weapons.",
        effects: [
            {
                name: "Aiming time",
                value: -5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Shooting",
        name: "Reloading",
        description:
            "An expertise in reloading both high-tech and low-tech ranged weapons.",
        effects: [
            {
                name: "Ranged weapon cooldown factor",
                value: -0.03,
                unit: null,
            },
        ],
    },
    {
        skill: "Shooting",
        name: "Sniping",
        description:
            "An expertise in firing ranged weapons over much longer distances.",
        effects: [
            {
                name: "Weapon ranged factor",
                value: 0.01,
                unit: null,
            },
        ],
    },

    // =========================
    // Cooking
    // =========================
    {
        skill: "Cooking",
        name: "Gourmet cooking",
        description:
            "An expertise in improving meals beyond their usual level of quality.",
        effects: [
            {
                name: "Food improvement chance",
                value: 1,
                unit: "%",
            },
        ],
    },
    {
        skill: "Cooking",
        name: "Flavour mastery",
        description:
            "An expertise in randomly adding cooking condiments to meals on a whim.",
        effects: [
            {
                name: "Food condiment chance",
                value: 1,
                unit: "%",
            },
        ],
    },
    {
        skill: "Cooking",
        name: "Butchering",
        description:
            "An expertise in butchering dead animals.",
        effects: [
            {
                name: "Butchery speed",
                value: 5,
                unit: "%",
            },
            {
                name: "Butchery efficiency",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Cooking",
        name: "Drug cooking",
        description:
            "An expertise in creating drugs.",
        effects: [
            {
                name: "Drug cooking speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Cooking",
        name: "Food Hygiene",
        description:
            "An expertise in creating safe to consume meals in any environment.",
        effects: [
            {
                name: "Food poison chance",
                value: -5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Cooking",
        name: "Feeding",
        description:
            "An expertise in creating large amounts of meals to feed many people quickly.",
        effects: [
            {
                name: "Cooking speed",
                value: 0.1,
                unit: "%",
            },
        ],
    },

    // =========================
    // Construction
    // =========================
    {
        skill: "Construction",
        name: "Flooring",
        description:
            "An expertise in constructing floors.",
        effects: [
            {
                name: "Floor work speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Construction",
        name: "Repairing",
        description:
            "An expertise in repairing broken down and damaged structures.",
        effects: [
            {
                name: "Repair success chance",
                value: 5,
                unit: "%",
            },
            {
                name: "Repair speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Construction",
        name: "Architecture",
        description:
            "An expertise in creating complex and beautiful buildings.",
        effects: [
            {
                name: "Construct success chance",
                value: 5,
                unit: "%",
            },
            {
                name: "Construction quality bonus",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Construction",
        name: "Building",
        description:
            "An expertise in constructing massive amounts of buildings quickly and efficiently.",
        effects: [
            {
                name: "Construction speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Construction",
        name: "Smoothing",
        description:
            "An expertise in smoothing surfaces such as walls and floors.",
        effects: [
            {
                name: "Smoothing speed",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Mining
    // =========================
    {
        skill: "Mining",
        name: "Drilling",
        description:
            "An expertise in using a deep drill to mine resources more efficiently.",
        effects: [
            {
                name: "Deep drilling speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Mining",
        name: "Prospecting",
        description:
            "An expertise in digging up ore and finding more of it.",
        effects: [
            {
                name: "Mining yield",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Mining",
        name: "Tunneling",
        description:
            "An expertise in digging massive tunnels and caverns.",
        effects: [
            {
                name: "Mining speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Mining",
        name: "Geology",
        description:
            "An expertise in rocks and obtaining more stone chunks when digging.",
        effects: [
            {
                name: "Rock chunk chance",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Animals
    // =========================
    {
        skill: "Animals",
        name: "Swiftcasting",
        description:
            "An expertise in fishing speed that reduces the time spent on fishing jobs.",
        effects: [
            {
                name: "Fishing speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Catchmastery",
        description:
            "An expertise in fish catching that increases the amount of fish caught.",
        effects: [
            {
                name: "Fishing yield",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Aquabounty",
        description:
            "An expertise in getting lucky when fishing, catching special items that are not fish.",
        effects: [
            {
                name: "Fishing luck",
                value: 1,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Taming",
        description:
            "An expertise in taming wild animals.",
        effects: [
            {
                name: "Tame animal chance",
                value: 5,
                unit: "%",
            },
            {
                name: "Attack on tame animal fail chance factor",
                value: -5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Ranching",
        description:
            "An expertise in ranching and animal produce gathering.",
        effects: [
            {
                name: "Animal gather yield",
                value: 5,
                unit: "%",
            },
            {
                name: "Animal gather speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Hunting",
        description:
            "An expertise in the art of hunting.",
        effects: [
            {
                name: "Hunting stealth",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Animals",
        name: "Handling",
        description:
            "An expertise in handling and training colony animals.",
        effects: [
            {
                name: "Train animal chance",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Crafting
    // =========================
    {
        skill: "Crafting",
        name: "Disassembler",
        description:
            "An expertise in all things mechanoids, including shredding and disassembling them.",
        effects: [
            {
                name: "Mechanoid shredding speed",
                value: 5,
                unit: "%",
            },
            {
                name: "Mechanoid shredding efficiency",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Crafting",
        name: "Tailoring",
        description:
            "An expertise in tailoring excellent clothes.",
        effects: [
            {
                name: "Tailoring speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Crafting",
        name: "Weaponsmithing",
        description:
            "An expertise in creating excellent weapons.",
        effects: [
            {
                name: "Weapon creation speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Crafting",
        name: "Fabricating",
        description:
            "An expertise in crafting components efficiently.",
        effects: [
            {
                name: "Component crafting speed",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Social
    // =========================
    {
        skill: "Social",
        name: "Wardening",
        description:
            "An expertise in handling prisoners and slaves, recruiting them and arresting them if needed.",
        effects: [
            {
                name: "Arrest success chance",
                value: 5,
                unit: "%",
            },
            {
                name: "Suppression power",
                value: 5,
                unit: "%",
            },
            {
                name: "Recruitment rate",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Social",
        name: "Negotiating",
        description:
            "An expertise in handling negotiations and trading.",
        effects: [
            {
                name: "Trade price improvement",
                value: 5,
                unit: "%",
            },
            {
                name: "Peace talks success chance",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Social",
        name: "Proselytizing",
        description:
            "An expertise in converting others to their own ways of thinking.",
        effects: [
            {
                name: "Conversion power",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Plants
    // =========================
    {
        skill: "Plants",
        name: "Foraging",
        description:
            "An expertise in living off the land and foraging the fruit of the forest.",
        effects: [
            {
                name: "Foraged food amount",
                value: 0.05,
                unit: "%",
            },
        ],
    },
    {
        skill: "Plants",
        name: "Pruning",
        description:
            "An expertise in communicating psychically and pruning the Gauranlen trees.",
        effects: [
            {
                name: "Pruning speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Plants",
        name: "Harvesting",
        description:
            "An expertise in ensuring no parts of the plant are wasted on harvesting.",
        effects: [
            {
                name: "Plant harvest yield",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Plants",
        name: "Sowing",
        description:
            "An expertise in quickly sowing and harvesting large amounts of plants.",
        effects: [
            {
                name: "Plant work speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Plants",
        name: "Synthesizing",
        description:
            "An expertise in creating complex drugs efficiently.",
        effects: [
            {
                name: "Drug synthesis speed",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Intellectual
    // =========================
    {
        skill: "Intellectual",
        name: "Hacking",
        description:
            "An expertise in hacking terminals and ancient systems.",
        effects: [
            {
                name: "Hacking speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Intellectual",
        name: "Researching",
        description:
            "An expertise in researching new technologies.",
        effects: [
            {
                name: "Research speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Intellectual",
        name: "Writing",
        description:
            "An expertise in both reading and writing books in a timely manner.",
        effects: [
            {
                name: "Writing speed",
                value: 5,
                unit: "%",
            },
            {
                name: "Reading speed",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Intellectual",
        name: "Dark study",
        description:
            "An expertise in analyzing and learning from entities and absorbing dark knowledge.",
        effects: [
            {
                name: "Entity study rate",
                value: 3,
                unit: "%",
            },
            {
                name: "Study efficiency",
                value: 5,
                unit: "%",
            },
        ],
    },

    // =========================
    // Artistic
    // =========================
    {
        skill: "Artistic",
        name: "Art Quality",
        description:
            "An expertise in creating works of art with increased quality.",
        effects: [
            {
                name: "Art quality bonus",
                value: 5,
                unit: "%",
            },
        ],
    },
    {
        skill: "Artistic",
        name: "Art Quantity",
        description:
            "An expertise in creating works of art quickly and efficiently.",
        effects: [
            {
                name: "Art creation speed",
                value: 5,
                unit: "%",
            },
        ],
    },
];