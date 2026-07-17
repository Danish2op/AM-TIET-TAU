from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources and photos"
TARGET = ROOT / "public" / "assets"

ASSETS = {
    "DED system.jpeg": ("ded-system.webp", 1600),
    "Wire EDM system.jpeg": ("wire-edm.webp", 1500),
    "20251106_172911.jpg": ("ded-process.webp", 1500),
    "20251106_163416.jpg": ("printed-component.webp", 1400),
    "20251106_172303.jpg": ("sample-coupons.webp", 1400),
    "20230808_200852.jpg": ("demo-component.webp", 1400),
}


def save_asset(source_name: str, target_name: str, max_width: int) -> None:
    source_path = SOURCE / source_name
    target_path = TARGET / target_name
    with Image.open(source_path) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize((max_width, int(image.height * ratio)), Image.LANCZOS)
        image.save(target_path, "WEBP", quality=82, method=6)
    print(f"{target_name}: {target_path.stat().st_size // 1024} KB")


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for source_name, (target_name, max_width) in ASSETS.items():
        save_asset(source_name, target_name, max_width)


if __name__ == "__main__":
    main()

