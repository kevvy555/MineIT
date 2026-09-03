/** Lightweight Web Audio UI feedback for MineIT panel controls. */
let audioCtx=null;

function context(){
  if(typeof window==="undefined")return null;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  if(!audioCtx)audioCtx=new AC();
  if(audioCtx.state==="suspended")void audioCtx.resume();
  return audioCtx;
}

export function playUiTone({frequency=880,duration=.055,type="square",gain=.045,slideTo=null}={}){
  const ctx=context();if(!ctx)return false;
  const osc=ctx.createOscillator(),amp=ctx.createGain(),now=ctx.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(frequency,now);
  if(slideTo!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(40,slideTo),now+duration);
  amp.gain.setValueAtTime(Math.max(.0001,gain),now);
  amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(amp);amp.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.01);
  return true;
}

/** Soft terminal-style chirp keyed off button role. */
export function playUiClick(button=null){
  const text=String(button?.textContent||"").toUpperCase();
  const cls=`${button?.className||""} ${button?.dataset?Object.keys(button.dataset).join(" "):""}`.toLowerCase();
  if(button?.disabled)return playUiTone({frequency:180,duration:.04,type:"triangle",gain:.02});
  if(/demolish|bad|danger|cancel|decline/.test(text)||/\bbad\b/.test(cls))return playUiTone({frequency:220,duration:.08,type:"square",gain:.05,slideTo:110});
  if(/launch|connect|auth|yes|confirm|open|upgrade|set primary/.test(text)||/\baction\b/.test(cls))return playUiTone({frequency:740,duration:.06,type:"square",gain:.05,slideTo:1180});
  if(/close|back|keep|no\b/.test(text))return playUiTone({frequency:420,duration:.04,type:"triangle",gain:.03});
  return playUiTone({frequency:660,duration:.045,type:"square",gain:.04,slideTo:880});
}
