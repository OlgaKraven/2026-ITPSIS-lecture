import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5195/2026-ITPSIS-lecture/';
const result=[];
try{
 for(const theme of ['light','dark']){
  await page.goto(base);await page.evaluate(({theme,base})=>localStorage.setItem(`lecture:${base}:itpsis:theme`,JSON.stringify(theme)),{theme,base:'/2026-ITPSIS-lecture/'});
  for(const l of course.lectures){
   await page.goto(`${base}?mode=print&scope=${l.id}`);await page.locator('.print-page').last().waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
   const bad=await page.locator('.slide-frame').evaluateAll(nodes=>nodes.flatMap(e=>{
    const result=[];const rect=e.getBoundingClientRect();
    for(const x of e.querySelectorAll('.slide-copy,.slide-content,.public-task,.table-scroll,.write-note,.title-profile,.study-reasoning,.study-contrast,.study-tracks,.study-duration')){
     if(x.scrollHeight>x.clientHeight+3||x.scrollWidth>x.clientWidth+3)result.push({id:e.dataset.slideId,kind:e.className,element:x.className,scroll:[x.scrollHeight,x.clientHeight,x.scrollWidth,x.clientWidth]});
    }
    for(const x of e.querySelectorAll('h2,.slide-footer,.title-profile,.write-note')){const r=x.getBoundingClientRect();if(r.bottom>rect.bottom+3)result.push({id:e.dataset.slideId,element:x.className,bottom:r.bottom-rect.bottom});}
    for(const svg of e.querySelectorAll('svg.infographic-svg'))for(const t of svg.querySelectorAll('text')){const b=t.getBBox(),v=svg.viewBox.baseVal;if(b.x< -2||b.y< -2||b.x+b.width>v.width+2||b.y+b.height>v.height+2)result.push({id:e.dataset.slideId,element:'svg-text',text:t.textContent});}
    return result;
   }));
   result.push({theme,lecture:l.id,pages:await page.locator('.print-page').count(),problems:bad});
  }
 }
 await mkdir('reports',{recursive:true});await writeFile('reports/layout-check.json',JSON.stringify({contentVersion:course.contentVersion,checks:result},null,2)+'\n');
 const problems=result.flatMap(r=>r.problems);console.log(JSON.stringify({runs:result.length,problems:problems.length,examples:problems.slice(0,16)},null,2));
 if(problems.length)process.exitCode=1;
}finally{await browser.close()}
