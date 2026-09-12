import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const port=5294,base=`http://127.0.0.1:${port}/2026-ITPSIS-lecture/`;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'pipe',windowsHide:true});
let browser;
try{
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error('Не запущен preview');
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const out=process.env.PDF_OUTPUT_DIR||'outputs/pdf';await mkdir(out,{recursive:true});const result=[];
  for(const l of course.lectures){
    await page.goto(`${base}?mode=print&scope=${l.id}`);await page.locator('.print-page').last().waitFor();
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    if(await page.locator('.print-page').count()!==l.slides.length)throw Error('Неполная печать '+l.id);
    await page.pdf({path:`${out}/${l.id}.pdf`,preferCSSPageSize:true,printBackground:true});
    result.push({id:l.id,pages:l.slides.length,path:`${out}/${l.id}.pdf`});
  }
  await writeFile('reports/pdf-export.json',JSON.stringify({contentVersion:course.contentVersion,files:result},null,2)+'\n');console.log(`Сохранено ${result.length} ученических PDF из рендерера сайта.`);
}finally{await browser?.close();server.kill();}
