from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def draw_icon(size: int) -> Image.Image:
    scale = size / 64
    image = Image.new("RGBA", (size, size), (11, 14, 14, 255))
    draw = ImageDraw.Draw(image)

    def p(value: float) -> int:
        return round(value * scale)

    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=p(12), fill=(11, 14, 14, 255))

    orbit = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    orbit_draw = ImageDraw.Draw(orbit)
    orbit_draw.ellipse((p(5), p(20), p(59), p(44)), outline=(245, 247, 245, 105), width=max(1, p(1.35)))
    orbit = orbit.rotate(-18, resample=Image.Resampling.BICUBIC, center=(size // 2, size // 2))
    image.alpha_composite(orbit)

    orbit_vertical = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    orbit_vertical_draw = ImageDraw.Draw(orbit_vertical)
    orbit_vertical_draw.ellipse((p(19), p(4), p(45), p(60)), outline=(245, 247, 245, 58), width=max(1, p(1.2)))
    orbit_vertical = orbit_vertical.rotate(32, resample=Image.Resampling.BICUBIC, center=(size // 2, size // 2))
    image.alpha_composite(orbit_vertical)

    font_path = Path("C:/Windows/Fonts/arialbd.ttf")
    font = ImageFont.truetype(str(font_path), p(43))
    text = "S"
    bounds = draw.textbbox((0, 0), text, font=font)
    text_width = bounds[2] - bounds[0]
    text_height = bounds[3] - bounds[1]
    draw.text(
        ((size - text_width) / 2, (size - text_height) / 2 - bounds[1] - p(1)),
        text,
        font=font,
        fill=(245, 247, 245, 255),
    )

    draw.arc((p(4), p(19), p(60), p(45)), 306, 344, fill=(255, 92, 34, 255), width=max(2, p(2.4)))
    return image


icon = draw_icon(512)
icon.save(ASSETS / "favicon-180.png", format="PNG", optimize=True)
icon.save(
    ASSETS / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
