export type PracticeOption={id:string;text:string}
export type PracticeStep={id:string;title:string;prompt:string;explanation:string;type:'single'|'multiple'|'order'|'matching'|'numeric'|'code';choices?:PracticeOption[];items?:PracticeOption[];solution?:string[];unit?:string;value?:number;tolerance?:number;accepted?:string[]}
export type TeamActivity={id:string;revision:number;lectureId:string;questionId:string;title:string;condition:string;explanation:string;rule:string;steps:PracticeStep[]}
export type StepAnswer=string|string[]|Record<string,string>
export type StepDraft={answer:StepAnswer;checked:boolean;attempts:number}
export type TeamDraft={cursor:number;steps:Record<string,StepDraft>;revealed:boolean}
export type StepGrade={status:'empty'|'incorrect'|'correct';message:string;items?:{id:string;correct:boolean}[]}
const normalize=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru')
export function initialAnswer(step:PracticeStep):StepAnswer{return step.type==='order'?step.items!.map(x=>x.id):step.type==='matching'?{}:step.type==='multiple'?[]:''}
export function gradeStep(step:PracticeStep,answer:StepAnswer):StepGrade{
 const empty=(message='Выполните действие команды перед проверкой.'):StepGrade=>({status:'empty',message})
 const done=(correct:boolean,message:string,items?:StepGrade['items']):StepGrade=>({status:correct?'correct':'incorrect',message:correct?'Шаг выполнен верно. '+step.explanation:message,items})
 if(step.type==='numeric'){
  if(typeof answer!=='string'||!answer.trim())return empty('Введите результат в указанных единицах.')
  const text=answer.trim().replace(',','.');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return done(false,'Нужен числовой ответ без текста; единицы указаны у поля.')
  const value=Number(text);return done(Number.isFinite(value)&&Math.abs(value-step.value!)<=(step.tolerance||0),'Число не совпадает с результатом условия. Проверьте выбранные величины, границы и единицы.')
 }
 if(step.type==='code'){
  if(typeof answer!=='string'||!answer.trim())return empty('Введите требуемый код или отметку.')
  return done(step.accepted!.some(x=>normalize(x)===normalize(answer)),'Ответ не соответствует заданной записи. Проверьте исходные признаки и формат.')
 }
 if(step.type==='matching'){
  if(!answer||typeof answer!=='object'||Array.isArray(answer))return empty()
  const items=step.items!.map((item,i)=>({id:item.id,correct:answer[item.id]===step.solution![i]}));
  if(step.items!.some(item=>!answer[item.id]))return empty('Назначьте соответствие для каждой строки.')
  return done(items.every(x=>x.correct),'Есть неверные соответствия. Проверьте отмеченные строки и назначение каждой связи.',items)
 }
 if(step.type==='single'){
  if(typeof answer!=='string'||!answer)return empty('Выберите действие команды.')
  return done(answer===step.solution![0],'Выбранный вариант не выполняет условие этого шага. Сопоставьте действие с исходными данными и требуемым результатом.')
 }
 if(!Array.isArray(answer)||!answer.length)return empty()
 if(step.type==='order'){
  if(answer.length!==step.items!.length||new Set(answer).size!==answer.length||answer.some(id=>!step.items!.some(x=>x.id===id)))return done(false,'В последовательности должны присутствовать все действия по одному разу.')
  return done(answer.every((x,i)=>x===step.solution![i]),'Порядок нарушает зависимости действий. Проверьте, что должно быть подготовлено до следующей операции.')
 }
 const valid=new Set(step.choices!.map(x=>x.id));if(answer.some(x=>!valid.has(x)))return done(false,'Обнаружен неизвестный вариант ответа.')
 const correct=answer.length===step.solution!.length&&new Set(answer).size===answer.length&&answer.every(x=>step.solution!.includes(x));
 return done(correct,'Набор неполон или содержит лишнее. Проверьте необходимость каждого выбранного свидетельства.')
}
export function passedPrefix(activity:TeamActivity,draft:TeamDraft){let count=0;for(const step of activity.steps){const state=draft.steps[step.id];if(!state?.checked||gradeStep(step,state.answer).status!=='correct')break;count++}return count}
export function restoreDraft(activity:TeamActivity,value:unknown):TeamDraft{
 const raw=value&&typeof value==='object'?value as Partial<TeamDraft>:{};const draft:TeamDraft={cursor:0,steps:{},revealed:false};
 for(const step of activity.steps){const item=raw.steps?.[step.id];if(item&&typeof item==='object')draft.steps[step.id]={answer:item.answer,checked:item.checked===true,attempts:Math.max(0,Number(item.attempts)||0)}}
 const prefix=passedPrefix(activity,draft);draft.cursor=Math.max(0,Math.min(activity.steps.length,Number.isInteger(raw.cursor)?raw.cursor!:0,prefix+1));draft.revealed=prefix===activity.steps.length&&raw.revealed===true;return draft;
}
export function editAnswer(activity:TeamActivity,draft:TeamDraft,index:number,answer:StepAnswer):TeamDraft{
 const steps={...draft.steps};for(const [i,step]of activity.steps.entries())if(i>=index&&steps[step.id])steps[step.id]={...steps[step.id],checked:false};
 const step=activity.steps[index];steps[step.id]={answer,checked:false,attempts:steps[step.id]?.attempts||0};return {...draft,steps,revealed:false};
}
