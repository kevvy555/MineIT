/** Lightweight Web Audio UI feedback for MineIT panel controls. */
let audioCtx=null;

function context(){
  if(typeof window==="undefined")return null;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  if(!audioCtx)audioCtx=new AC();
  if(audioCtx.state==="suspended")void audioCtx.resume();
  return audioCtx;
}

export function playUiTone({frequency=880,duration=.055,type="square",gain=.08,slideTo=null,delay=0}={}){
  const ctx=context();if(!ctx)return false;
  const osc=ctx.createOscillator(),amp=ctx.createGain(),now=ctx.currentTime+Math.max(0,delay);
  osc.type=type;osc.frequency.setValueAtTime(frequency,now);
  if(slideTo!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(40,slideTo),now+duration);
  amp.gain.setValueAtTime(Math.max(.0001,gain),now);
  amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(amp);amp.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.01);
  return true;
}

/** Short terminal-style chirp keyed off button role. */
export function playUiClick(button=null){
  const text=String(button?.textContent||"").toUpperCase();
  const cls=`${button?.className||""} ${button?.dataset?Object.keys(button.dataset).join(" "):""}`.toLowerCase();
  if(button?.disabled){
    playUiTone({frequency:190,duration:.045,type:"triangle",gain:.035});
    return true;
  }
  if(/demolish|bad|danger|cancel|decline/.test(text)||/\bbad\b/.test(cls)){
    playUiTone({frequency:260,duration:.07,type:"square",gain:.09,slideTo:120});
    playUiTone({frequency:140,duration:.09,type:"triangle",gain:.05,delay:.05});
    return true;
  }
  if(/launch|connect|auth|yes|confirm|open|upgrade|set primary|colony control/.test(text)||/\baction\b/.test(cls)){
    playUiTone({frequency:720,duration:.04,type:"square",gain:.085,slideTo:980});
    playUiTone({frequency:1180,duration:.06,type:"square",gain:.06,delay:.035});
    return true;
  }
  if(/close|back|keep|no\b/.test(text)){
    playUiTone({frequency:480,duration:.04,type:"triangle",gain:.055});
    playUiTone({frequency:360,duration:.05,type:"triangle",gain:.035,delay:.03});
    return true;
  }
  playUiTone({frequency:700,duration:.035,type:"square",gain:.075,slideTo:920});
  playUiTone({frequency:1040,duration:.05,type:"square",gain:.05,delay:.028});
  return true;
}
