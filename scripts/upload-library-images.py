"""
Convert all 40 library images to WebP and upload to Bunny CDN at /library/lib-01.webp ... lib-40.webp
"""
import os
import sys
from pathlib import Path
from PIL import Image
import urllib.request

BUNNY_STORAGE_ZONE = 'intuitives-awaken'
BUNNY_API_KEY = '1eb8ae9c-45fd-4203-ad710a9a76d5-13d8-47a8'
BUNNY_HOSTNAME = 'ny.storage.bunnycdn.com'
BUNNY_PULL_ZONE = 'https://intuitives-awaken.b-cdn.net'

IMAGES_DIR = Path('/home/ubuntu/intuitives-awaken/images/library')
WEBP_DIR = Path('/home/ubuntu/intuitives-awaken/images/library-webp')
WEBP_DIR.mkdir(parents=True, exist_ok=True)

results = []

for i in range(1, 41):
    name = f'lib-{str(i).zfill(2)}'
    src = IMAGES_DIR / f'{name}.jpg'
    webp = WEBP_DIR / f'{name}.webp'

    if not src.exists():
        print(f'[SKIP] {src} not found')
        continue

    # Convert to WebP
    img = Image.open(src)
    img = img.convert('RGB')
    # Resize to max 1200px wide for CDN efficiency
    max_w = 1200
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)
    img.save(webp, 'WEBP', quality=82, method=6)
    size_kb = webp.stat().st_size // 1024
    print(f'[WEBP] {name}.webp — {size_kb}KB')

    # Upload to Bunny CDN
    upload_url = f'https://{BUNNY_HOSTNAME}/{BUNNY_STORAGE_ZONE}/library/{name}.webp'
    with open(webp, 'rb') as f:
        data = f.read()

    req = urllib.request.Request(
        upload_url,
        data=data,
        method='PUT',
        headers={
            'AccessKey': BUNNY_API_KEY,
            'Content-Type': 'image/webp',
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code

    cdn_url = f'{BUNNY_PULL_ZONE}/library/{name}.webp'
    results.append({'name': name, 'status': status, 'url': cdn_url})
    print(f'[UPLOAD] {name}.webp → HTTP {status} → {cdn_url}')

# Verify all 40 are accessible
print('\n=== VERIFICATION ===')
failed = []
for r in results:
    try:
        req = urllib.request.Request(r['url'], method='HEAD')
        with urllib.request.urlopen(req) as resp:
            code = resp.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception as e:
        code = 0
    status = 'OK' if code == 200 else f'FAIL ({code})'
    print(f'  {r["name"]}: {status}')
    if code != 200:
        failed.append(r['name'])

print(f'\nTotal uploaded: {len(results)}/40')
if failed:
    print(f'FAILED: {failed}')
    sys.exit(1)
else:
    print('All 40 library images verified on Bunny CDN.')
