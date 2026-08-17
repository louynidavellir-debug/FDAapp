from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    # Create image with dark background
    img = Image.new('RGBA', (size, size), (10, 10, 10, 255))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    s = size / 512
    
    # Shield shape
    shield_points = [
        (int(256*s), int(20*s)),      # Top center
        (int(470*s), int(100*s)),     # Top right
        (int(470*s), int(330*s)),    # Mid right
        (int(256*s), int(480*s)),    # Bottom center
        (int(42*s), int(330*s)),     # Mid left
        (int(42*s), int(100*s)),     # Top left
    ]
    
    # Draw shield border
    draw.polygon(shield_points, fill=(15, 15, 15, 255), outline=(0, 229, 255, 255))
    
    # Inner shield
    inner_points = [
        (int(256*s), int(55*s)),
        (int(435*s), int(125*s)),
        (int(435*s), int(315*s)),
        (int(256*s), int(445*s)),
        (int(77*s), int(315*s)),
        (int(77*s), int(125*s)),
    ]
    draw.polygon(inner_points, fill=None, outline=(0, 137, 154, 200))
    
    # Valknut (3 interlocking triangles) - simplified
    cx, cy = int(256*s), int(235*s)
    tri_size = int(80*s)
    
    # Triangle 1 - pointing up
    t1 = [
        (cx, cy - tri_size),
        (cx + int(tri_size*0.866), cy + int(tri_size*0.5)),
        (cx - int(tri_size*0.866), cy + int(tri_size*0.5)),
    ]
    draw.polygon(t1, fill=None, outline=(0, 229, 255, 255))
    
    # Triangle 2 - pointing down
    t2 = [
        (cx, cy + tri_size),
        (cx + int(tri_size*0.866), cy - int(tri_size*0.5)),
        (cx - int(tri_size*0.866), cy - int(tri_size*0.5)),
    ]
    draw.polygon(t2, fill=None, outline=(0, 229, 255, 255))
    
    # Glow effect - draw circles around center
    for r in range(3):
        radius = int((120 + r*30)*s)
        bbox = [cx-radius, cy-radius, cx+radius, cy+radius]
        draw.ellipse(bbox, fill=None, outline=(0, 229, 255, 30 - r*10))
    
    # Add "FA" text at bottom
    try:
        font_size = int(50*s)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "FA"
    bbox = draw.textbbox((0,0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = cx - tw//2
    ty = int(400*s) - th//2
    draw.text((tx, ty), text, fill=(0, 229, 255, 255), font=font)
    
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

# Create output directory
os.makedirs('icons', exist_ok=True)

# Generate icons
create_icon(192, 'icons/icon-192.png')
create_icon(512, 'icons/icon-512.png')

print("Icons generated successfully!")