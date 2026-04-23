#!/usr/bin/env python3
"""Batch convert images to WebP and upload to Bunny CDN for intuitives-awaken."""
import os
import sys
import requests
from pathlib import Path
from PIL import Image

# Bunny CDN credentials for intuitives-awaken
STORAGE_ZONE = 'intuitives-awaken'
STORAGE_HOSTNAME = 'ny.storage.bunnycdn.com'
ACCESS_KEY = '1eb8ae9c-45fd-4203-ad710a9a76d5-13d8-47a8'
CDN_HOSTNAME = 'intuitives-awaken.b-cdn.net'

def convert_to_webp(input_path: Path, output_path: Path, quality: int = 82) -> Path:
    """Convert image to WebP format using Pillow."""
    img = Image.open(input_path)
    # Resize to max 1600px wide for articles (keeps file size manageable)
    max_width = 1600
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)
    
    # Convert to RGB if needed
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
            img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), 'WEBP', quality=quality, method=6)
    size_kb = output_path.stat().st_size / 1024
    print(f'  [webp] {output_path.name} ({size_kb:.0f}KB)')
    return output_path


def upload_file(local_path: Path, remote_path: str) -> str:
    """Upload a file to Bunny CDN and return the CDN URL."""
    url = f'https://{STORAGE_HOSTNAME}/{STORAGE_ZONE}/{remote_path}'
    
    with open(local_path, 'rb') as f:
        response = requests.put(
            url,
            data=f,
            headers={
                'AccessKey': ACCESS_KEY,
                'Content-Type': 'image/webp',
            }
        )
    
    if response.status_code in (200, 201):
        cdn_url = f'https://{CDN_HOSTNAME}/{remote_path}'
        print(f'  [cdn]  {cdn_url}')
        return cdn_url
    else:
        raise Exception(f'Upload failed: {response.status_code} {response.text}')


def main():
    images_dir = Path('/home/ubuntu/intuitives-awaken/images')
    webp_dir = Path('/home/ubuntu/intuitives-awaken/images-webp')
    
    # Collect all images to process
    image_files = []
    
    # UI images
    for img in (images_dir / 'ui').glob('*.jpg'):
        image_files.append((img, f'images/ui/{img.stem}.webp'))
    
    # Article images
    for img in (images_dir / 'articles').glob('*.jpg'):
        image_files.append((img, f'images/articles/{img.stem}.webp'))
    
    print(f'Processing {len(image_files)} images...\n')
    
    cdn_urls = {}
    errors = []
    
    for local_path, remote_path in image_files:
        print(f'Processing: {local_path.name}')
        try:
            # Convert to WebP
            webp_path = webp_dir / remote_path
            convert_to_webp(local_path, webp_path)
            
            # Upload to Bunny CDN
            cdn_url = upload_file(webp_path, remote_path)
            cdn_urls[local_path.stem] = cdn_url
            print()
        except Exception as e:
            print(f'  [ERROR] {e}')
            errors.append((local_path.name, str(e)))
            print()
    
    print('\n' + '='*60)
    print(f'SUCCESS: {len(cdn_urls)} images uploaded')
    if errors:
        print(f'ERRORS: {len(errors)}')
        for name, err in errors:
            print(f'  - {name}: {err}')
    
    # Write CDN URL map to JSON
    import json
    output = Path('/home/ubuntu/intuitives-awaken/src/data/image-cdn-urls.json')
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, 'w') as f:
        json.dump(cdn_urls, f, indent=2)
    print(f'\nCDN URL map written to: {output}')
    
    return len(errors) == 0


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
