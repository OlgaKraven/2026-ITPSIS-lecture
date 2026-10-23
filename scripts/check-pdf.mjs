import './report-directory.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const visualText=v=>v==null?[]:v.display==='stateTracks'?[v.caption,...v.rows.flatMap(([name,states,criterion])=>[name,...states.split(' \u2192 '),criterion])]:v.type==='duration'?[v.caption,v.axisLabel,...v.segments.map(s=>`${s.title}`),...v.segments.map(s=>`${s.value} ${v.unit}`),...v.ticks.map(t=>t.label),...(v.threshold?[v.threshold.label]:[])]:typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(visualText):typeof v==='object'?Object.entries(v).filter(([k])=>!['type','id','from','to','image','display'].includes(k)).flatMap(([,x])=>visualText(x)):[];
const result=[];const out=process.env.PDF_OUTPUT_DIR||'outputs/pdf';
for(const l of course.lectures){
  const doc=await getDocument({data:new Uint8Array(await readFile(`${out}/${l.id}.pdf`)),useWorkerFetch:false,isEvalSupported:false}).promise;
  if(doc.numPages!==l.slides.length)throw Error(l.id+': неверное число страниц');
  for(let i=0;i<doc.numPages;i++){
    const p=await doc.getPage(i+1),s=l.slides[i];const content=await p.getTextContent();const text=content.items.map(x=>x.str||'').join(' '),n=norm(text);
    const references=s.kind==='literature'?(s.references||course.literature[s.readingGroup||'primary']):[];
    const required=[s.title,s.body,s.notebook,...(s.bullets||[]),...(s.columns?.[0]==='\u0427\u0430\u0441\u0442\u044c \u0440\u0430\u0437\u0431\u043e\u0440\u0430'?[]:s.columns||[]),...(s.rows||[]).flat(),...visualText(s.visual),...references.map(r=>r.citation),...(s.kind==='agenda'?l.slides.filter(s=>s.kind==='section').map(s=>s.title):[]),...(s.kind==='materials'?[course.materialsUrl]:[]),...(s.task?[s.task.prompt,...(s.task.options||[]).map(o=>o.text),...(s.task.items||[]).map(o=>o.text)]:[])].filter(Boolean);
    const links=(await p.getAnnotations()).filter(a=>a.subtype==='Link').map(a=>a.url);
    for(const url of [...(s.supplement?[new URL(s.supplement.href,course.publicUrl).href]:[]),...references.map(r=>r.url),...(s.kind==='materials'?[course.materialsUrl]:[])].filter(Boolean))if(!links.includes(new URL(url).href))throw Error(`${s.id}: нет ссылки ${url} в PDF`);
    for(const item of required)if(!n.includes(norm(item)))throw Error(`${s.id}: текст отсутствует в PDF: ${item.slice(0,70)}`);
    if(/ITPSIS_PRIVATE_SCRIPT_20260912|Правильно ·|Ещё попытка|Разбор ответа/.test(text))throw Error(s.id+': приватные данные или попытка в PDF');
    if(s.supplement){
      const left=content.items.find(x=>x.str?.trim()==='Задача'),right=content.items.find(x=>x.str?.trim()==='Что проверить');
      if(!left||!right||right.transform[4]-left.transform[4]<200||Math.abs(right.transform[5]-left.transform[5])>3)throw Error(s.id+': shifted passport headings');
    }
    const viewport=p.getViewport({scale:1});if(Math.abs(viewport.width/viewport.height-16/9)>.01)throw Error(s.id+': неверный формат');
  }
  result.push({id:l.id,pages:doc.numPages,status:'passed'});
}
await writeFile('reports/pdf-check.json',JSON.stringify({contentVersion:course.contentVersion,files:result,checks:'Число, порядок, весь основной текст, варианты и условия заданий, 16:9, отсутствие интерфейса и приватного маркера. Визуальный просмотр учитывается отдельно.'},null,2)+'\n');console.log(`Проверены ${result.length} PDF, ${result.reduce((n,x)=>n+x.pages,0)} страниц.`);
