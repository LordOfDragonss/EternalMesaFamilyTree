export function getPublicUrl(request: Request) {
    const host =
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host");

    const protocol =
        request.headers.get("x-forwarded-proto") ??
        "http";

    if (!host) {
        throw new Error("Unable to determine request host.");
    }

    return `${protocol}://${host}`;
}