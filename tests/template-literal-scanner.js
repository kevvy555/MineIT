const HTML_TAG=/<(?:article|aside|button|canvas|div|form|h[1-6]|header|label|li|main|nav|option|p|section|select|small|span|strong|table|tbody|td|textarea|th|thead|tr|ul)\b/i;

function skipQuoted(source,start,quote){
  for(let index=start+1;index<source.length;index++){
    if(source[index]==="\\"){index++;continue;}
    if(source[index]===quote)return index;
  }
  return source.length-1;
}

function skipLineComment(source,start){
  const end=source.indexOf("\n",start+2);
  return end<0?source.length-1:end;
}

function skipBlockComment(source,start){
  const end=source.indexOf("*/",start+2);
  return end<0?source.length-1:end+1;
}

function skipNonTemplateToken(source,index){
  const current=source[index],next=source[index+1];
  if(current==="'"||current==='"')return skipQuoted(source,index,current);
  if(current==="/"&&next==="/")return skipLineComment(source,index);
  if(current==="/"&&next==="*")return skipBlockComment(source,index);
  return index;
}

function scanExpression(source,start,templates){
  let depth=1;
  for(let index=start;index<source.length;index++){
    const current=source[index];
    if(current==="`"){index=scanTemplate(source,index,templates);continue;}
    const skipped=skipNonTemplateToken(source,index);if(skipped!==index){index=skipped;continue;}
    if(current==="{")depth++;
    else if(current==="}"&&--depth===0)return index;
  }
  return source.length-1;
}

function scanTemplate(source,start,templates){
  for(let index=start+1;index<source.length;index++){
    const current=source[index];
    if(current==="\\"){index++;continue;}
    if(current==="$"&&source[index+1]==="{"){index=scanExpression(source,index+2,templates);continue;}
    if(current==="`"){templates.push(source.slice(start,index+1));return index;}
  }
  return source.length-1;
}

/** Return real JavaScript template literals without pairing unrelated backticks. */
export function templateLiterals(source){
  const templates=[];
  for(let index=0;index<source.length;index++){
    const skipped=skipNonTemplateToken(source,index);if(skipped!==index){index=skipped;continue;}
    if(source[index]==="`")index=scanTemplate(source,index,templates);
  }
  return templates;
}

/** Find large template literals that actually contain application HTML. */
export function largeHtmlTemplates(source,minLength=500){
  return templateLiterals(source).filter(template=>template.length-2>=minLength&&HTML_TAG.test(template));
}
