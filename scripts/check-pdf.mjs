import {readFile,writeFile} from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const result=[];const out=process.env.PDF_OUTPUT_DIR||'outputs/pdf';
for(const l of course.lectures){
  const doc=await getDocument({data:new Uint8Array(await readFile(`${out}/${l.id}.pdf`)),useWorkerFetch:false,isEvalSupported:false}).promise;
  if(doc.numPages!==l.slides.length)throw Error(l.id+': неверное число страниц');
  for(let i=0;i<doc.numPages;i++){
    const p=await doc.getPage(i+1),s=l.slides[i];const content=await p.getTextContent();const text=content.items.map(x=>x.str||'').join(' '),n=norm(text);
    const required=[s.title,s.body,s.notebook,...(s.bullets||[]),...(s.task?[s.task.prompt,...(s.task.options||[]).map(o=>o.text),...(s.task.items||[]).map(o=>o.text)]:[])].filter(Boolean);
    for(const item of required)if(!n.includes(norm(item)))throw Error(`${s.id}: текст отсутствует в PDF: ${item.slice(0,70)}`);
    if(/ITPSIS_PRIVATE_SCRIPT_20260912|Правильно ·|Ещё попытка|Разбор ответа/.test(text))throw Error(s.id+': приватные данные или попытка в PDF');
    const viewport=p.getViewport({scale:1});if(Math.abs(viewport.width/viewport.height-16/9)>.01)throw Error(s.id+': неверный формат');
  }
  result.push({id:l.id,pages:doc.numPages,status:'passed'});
}
await writeFile('reports/pdf-check.json',JSON.stringify({contentVersion:course.contentVersion,files:result,checks:'Число, порядок, весь основной текст, варианты и условия заданий, 16:9, отсутствие интерфейса и приватного маркера. Визуальный просмотр учитывается отдельно.'},null,2)+'\n');console.log(`Проверены ${result.length} PDF, ${result.reduce((n,x)=>n+x.pages,0)} страниц.`);
