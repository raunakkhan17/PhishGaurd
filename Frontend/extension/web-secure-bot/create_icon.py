#!/usr/bin/env python3
"""
Simple script to create a basic icon.png for the Web Security Bot extension
Run this script to generate icon.png
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Create a 128x128 image with blue background
    img = Image.new('RGB', (128, 128), color='#4285f4')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple shield/security icon
    # Outer circle
    draw.ellipse([20, 20, 108, 108], outline='white', width=4)
    
    # Inner shield shape
    shield_points = [(64, 25), (45, 35), (45, 65), (64, 95), (83, 65), (83, 35)]
    draw.polygon(shield_points, fill='white')
    
    # Lock symbol
    draw.rectangle([58, 50, 70, 70], fill='#4285f4', outline='white', width=2)
    draw.ellipse([56, 45, 72, 55], fill='#4285f4', outline='white', width=2)
    
    # Save the icon
    img.save('icon.png')
    print("✅ icon.png created successfully!")
    print("You can now load your extension in Chrome!")
    
except ImportError:
    print("❌ PIL (Pillow) not found. Installing...")
    import subprocess
    subprocess.run(['pip', 'install', 'Pillow'])
    print("Please run this script again after installation.")
    
except Exception as e:
    print(f"❌ Error creating icon: {e}")
    print("\nAlternative: Download any 128x128 PNG image and name it 'icon.png'")
