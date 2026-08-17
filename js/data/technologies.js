function roman(n){ return ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][n-1] || n; }

function buildCategory(category,label){
  const list = [];
  for(let tier=1;tier<=12;tier++){
    const growth = 1 + (tier-1)*.55;
    list.push({
      id:`${category}-${tier}`,
      category,
      name:`${label} ${roman(tier)}`,
      tier,
      foodRequired:Math.round((category==="food"?180:95)*growth),
      industryRequired:Math.round((category==="industry"?160:100)*growth),
      surveyRequired:category==="survey"?Math.max(1,Math.floor((tier+1)/2)):Math.max(1,Math.floor(tier/3)+1),
      cost:Math.round((category==="survey"?8500:10000)*Math.pow(1.52,tier-1)),
      multiplier:category==="survey"?null:1.01+(tier-1)*.0025,
      scanMultiplier:category==="survey"?Math.max(.91,.985-(tier-1)*.003):null,
      hintIncrease:category==="survey" && [2,4,6,8,10,12].includes(tier) ? 1 : 0
    });
  }
  return list;
}

export const TECHNOLOGIES = Object.freeze([
  ...buildCategory("food","Bio-Yield Optimisation"),
  ...buildCategory("industry","Extraction Efficiency"),
  ...buildCategory("survey","Corporate Survey Suite")
]);
