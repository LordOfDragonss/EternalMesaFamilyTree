type PersonCardProps = {
    name: string;
    imageURL: string | null;
    legacyColor: string | null;
};

export default function PersonCard({
    name,
    imageURL,
    legacyColor,
}: PersonCardProps) {
    return (
        <div
            className="
                w-48
                rounded-xl
                border
                border-zinc-700
                bg-zinc-800
                p-4
                shadow-xl
                transition-all
                hover:scale-105
                hover:border-orange-500
                hover:shadow-lg
                hover:shadow-orange-500/20
            "
            style={{
                borderColor:
                    legacyColor ?? undefined,
            }}
        >
            <div
                className="h-16 w-16 overflow-hidden rounded-full bg-zinc-600"
            >
                {imageURL && (
                    <img
                        src={imageURL}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            <h2
                className="mt-4 text-xl text-white"
            >
                {name}
            </h2>
        </div>
    );
}