#!/usr/bin/env python3
"""Upload images to Bunny CDN for intuitives-awaken.b-cdn.net"""
import os
import sys
import requests
from pathlib import Path

# Bunny CDN credentials for intuitives-awaken
STORAGE_ZONE = 'intuitives-awaken'
STORAGE_HOSTNAME = 'ny.storage.bunnycdn.com'
ACCESS_KEY = '1eb8ae9c-45fd-4203-ad710a9a76d5-13d8-47a8'
CDN_HOSTNAME = 'intuitives-awaken.b-cdn.net'

def upload_file(local_path: str, remote_path: str) -> str:
    """Upload a file to Bunny CDN and return the CDN URL."""
    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"File not found: {local_path}")

    # Determine content type
    suffix = local_path.suffix.lower()
    content_types = {
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
    }
    content_type = content_types.get(suffix, 'application/octet-stream')

    url = f'https://{STORAGE_HOSTNAME}/{STORAGE_ZONE}/{remote_path}'
    
    with open(local_path, 'rb') as f:
        response = requests.put(
            url,
            data=f,
            headers={
                'AccessKey': ACCESS_KEY,
                'Content-Type': content_type,
            }
        )
    
    if response.status_code in (200, 201):
        cdn_url = f'https://{CDN_HOSTNAME}/{remote_path}'
        print(f'[bunny] Uploaded: {cdn_url}')
        return cdn_url
    else:
        raise Exception(f'Upload failed: {response.status_code} {response.text}')


def convert_to_webp(input_path: str, output_path: str, quality: int = 82) -> str:
    """Convert image to WebP format using Pillow."""
    from PIL import Image
    img = Image.open(input_path)
    
    # Convert to RGB if needed (for RGBA images)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
            img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    img.save(output_path, 'WEBP', quality=quality, method=6)
    size_kb = Path(output_path).stat().st_size / 1024
    print(f'[webp] Converted: {output_path} ({size_kb:.0f}KB)')
    return output_path


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python upload-to-bunny.py <local_file> <remote_path>')
        sys.exit(1)
    local = sys.argv[1]
    remote = sys.argv[2]
    cdn_url = upload_file(local, remote)
    print(f'CDN URL: {cdn_url}')
