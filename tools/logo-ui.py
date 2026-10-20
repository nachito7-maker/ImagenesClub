from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Image.open(root/'public/assets/references/logo.png').convert('RGB')
# Official monochrome artwork: white + alpha reconstructs its exact luminance on black.
alpha=source.convert('L')
bounds=alpha.getbbox()
logo=Image.new('RGBA',source.size,(255,255,255,0));logo.putalpha(alpha)
logo=logo.crop(bounds)
logo.save(root/'public/assets/references/logo-ui.png',optimize=True)
print('Official artwork preserved; luminance matte, no threshold/resampling:',bounds,logo.size)
