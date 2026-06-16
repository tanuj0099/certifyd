from PIL import Image
import sys

def process_logo():
    try:
        img = Image.open('public/logo.png').convert("RGBA")
        datas = img.getdata()
        
        light_data = []
        dark_data = []
        
        for item in datas:
            # Check for white/off-white background
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                light_data.append((255, 255, 255, 0))
                dark_data.append((255, 255, 255, 0))
            else:
                light_data.append(item)
                
                # Check for dark pixels (the border/outline)
                # We don't want to invert the blue bars. Blue bars have high blue/green.
                # Dark pixels usually have R, G, B all below 80.
                if item[0] < 80 and item[1] < 80 and item[2] < 90:
                    # Make the outline a nice light color for dark mode (e.g. off-white)
                    dark_data.append((220, 220, 230, item[3]))
                else:
                    dark_data.append(item)
                    
        light_img = Image.new("RGBA", img.size)
        light_img.putdata(light_data)
        
        dark_img = Image.new("RGBA", img.size)
        dark_img.putdata(dark_data)
        
        # Crop the images using the bounding box of non-transparent pixels
        bbox = light_img.getbbox()
        if bbox:
            pad = 10
            bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(img.width, bbox[2]+pad), min(img.height, bbox[3]+pad))
            light_img = light_img.crop(bbox)
            dark_img = dark_img.crop(bbox)
            
        light_img.save('public/logo_light.png', "PNG")
        dark_img.save('public/logo_dark.png', "PNG")
        print("Logos processed successfully.")
    except Exception as e:
        print(f"Error processing logo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    process_logo()
