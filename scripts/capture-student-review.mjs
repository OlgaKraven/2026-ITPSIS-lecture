import './report-directory.mjs';
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5195/2026-ITPSIS-lecture/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:2560,height:1440}}),screens=[];
try{
 await mkdir('reports/screens/student-read',{recursive:true});
 for(const [index,lecture] of course.lectures.entries()){
  const longest=filter=>lecture.slides.filter(filter).sort((a,b)=>JSON.stringify(b).length-JSON.stringify(a).length)[0];
  const ids=[lecture.id+'-intro',longest(s=>s.id.endsWith('-term')).id,longest(s=>s.id.endsWith('-flow')&&!s.visual).id,longest(s=>s.id.includes('-summary-')).id];
  const theme=index%2?'dark':'light';
  await page.goto(base+`?mode=print&scope=${lecture.id}`);await page.locator('.print-page').last().waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(({ids,theme})=>{
   document.documentElement.dataset.theme=theme;
   const nodes=ids.map(id=>document.querySelector(`[data-slide-id="${id}"]`).closest('.print-page'));
   const grid=document.createElement('main');grid.style.cssText='display:grid;grid-template-columns:1280px 1280px;width:2560px;height:1440px;gap:0;background:var(--bg)';
   for(const node of nodes){node.style.cssText='width:1280px;height:720px;margin:0;padding:0;max-width:none;';grid.append(node)}
   document.body.style.cssText='margin:0;padding:0;width:2560px;min-height:1440px;';document.body.replaceChildren(grid);
  },{ids,theme});
  const path=`reports/screens/student-read/${String(index+1).padStart(2,'0')}-${theme}.png`;
  await page.screenshot({path});screens.push({lectureId:lecture.id,theme,slideIds:ids,path});
 }
 await writeFile('reports/student-screens.json',JSON.stringify({contentVersion:course.contentVersion,screens},null,2)+'\n');
 console.log(`Сохранено ${screens.length} листов: введение и плотные определения, разборы и итоги каждой лекции.`);
}finally{await browser.close()}
