const PATHS = {
  fungal:`<path d="M8 18c2-6 14-6 16 0H8Zm8-1v8m-5 0h10M10 13c1-4 11-4 12 0M12 9c2-3 6-3 8 0"/>`,
  soil:`<path d="M6 9h20M8 14h16M6 19h20M10 24h12"/><path d="M13 7l3-3 3 3"/>`,
  aquifer:`<path d="M16 4c4 6 7 9 7 13a7 7 0 1 1-14 0c0-4 3-7 7-13Z"/><path d="M8 25h16"/>`,
  flora:`<path d="M16 26V11M16 15c-6 0-9-3-9-8 6 0 9 3 9 8Zm0 3c6 0 9-3 9-8-6 0-9 3-9 8Z"/>`,
  protein:`<circle cx="16" cy="16" r="7"/><circle cx="13" cy="14" r="1.5"/><circle cx="19" cy="18" r="1.5"/><path d="M16 5v4m0 14v4M5 16h4m14 0h4"/>`,
  thermal:`<path d="M8 24h16M10 20c2-2 2-4 0-6m6 6c2-2 2-4 0-6m6 6c2-2 2-4 0-6"/><path d="M12 9l4-5 4 5"/>`,
  bulk:`<path d="M7 20 11 8l9-3 6 8-3 12-11 2-5-7Z"/><path d="m11 8 7 7 8-2M18 15l5 10"/>`,
  iron:`<path d="M6 18 11 7l10-2 5 8-4 12-11 2-5-9Z"/><path d="M11 7l5 7 5-9M16 14l6 11"/>`,
  carbon:`<path d="M6 9h20M8 14h16M6 19h20M10 24h12"/><path d="M12 6h8"/>`,
  copper:`<circle cx="16" cy="16" r="10"/><path d="M10 19c4-6 8-6 12-1M13 10l6 12"/>`,
  reactive:`<path d="m16 4 3 6 7-2-3 6 5 4-7 1 1 7-6-4-5 5 1-7-7-1 5-5-4-6 7 2 3-6Z"/>`,
  conductive:`<path d="M7 20 11 8l9-3 6 8-3 12-11 2-5-7Z"/><path d="m18 7-5 9h5l-3 9 8-11h-5l4-7"/>`,
  magnetic:`<path d="M8 9v8a8 8 0 0 0 16 0V9h-5v8a3 3 0 0 1-6 0V9H8Z"/><path d="M8 9h5m6 0h5"/>`,
  exotic:`<path d="m16 3 7 5 4 8-5 9-10 3-7-8 3-10 8-7Z"/><path d="m16 3 0 13 11 0M16 16l-4 12M8 10l8 6"/>`,
  advanced:`<path d="m16 3 9 5v10l-9 11-9-11V8l9-5Z"/><path d="m16 8 5 3v6l-5 6-5-6v-6l5-3Z"/><circle cx="16" cy="15" r="2"/>`,
  silver:`<path d="m16 4 8 8-8 16-8-16 8-8Z"/><path d="m8 12 8 4 8-4"/>`,
  gold:`<path d="M8 10h16l3 12H5l3-12Z"/><path d="M11 10l2-5h6l2 5M10 17h12"/>`,
  platinum:`<path d="m16 4 9 6-3 14H10L7 10l9-6Z"/><path d="m7 10 9 5 9-5M16 15v9"/>`,
  palladium:`<path d="m16 4 8 4 4 8-4 8-8 4-8-4-4-8 4-8 8-4Z"/><circle cx="16" cy="16" r="5"/>`,
  gems:`<path d="m9 17 5-8 5 8-5 8-5-8Z"/><path d="m17 12 4-6 5 7-5 7-4-8Z"/><path d="m4 21 4-6 5 7-5 6-4-7Z"/>`,
  sapphire:`<path d="m16 3 9 8-3 13H10L7 11l9-8Z"/><path d="m7 11 9 5 9-5M16 16v8"/>`,
  ruby:`<path d="m16 3 8 7-2 14H10L8 10l8-7Z"/><path d="M8 10h16l-8 6-8-6Zm8 6v8"/>`,
  emerald:`<path d="M10 5h12l5 5v12l-5 5H10l-5-5V10l5-5Z"/><path d="M10 9h12l1 1v12l-1 1H10l-1-1V10l1-1Z"/>`,
  diamond:`<path d="M7 11 12 5h8l5 6-9 16L7 11Z"/><path d="m7 11 9 4 9-4M12 5l4 10 4-10"/>`,
  crystal:`<path d="m16 2 3 8 8-3-4 7 7 4-8 2 2 8-6-5-5 7 1-8-8 2 5-6-7-4 8-1-2-8 6 5 4-7Z"/>`
};

export class ResourceIcons {
  colorFor(tile){
    if(tile.type==="food") return "#79e09a";
    if(tile.type==="valuable") return "#ddb2ff";
    return "#ffc46b";
  }

  svg(id,color="#eaf4f8",size=32){
    return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[id]||PATHS.bulk}</svg>`;
  }

  compiled(id){
    this.cache ||= {};
    if(this.cache[id]) return this.cache[id];
    const markup=PATHS[id]||PATHS.bulk;
    const shapes=[];

    if(typeof Path2D!=="undefined"){
      const pathRe=/<path d="([^"]+)"\/>/g;
      let match;
      while((match=pathRe.exec(markup))!==null){
        try{ shapes.push({kind:"path",value:new Path2D(match[1])}); }catch{}
      }
    }

    const circleRe=/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"\/>/g;
    let circle;
    while((circle=circleRe.exec(markup))!==null){
      shapes.push({kind:"circle",cx:+circle[1],cy:+circle[2],r:+circle[3]});
    }

    this.cache[id]=shapes;
    return shapes;
  }

  fallback(ctx,tile,cx,cy,size){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.strokeStyle=this.colorFor(tile);
    ctx.lineWidth=Math.max(1.4,size*.075);
    ctx.lineCap="round";ctx.lineJoin="round";
    const r=size*.34;
    ctx.beginPath();

    if(tile.type==="food"){
      ctx.moveTo(0,r);ctx.bezierCurveTo(-r,-r*.1,-r*.8,-r*.9,0,-r);
      ctx.bezierCurveTo(r*.8,-r*.9,r,-r*.1,0,r);
      ctx.moveTo(0,r*.65);ctx.lineTo(0,-r*.55);
    }else if(tile.type==="valuable"){
      ctx.moveTo(0,-r);ctx.lineTo(r*.75,-r*.2);ctx.lineTo(r*.42,r);
      ctx.lineTo(-r*.42,r);ctx.lineTo(-r*.75,-r*.2);ctx.closePath();
      ctx.moveTo(-r*.75,-r*.2);ctx.lineTo(0,r*.12);ctx.lineTo(r*.75,-r*.2);
    }else{
      ctx.moveTo(-r*.8,r*.55);ctx.lineTo(-r*.45,-r*.7);ctx.lineTo(r*.35,-r);
      ctx.lineTo(r*.85,-r*.15);ctx.lineTo(r*.5,r*.75);ctx.lineTo(-r*.35,r);ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx,tile,cx,cy,size){
    const shapes=this.compiled(tile.resourceId||"bulk");
    if(!shapes.length){ this.fallback(ctx,tile,cx,cy,size); return; }

    ctx.save();
    const scale=size/32;
    ctx.translate(cx-size/2,cy-size/2);
    ctx.scale(scale,scale);
    ctx.strokeStyle=this.colorFor(tile);
    ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";

    try{
      for(const shape of shapes){
        if(shape.kind==="path") ctx.stroke(shape.value);
        else{
          ctx.beginPath();ctx.arc(shape.cx,shape.cy,shape.r,0,Math.PI*2);ctx.stroke();
        }
      }
    }catch{
      ctx.restore();
      this.fallback(ctx,tile,cx,cy,size);
      return;
    }
    ctx.restore();
  }
}
