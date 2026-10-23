import {readFile,writeFile} from 'node:fs/promises';
import {alignScenarioNotes} from './align-scenario-notes.mjs';
import {corrections} from '../authoring/student-corrections.mjs';
const course=JSON.parse(await readFile('public/course.json','utf8'));
const pack=JSON.parse(await readFile('authoring/teacher-notes.json','utf8'));
pack.contentVersion=course.contentVersion;pack.notesRevision='2026-10-23-interactive-cases-8';
for(const id of Object.keys(pack.notes))if(id.endsWith('-literature-2'))delete pack.notes[id];
for(const c of corrections){
 const prefix=`${course.lectures[c.lecture].id}-Q${String(c.question+1).padStart(2,'0')}-`;
 for(const [id,note] of Object.entries(pack.notes))if(id.startsWith(prefix)){
  for(const key of ['script','preparation','notebook','questions','answer'])note[key]=note[key].replaceAll(c.from,c.to);
 }
}
for(const lecture of course.lectures)for(const slide of lecture.slides){
 const n=pack.notes[slide.id];
 for(const key of ['script','preparation','notebook','questions','answer'])n[key]=n[key].replaceAll('Самостоятельный случай','Практическая задача').replaceAll('самостоятельный случай','практическую задачу').replaceAll('Интерактивная схема','Разбор задачи');
 if(slide.id.endsWith('-literature-1'))n.script='Основная литература по дисциплине. '+slide.references.map(r=>r.citation).join(' ')+' Ссылки и QR-коды открывают соответствующие источники.';
 if(slide.id.endsWith('-passport'))continue;
 if(slide.id.endsWith('-term')){
  n.script=`${slide.notebook} ${slide.body} Сопоставьте объяснение с коротким определением в блоке «Запишите». Определение фиксирует признаки понятия; пояснение показывает, какой вывод допустим и где требуется дополнительная проверка.`;
  n.questions='Какое различие объясняет этот слайд? Приведите условие, при котором короткого определения недостаточно для выбора действия.';
  n.answer=slide.body;
 }
 if(slide.id.endsWith('-flow')){
  const v=slide.visual||slide;const rows=v.rows||[];
  const text=rows.map(row=>row.map((value,index)=>`${v.columns[index]}: ${value}`).join('; ')).join('. ').replace(/\.{2,}/g,'.');
  n.script=`${text.replace(/[. ]+$/,'')}. ${v.caption||'Изменено условие примера: объясните переход от наблюдения к выводу и назовите его границу.'} Не переносите числа этого разбора в самостоятельный случай: у него собственное условие.`;
  n.preparation='Кнопка «Развернуть схему» открывает локальное управление: «Назад», «Далее», «Показать», «Пауза» и «Повторить». При уменьшенном движении используйте ручные шаги. В режиме показа управляйте схемой из окна преподавателя; шаги передаются аудитории.';
  n.questions='Какое наблюдение необходимо для вывода? Что останется непроверенным после показанного результата?';
  n.answer=(text.replace(/[. ]+$/,'')+'. '+(v.caption||'')).trim();
 }
 if(slide.id.endsWith('-intro'))n.script=`${slide.body} ${slide.bullets.join(' ')} Сначала свяжите обозначения с пользовательской операцией; затем рассмотрите исходную ситуацию.`;
 if(slide.id.endsWith('-readiness'))n.script=`${slide.body} ${slide.bullets.join(' ')} Отделяйте заданные факты от предположений. По ходу разбора проверяйте, какое новое свидетельство потребуется для следующего вывода.`;
 if(slide.id.endsWith('-summary-a')||slide.id.endsWith('-summary-b'))n.script='Свяжем каждое решение с критерием результата. '+slide.rows.map(row=>`${row[0]} Критерий: ${row[1]}`).join(' ')+' При приёмке нужны свидетельства этого результата, а не только отметка о выполнении действия.';
}
alignScenarioNotes(pack);
await writeFile('authoring/teacher-notes.json',JSON.stringify(pack,null,2)+'\n');
console.log('Сценарии согласованы с видимыми объяснениями и новыми вариантами условий.');
