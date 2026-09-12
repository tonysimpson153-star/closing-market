from pathlib import Path

from PIL import Image


source = Path("/home/ubuntu/closing-market/partner-catalog/assets/warehouse.jpg")
image = Image.open(source).convert("RGB")
image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
image.save(source, format="JPEG", quality=82, optimize=True, progressive=True)

print(f"optimized={source} size_bytes={source.stat().st_size}")
