export type RGB = {
    r: number;
    g: number;
    b: number;
};

export type Lab = {
    l: number;
    a: number;
    b: number;
};

export function hexToRgb(hex: string): RGB {
    const clean = hex.replace("#", "");

    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16),
    };
}

export function rgbToLab({ r, g, b }: RGB): Lab {
    let red = r / 255;
    let green = g / 255;
    let blue = b / 255;

    red =
        red > 0.04045
            ? Math.pow((red + 0.055) / 1.055, 2.4)
            : red / 12.92;

    green =
        green > 0.04045
            ? Math.pow((green + 0.055) / 1.055, 2.4)
            : green / 12.92;

    blue =
        blue > 0.04045
            ? Math.pow((blue + 0.055) / 1.055, 2.4)
            : blue / 12.92;

    const x =
        (red * 0.4124 +
            green * 0.3576 +
            blue * 0.1805) /
        0.95047;

    const y =
        (red * 0.2126 +
            green * 0.7152 +
            blue * 0.0722);

    const z =
        (red * 0.0193 +
            green * 0.1192 +
            blue * 0.9505) /
        1.08883;

    const f = (value: number) =>
        value > 0.008856
            ? Math.pow(value, 1 / 3)
            : 7.787 * value + 16 / 116;

    const fx = f(x);
    const fy = f(y);
    const fz = f(z);

    return {
        l: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
    };
}

export function colorDistance(
    first: string,
    second: string
): number {
    const firstLab = rgbToLab(hexToRgb(first));
    const secondLab = rgbToLab(hexToRgb(second));

    return Math.sqrt(
        Math.pow(firstLab.l - secondLab.l, 2) +
        Math.pow(firstLab.a - secondLab.a, 2) +
        Math.pow(firstLab.b - secondLab.b, 2)
    );
}
export function getColorDistanceLabel(distance: number): string {
    if (distance < 10) {
        return "Very close";
    }

    if (distance < 20) {
        return "Similar";
    }

    if (distance < 35) {
        return "Noticeably different";
    }

    return "Very different";
}

export function getColorFamily(hex: string): string {
    const { r, g, b } = hexToRgb(hex);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const saturation = max === 0
        ? 0
        : (max - min) / max;

    const value = max / 255;

    // Very low saturation = neutral
    if (saturation < 0.20) {
        return "Neutral";
    }

    let hue: number;

    if (max === min) {
        hue = 0;
    } else if (max === r) {
        hue = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
        hue = (b - r) / (max - min) + 2;
    } else {
        hue = (r - g) / (max - min) + 4;
    }

    hue *= 60;

    if (hue < 0) {
        hue += 360;
    }

    /*
     * Low-saturation, darker warm colors tend to read more
     * naturally as brown/earthy than orange.
     */
    if (
        saturation < 0.35 &&
        value < 0.65 &&
        (hue < 70 || hue >= 330)
    ) {
        return "Brown";
    }

    if (hue < 15 || hue >= 345) return "Red";
    if (hue < 50) return "Orange";
    if (hue < 75) return "Yellow";
    if (hue < 165) return "Green";
    if (hue < 200) return "Cyan";
    if (hue < 240) return "Blue";
    if (hue < 300) return "Purple";
    return "Pink";
}