import urllib.request
import sys
import subprocess
import os
import shutil

url = "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf"
ttf_path = "Archivo.ttf"

print("Downloading font...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response, open(ttf_path, 'wb') as out_file:
    data = response.read()
    out_file.write(data)

print(f"Downloaded {len(data)} bytes")

cmd = [
    "pyftsubset",
    ttf_path,
    "--output-file=archivo-var.woff2",
    "--flavor=woff2",
    "--layout-features=*",
    "--unicodes=U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+20B9,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
]

print("Running pyftsubset...")
try:
    subprocess.run(cmd, check=True)
    print("pyftsubset succeeded")
except subprocess.CalledProcessError as e:
    print(f"Error running pyftsubset: {e}")
    sys.exit(1)

out_dir = "C:/Users/prtkk/Desktop/kgp_marketplace/codebase/public/fonts"
shutil.move("archivo-var.woff2", os.path.join(out_dir, "archivo-var.woff2"))
print("Done!")
