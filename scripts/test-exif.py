import os
import io
from PIL import Image
import piexif
import requests
import json
import uuid

# 1. Read env
env_vars = {}
with open('.env.test', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

# 2. Create image with GPS EXIF
img = Image.new('RGB', (100, 100), color = 'red')

gps_ifd = {
    piexif.GPSIFD.GPSLatitudeRef: 'N',
    piexif.GPSIFD.GPSLatitude: ((22, 1), (19, 1), (1, 1)),
    piexif.GPSIFD.GPSLongitudeRef: 'E',
    piexif.GPSIFD.GPSLongitude: ((87, 1), (18, 1), (1, 1))
}
exif_dict = {"0th": {}, "Exif": {}, "GPS": gps_ifd, "1st": {}, "thumbnail": None}
exif_bytes = piexif.dump(exif_dict)

img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG', exif=exif_bytes)
img_bytes = img_byte_arr.getvalue()

# 3. Authenticate to Supabase to upload
url = f"{env_vars['SUPABASE_URL']}/auth/v1/token?grant_type=password"
auth_data = {
    'email': env_vars['E2E_STUDENT_A_EMAIL'],
    'password': env_vars['E2E_STUDENT_PASSWORD']
}
headers = {
    'apikey': env_vars['SUPABASE_ANON_KEY'],
    'Content-Type': 'application/json'
}
resp = requests.post(url, headers=headers, json=auth_data)
if not resp.ok:
    print(f"Auth failed: {resp.text}")
    exit(1)

access_token = resp.json()['access_token']
user_id = resp.json()['user']['id']
filename = f"{uuid.uuid4()}.jpg"
object_path = f"{user_id}/{filename}"

# 4. Upload to storage
upload_url = f"{env_vars['SUPABASE_URL']}/storage/v1/object/listing-photos/{object_path}"
headers = {
    'apikey': env_vars['SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {access_token}",
    'Content-Type': 'image/jpeg'
}
resp = requests.post(upload_url, headers=headers, data=img_bytes)
if not resp.ok:
    print(f"Upload failed: {resp.text}")
    exit(1)

print(f"Uploaded successfully to {object_path}")

# 5. Download authenticated URL
auth_download_url = f"{env_vars['SUPABASE_URL']}/storage/v1/object/authenticated/listing-photos/{object_path}"
print(f"Downloading from {auth_download_url}")
resp = requests.get(auth_download_url, headers={'Authorization': f"Bearer {access_token}"})
if not resp.ok:
    print(f"Download failed: {resp.text}")
    exit(1)

# 6. Check EXIF
downloaded_img = Image.open(io.BytesIO(resp.content))
if 'exif' not in downloaded_img.info:
    print("SUCCESS: EXIF data was stripped!")
else:
    exif_dict = piexif.load(downloaded_img.info['exif'])
    if "GPS" in exif_dict and exif_dict["GPS"]:
        print("FAIL: GPS data survived the upload!")
        print(exif_dict["GPS"])
    else:
        print("SUCCESS: GPS EXIF is missing.")
