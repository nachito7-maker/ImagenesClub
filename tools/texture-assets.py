from PIL import Image, ImageDraw, ImageFilter
import random, math, os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=root+'/public/assets/textures';os.makedirs(out,exist_ok=True)
random.seed(97)
wood=Image.new('RGB',(512,512),(97,57,34));d=ImageDraw.Draw(wood)
for y in range(512):
 shade=random.randrange(-12,12)
 d.line([(0,y),(512,y)],fill=(max(0,97+shade),max(0,57+shade),max(0,34+shade)),width=1)
for i in range(400):
 y=random.randrange(512);x=random.randrange(512);length=random.randrange(20,220);col=random.choice([(59,35,24),(119,76,43),(89,51,32)])
 pts=[(x+j,y+math.sin(j/40+i)*1.7) for j in range(length)]
 d.line(pts,fill=col,width=1)
wood.filter(ImageFilter.GaussianBlur(.45)).save(out+'/wood.jpg',quality=88)
ref=Image.open(root+'/public/assets/references/plano.png').convert('RGB')
# Illustrative pictures visibly come from the attached artistic reference, not factual museum claims.
crops=[(344,49,376,91),(379,50,410,91),(407,50,438,91),(726,53,765,113),(790,52,842,149),(1097,112,1140,159),(1140,107,1186,157),(1184,107,1220,160),(1223,107,1262,159),(1088,283,1137,331),(1144,287,1191,332),(1200,287,1238,332)]
for i,crop in enumerate(crops):ref.crop(crop).resize((192,256),Image.Resampling.LANCZOS).save(out+f'/memory-{i}.jpg',quality=88)
print('Created wood grain and 12 reference-derived illustrated memory prints.')
