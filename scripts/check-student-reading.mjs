import {readFile,writeFile} from 'node:fs/promises';
import {reading} from '../authoring/student-reading.mjs';
import {foundations} from '../authoring/student-foundations.mjs';
import {context} from '../authoring/itil-context.mjs';
import {applyStudentCorrections} from '../authoring/student-corrections.mjs';
const course=JSON.parse(await readFile('public/course.json'));
const original=JSON.parse(await readFile('authoring/original-course.json'));
applyStudentCorrections(original,context);
const checks=course.lectures.flatMap((lecture,li)=>reading[li].map((entry,qi)=>{
 const prefix=`${lecture.id}-Q${String(qi+1).padStart(2,'0')}`;
 const find=suffix=>lecture.slides.find(slide=>slide.id===prefix+'-'+suffix);
 const theory=find('theory'),term=find('term'),flow=find('flow');
 return {lectureId:lecture.id,question:qi+1,title:original.topics[li].questions[qi].title,learningGoal:original.topics[li].questions[qi].check,
  explanationSlide:theory.id,clarificationSlide:term.id,workedExample:prefix+'-example',variationSlide:flow.id,
  variationRepresentation:flow.visual?'предметное сопоставление':'разбор изменённого условия',independentCase:prefix+'-case',
  assessmentSlides:lecture.slides.filter(slide=>slide.id.startsWith(prefix)&&slide.task).map(slide=>slide.id),
  explanationVisible:theory.body.includes(context[li].questions[qi][2]),boundaryVisible:term.body===entry.clarification,
  foundationsVisible:lecture.slides.find(slide=>slide.id===lecture.id+'-intro').bullets.includes(foundations[li][0])};
}));
if(checks.length!==120||checks.some(row=>!row.explanationVisible||!row.boundaryVisible||!row.foundationsVisible||row.assessmentSlides.length!==4))throw Error('Неполная карта самостоятельного чтения');
await writeFile('reports/student-reading-check.json',JSON.stringify({contentVersion:course.contentVersion,questions:checks.length,checks},null,2)+'\n');
const plan=course.lectures.flatMap(lecture=>lecture.slides.map(slide=>{
 const reasoning=slide.columns?.[0]==='Часть разбора',contrast=slide.id.endsWith('-warning')&&slide.rows?.length===1,stateTracks=slide.visual?.display==='stateTracks';
 const table=!!slide.rows&&!reasoning&&!contrast||['comparison','matrix'].includes(slide.visual?.type)&&!stateTracks;
 return {lectureId:lecture.id,slideId:slide.id,goal:slide.id.endsWith('-flow')&&!slide.visual?'Проверить вывод при изменённом условии':slide.title,
  representation:reasoning?'разбор условия':contrast?'ошибка и правило':stateTracks?'потоки состояний':table?'таблица':slide.visual?.type||'текст',catalogId:table?'TAB-01':null};
}));
await writeFile('reports/visual-plan.json',JSON.stringify(plan,null,2)+'\n');
console.log('Карта самостоятельного чтения: 120 вопросов, 480 заданий.');
