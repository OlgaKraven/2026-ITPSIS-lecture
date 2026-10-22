import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const raw=await readFile('public/course.json'),course=JSON.parse(raw),pack=JSON.parse(await readFile('authoring/teacher-notes.json','utf8'));
const hash=createHash('sha256').update(raw).digest('hex');
await mkdir('docs/teacher',{recursive:true});
for(const l of course.lectures){
 const header=`---\ncourse: ${course.id}\nlecture: ${l.id}\ncontentVersion: ${course.contentVersion}\nsourceKind: local\nsourceSha256: ${hash}\n---\n\n# ${l.title}\n\n`;
 let teacher=header,presenter=header;
 const slides=[];
 for(const [i,s] of l.slides.entries()){
  const n=pack.notes[s.id];if(!n)throw Error('Нет заметки '+s.id);
  const anchor=`screen-${String(i+1).padStart(3,'0')}`;
  const heading=`<a id="${anchor}"></a>\n## ${i+1}. ${s.title}\n\n<!-- source-slides: ${s.id} -->\n\n`;
  teacher+=heading+n.script+'\n\n';
  if(s.notebook)teacher+=`Запишите: ${s.notebook}\n\n`;
  if(s.task||s.supplement)teacher+=`После самостоятельной попытки: ${n.answer}\n\n`;
  presenter+=heading+`Речь и показ:\n\n${n.script}\n\nПодготовка:\n\n${n.preparation}\n\nЗапись:\n\n${n.notebook}\n\nОбсуждение:\n\n${n.questions}\n\nОтвет преподавателю:\n\n${n.answer}\n\nОценка времени: ${n.estimatedSeconds} с; хронометраж не проводился.\n\n`;
  slides.push({lectureId:l.id,slideId:s.id,displayNumber:i+1,title:s.title,anchors:{teacher:anchor,presenter:anchor}});
 }
 await writeFile(`docs/teacher/${l.id}.teacher.md`,teacher.trimEnd()+'\n');
 await writeFile(`docs/teacher/${l.id}.presenter.md`,presenter.trimEnd()+'\n');
 await writeFile(`docs/teacher/${l.id}.alignment.json`,JSON.stringify({schemaVersion:1,courseId:course.id,contentVersion:course.contentVersion,sourceKind:'local',sourceSha256:hash,lectureIds:[l.id],documents:{teacher:`${l.id}.teacher.md`,presenter:`${l.id}.presenter.md`},slides},null,2)+'\n');
}
console.log(`Тексты и сценарии: ${course.lectures.length} лекций; SHA-256 ${hash}`);
