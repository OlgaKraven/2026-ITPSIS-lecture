import {readFile,writeFile} from 'node:fs/promises';
import {authored} from './compile-scenarios.mjs';
import {fileURLToPath} from 'node:url';
export function alignScenarioNotes(pack){
pack.notesRevision='2026-10-23-domain-scenarios-2';
for(const {scenario,test}of authored){
 const note=pack.notes[scenario.questionId+'-passport'];
 note.script=`Откройте кейс и прочитайте исходную ситуацию и правила опыта. Цель: ${scenario.goal} Попросите команду предсказать наблюдаемый эффект выбранной операции. Выполните её и сопоставьте изменения параметров системы. Пройдите ошибочный маршрут до последствий, затем устраните их доступными операциями в том же прохождении. Контрольный прогон проверяет фактическое состояние, а открытие разбора ничего не исправляет.`;
 note.preparation='Состояние, текущая ситуация и доступные операции меняются после действий. Сохраняйте ошибочное прохождение для обсуждения; перезагрузка продолжает его. «Начать заново» начинает отдельный опыт и не считается исправлением прежних последствий. Время в модели проходит только при выполнении операций. Учебные пороги и дополнительные условия указаны в правилах каждого кейса.';
 note.questions='Какие параметры изменились? Как это изменило выполнение следующей операции? Что исправляет само последствие, а что лишь меняет запись о нём? Какие данные или потраченное время нельзя восстановить в этом опыте?';
 const names=ids=>ids.map(id=>scenario.actions.find(a=>a.id===(typeof id==='string'?id:id.id)).label).join(' → ');
 note.answer=scenario.debrief+' Рабочий маршрут: '+names(test.happy.actions)+'. '+test.faults.map((f,i)=>`Ошибочный маршрут ${i+1}: ${names(f.path)}. Устранение последствий: ${names(f.recover)}.`).join(' ');
}
return pack;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const pack=alignScenarioNotes(JSON.parse(await readFile('authoring/teacher-notes.json','utf8')));
 await writeFile('authoring/teacher-notes.json',JSON.stringify(pack,null,2)+'\n');
 console.log(`Aligned teacher notes for ${authored.length} stateful scenarios.`);
}

