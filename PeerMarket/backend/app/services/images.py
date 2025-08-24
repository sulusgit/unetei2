import os
from typing import Tuple
from fastapi import UploadFile, HTTPException
from ..config import UPLOAD_DIR

ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = 5 * 1024 * 1024

def ensure_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(file: UploadFile) -> Tuple[str, str]:
    ensure_dir()
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image too large")
    name = os.urandom(8).hex() + ALLOWED[file.content_type]
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(data)
    return path, f"/uploads/{name}"

def delete_image_by_url(public_url: str) -> None:
    if not public_url.startswith("/uploads/"):
        return
    fname = public_url.split("/uploads/", 1)[1]
    fpath = os.path.join(UPLOAD_DIR, fname)
    try:
        if os.path.isfile(fpath):
            os.remove(fpath)
    except Exception:
        pass