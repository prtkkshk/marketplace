import piexif
from PIL import Image
import os

# Create a simple image
img = Image.new('RGB', (100, 100), color = 'red')
img.save('test_gps.jpg', quality=95)

# Add GPS EXIF data
exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}

# Set dummy GPS coordinates (e.g., IIT Kharagpur)
# Latitude: 22.3149° N, Longitude: 87.3105° E
def to_deg(value, loc):
    if value < 0:
        loc_value = loc[0]
    elif value > 0:
        loc_value = loc[1]
    else:
        loc_value = ""
    abs_value = abs(value)
    d = int(abs_value)
    m = int((abs_value - d) * 60)
    s = round((abs_value - d - m/60.0) * 3600 * 100000)
    return ((d, 1), (m, 1), (s, 100000)), loc_value

lat_deg, lat_ref = to_deg(22.3149, ["S", "N"])
lon_deg, lon_ref = to_deg(87.3105, ["W", "E"])

exif_dict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat_ref
exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = lat_deg
exif_dict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lon_ref
exif_dict["GPS"][piexif.GPSIFD.GPSLongitude] = lon_deg

exif_bytes = piexif.dump(exif_dict)
piexif.insert(exif_bytes, 'test_gps.jpg')

print("Created test_gps.jpg with GPS EXIF data.")
