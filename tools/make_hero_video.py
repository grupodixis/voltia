from __future__ import annotations

import math
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "hero-automatizaciones.png"
OUT = ROOT / "assets" / "hero-voltia-led-loop.mp4"

FPS = 24
DURATION = 6
FRAMES = FPS * DURATION


def pulse(frame: int, phase: float = 0.0, low: float = 0.18, high: float = 1.0) -> float:
    value = 0.5 + 0.5 * math.sin((2 * math.pi * frame / FRAMES) + phase)
    return low + (high - low) * value


def add_glow(layer: Image.Image, x: float, y: float, radius: int, color: tuple[int, int, int], strength: float) -> None:
    glow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    alpha = int(180 * strength)
    draw.ellipse(
        (x - radius, y - radius, x + radius, y + radius),
        fill=(color[0], color[1], color[2], alpha),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius * 0.65))
    layer.alpha_composite(glow)

    core = ImageDraw.Draw(layer)
    core_radius = max(2, radius // 4)
    core.ellipse(
        (x - core_radius, y - core_radius, x + core_radius, y + core_radius),
        fill=(color[0], color[1], color[2], int(210 * strength)),
    )


def main() -> None:
    base = Image.open(SOURCE).convert("RGB")

    # H.264 encoders prefer even dimensions. Padding by one pixel keeps the source visually identical.
    width, height = base.size
    out_width = width + (width % 2)
    out_height = height + (height % 2)
    if (out_width, out_height) != base.size:
        padded = Image.new("RGB", (out_width, out_height), (0, 0, 0))
        padded.paste(base, (0, 0))
        base = padded

    green_leds = [
        (1024, 177),
        (1042, 177),
        (1064, 174),
        (1086, 174),
        (1106, 171),
        (1129, 170),
        (1151, 168),
        (1174, 166),
    ]
    amber_leds = [
        (985, 474),
        (999, 469),
        (1012, 472),
        (1049, 478),
        (1054, 478),
        (1086, 487),
        (1109, 489),
    ]
    teal_points = [
        (1198, 257),
        (1165, 279),
        (1647, 556),
    ]

    writer = imageio.get_writer(
        OUT,
        fps=FPS,
        codec="libx264",
        quality=8,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    )

    try:
        for frame in range(FRAMES):
            composed = base.convert("RGBA")
            light_layer = Image.new("RGBA", composed.size, (0, 0, 0, 0))

            for idx, (x, y) in enumerate(green_leds):
                strength = pulse(frame, phase=idx * 0.42, low=0.28, high=1.0)
                add_glow(light_layer, x, y, 14, (45, 210, 126), strength)

            for idx, (x, y) in enumerate(amber_leds):
                strength = pulse(frame, phase=1.2 + idx * 0.75, low=0.12, high=0.82)
                add_glow(light_layer, x, y, 12, (255, 166, 58), strength)

            for idx, (x, y) in enumerate(teal_points):
                strength = pulse(frame, phase=2.1 + idx * 1.1, low=0.08, high=0.55)
                add_glow(light_layer, x, y, 22, (37, 170, 160), strength)

            # Slight dashboard life in the lower-left screen, restrained enough to remain premium.
            dashboard = Image.new("RGBA", composed.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(dashboard)
            dash_strength = pulse(frame, phase=0.9, low=0.05, high=0.22)
            for i in range(10):
                x = 566 + i * 13
                y2 = 764
                y1 = y2 - int((18 + (i % 4) * 8) * (0.75 + dash_strength))
                draw.rounded_rectangle((x, y1, x + 5, y2), radius=2, fill=(37, 170, 160, int(155 * dash_strength)))
            dashboard = dashboard.filter(ImageFilter.GaussianBlur(0.35))
            light_layer.alpha_composite(dashboard)

            composed.alpha_composite(light_layer)
            writer.append_data(np.asarray(composed.convert("RGB")))
    finally:
        writer.close()

    print(OUT)


if __name__ == "__main__":
    main()
