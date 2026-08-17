export const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
export const tileKey = (x,y) => `${x},${y}`;

export function formatNumber(value){
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if(abs >= 1e9) return `${(n/1e9).toFixed(2)}b`;
  if(abs >= 1e6) return `${(n/1e6).toFixed(2)}m`;
  if(abs >= 1e3) return `${(n/1e3).toFixed(1)}k`;
  return Math.round(n).toString();
}
export const formatMoney = value => `£${formatNumber(value)}`;

export function hashString(value){
  let h = 2166136261 >>> 0;
  for(let i=0;i<value.length;i++){
    h ^= value.charCodeAt(i);
    h = Math.imul(h,16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed){
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
