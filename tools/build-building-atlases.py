#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

FAMILIES=(
    "housing","industry","quarry","mine","deep-mine",
    "rig","farm","ranch","bio-harvester","algae-facility",
)
FRAME=256
PADDING=12
QUALITY=92

ROOT=Path(__file__).resolve().parents[1]
DEVELOPMENT_ROOT=ROOT/"assets"/"art"/"development"


def build_family(family:str)->bool:
    source_dir=DEVELOPMENT_ROOT/family/"originals"
    sources=[source_dir/f"{family}-l{level}.png" for level in range(1,6)]
    missing=[p for p in sources if not p.exists()]
    if missing:
        print(f"skip {family}: missing {len(missing)} source image(s)")
        return False

    atlas=Image.new("RGBA",(FRAME*5,FRAME),(0,0,0,0))
    max_size=FRAME-PADDING*2
    for index,path in enumerate(sources):
        image=Image.open(path).convert("RGBA")
        bbox=image.getbbox()
        if bbox:
            image=image.crop(bbox)
        scale=min(max_size/image.width,max_size/image.height,1.0)
        size=(max(1,round(image.width*scale)),max(1,round(image.height*scale)))
        if image.size!=size:
            image=image.resize(size,Image.Resampling.LANCZOS)
        x=index*FRAME+(FRAME-image.width)//2
        y=(FRAME-image.height)//2
        atlas.alpha_composite(image,(x,y))

    output=DEVELOPMENT_ROOT/family/f"{family}-levels-256.webp"
    output.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(output,"WEBP",quality=QUALITY,method=6)
    print(f"built {output.relative_to(ROOT)} ({atlas.width}x{atlas.height}, {output.stat().st_size} bytes)")
    return True


def main()->None:
    built=sum(build_family(family) for family in FAMILIES)
    print(f"built {built}/{len(FAMILIES)} high-resolution building atlases")


if __name__=="__main__":
    main()
