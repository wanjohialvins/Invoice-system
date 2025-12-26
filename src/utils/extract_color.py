
import sys
try:
    from PIL import Image
except ImportError:
    print("PIL not installed")
    sys.exit(1)

import colorsys

def get_dominant_blue(image_path):
    try:
        img = Image.open(image_path)
        img = img.resize((150, 150))
        pixels = img.getdata()
        
        blues = []
        for r, g, b in pixels:
            # Convert to HSV to find "blue" hue
            # Hue of blue is around 0.66 (240 degrees)
            h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            
            # Check if it's blue-ish (Hue between 0.55 and 0.75), saturated enough, and bright enough
            if 0.55 < h < 0.75 and s > 0.4 and v > 0.2:
                blues.append((r, g, b))
                
        if not blues:
            return None
            
        # simple average of found blues
        avg_r = sum(c[0] for c in blues) // len(blues)
        avg_g = sum(c[1] for c in blues) // len(blues)
        avg_b = sum(c[2] for c in blues) // len(blues)
        
        return f"#{avg_r:02x}{avg_g:02x}{avg_b:02x}"

    except Exception as e:
        print(f"Error: {e}")
        return None

image_path = r"C:/Users/alvod/.gemini/antigravity/brain/7db55e4b-19ab-41b3-a4c6-2404159621ef/uploaded_image_1766776495848.jpg"
color = get_dominant_blue(image_path)
if color:
    print(f"FOUND_COLOR:{color}")
else:
    print("NO_BLUE_FOUND")
