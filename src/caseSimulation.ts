import type {StepAnswer,TeamActivity} from './teamPractice'
import {describeAnswer,gradeStep} from './teamPractice'
import {failureConsequence} from './caseConsequences'

// These are records and executions, not submitted quiz answers. A consumer keeps
// the exact upstream revision it used, including an unusable revision.
export type Execution={payload:StepAnswer;revision:number;inputs:number[];usable:boolean;observation:string;operations?:string[]}
export type CaseEvent={sequence:number;stage:number;operation:string;observation:string}
export type Simulation={schema:1;cursor:number;revision:number;records:Record<string,Execution>;events:CaseEvent[];probe:boolean;revealed:boolean}
export type CaseProfile={artifact:string;consumer:string;failure:string;propagation:string;goal:string}
const profiles:Record<string,CaseProfile>={
 'support-lifecycle':{artifact:'Журнал сопровождения',consumer:'Приёмка работы',failure:'Работа закрыта без подтверждённого результата или с неверной границей ответственности.',propagation:'Следующая работа использует неполную запись; основание приёмки потеряно.',goal:'Довести запись о сопровождении до проверяемого результата, сохранив границы работ.'},
 'support-levels':{artifact:'Очередь и пакет передачи',consumer:'Принимающая линия поддержки',failure:'Принимающая линия не может продолжить работу по полученному назначению и данным.',propagation:'Обращение остаётся без подтверждённого принятия; следующая передача этого не исправляет.',goal:'Обеспечить обоснованное назначение и непрерывность обработки обращения.'},
 'sla':{artifact:'Расчёт и основания SLA',consumer:'Контроль договорного показателя',failure:'Показатель рассчитан по неверной границе, величине или области; решение по SLA недостоверно.',propagation:'Следующее решение получает недостоверный показатель; правильная формулировка вывода не исправляет расчёт.',goal:'Получить воспроизводимый показатель и решение, соответствующие данным соглашения.'},
 'ticket-flow':{artifact:'Рабочая карточка обращения',consumer:'Следующий исполнитель',failure:'Карточка не обеспечивает исполнение или подтверждает результат без достаточных свидетельств.',propagation:'Следующий исполнитель получил ошибочное состояние карточки; обращение нельзя достоверно закрыть.',goal:'Сохранить контекст, ответственность и подтверждённое состояние обращения.'},
 'reproduction':{artifact:'Протокол воспроизведения',consumer:'Повтор на другом рабочем месте',failure:'Повтор не подтверждает заявленный вывод: условия, действия или свидетельства недостаточны.',propagation:'Следующий опыт использует неподтверждённые условия; его результат нельзя приписать проверяемой гипотезе.',goal:'Подготовить повторяемый опыт и ограничить вывод фактическими наблюдениями.'},
 'escalation':{artifact:'Пакет эскалации',consumer:'Получатель поручения',failure:'Получатель не может исполнить поручение или передача потеряла владельца и контроль.',propagation:'Следующая передача наследует пробел пакета; само сообщение не подтверждает принятие.',goal:'Получить исполнимое поручение, подтверждение принятия и сохранённый контроль.'},
 'knowledge-base':{artifact:'Карточка знания и её проверка',consumer:'Независимый пользователь статьи',failure:'Применение статьи не подтверждает результат в заявленных условиях.',propagation:'Следующий шаг использует непроверенное знание; публикация не делает его применимым.',goal:'Обеспечить проверяемое применение знания с явно указанными ограничениями.'},
 'update-regulation':{artifact:'План и журнал обновления',consumer:'Контрольный прогон релиза',failure:'Прогон не подтверждает готовность: нарушены условия установки, проверки или возврата.',propagation:'Следующая операция опирается на неподготовленную среду или непроверенный результат; закрытие окна не устраняет отказ.',goal:'Выполнить обоснованный маршрут обновления либо остановить его по условиям кейса.'},
 'change-management':{artifact:'Запись изменения',consumer:'Решение о внедрении',failure:'Решение не обеспечено оценкой влияния, полномочиями или проверкой результата.',propagation:'Следующее действие использует неподтверждённое основание изменения; расширение внедрения наследует риск.',goal:'Обосновать решение об изменении и проверить границы его применения.'},
 'backup-restore':{artifact:'План восстановления и его расчёты',consumer:'Проверка восстановленной услуги',failure:'План не подтверждает требуемые данные, срок или работоспособность восстановленной услуги.',propagation:'Следующий этап использует неподтверждённую точку или расчёт; сообщение об успехе не восстанавливает данные.',goal:'Проверить пригодность восстановления и явно обработать невыполненные цели.'},
 'failure-response':{artifact:'Оперативный журнал отказа',consumer:'Контроль восстановления',failure:'Работа услуги не подтверждена; выбранный маршрут потерял основание, контроль или проверку.',propagation:'Следующая операция опирается на неподтверждённое состояние отказа; закрытие записи оставляет риск.',goal:'Организовать проверяемое реагирование и подтвердить пользовательский результат.'},
 'error-collection':{artifact:'Пакет диагностических сведений',consumer:'Диагностический разбор',failure:'Собранные сведения не позволяют проверить вывод либо содержат недопустимые данные.',propagation:'Следующий анализ использует непригодный пакет; дополнительные выводы не возвращают утраченные свидетельства.',goal:'Сохранить достаточные, сопоставимые и пригодные для диагностики свидетельства.'},
 'layer-localization':{artifact:'Протокол локализации',consumer:'Проверка диагностической гипотезы',failure:'Опыт не изолирует заявленный слой или вывод выходит за пределы наблюдения.',propagation:'Следующая проверка наследует неподтверждённую гипотезу; смена слоя сама по себе её не доказывает.',goal:'Различить слои на основании контролируемых наблюдений и ограничить вывод.'},
 'postmortem':{artifact:'Разбор отказа и меры',consumer:'Проверка объяснения и меры',failure:'Разбор не подтверждает причину, показатель или результат предложенной меры.',propagation:'Следующее решение использует недостоверный разбор; назначение меры не устраняет пробел свидетельств.',goal:'Связать свидетельства, объяснение отказа и проверяемую меру улучшения.'},
 'hardware-maintenance':{artifact:'Наряд и протокол обслуживания',consumer:'Приёмка оборудования и услуги',failure:'Приёмка не подтверждает безопасность, исправность или пользовательский результат обслуживания.',propagation:'Следующая операция использует неподтверждённое состояние оборудования; закрытый наряд не подтверждает исправность.',goal:'Подготовить и проверить обслуживание с соблюдением условий работы оборудования.'},
}
export function caseProfile(activity:TeamActivity){const key=activity.lectureId.replace(/^s\d+-\d+-/,'');const profile=profiles[key];if(!profile)throw Error('Нет модели кейса: '+activity.id);return profile}
export function newSimulation():Simulation{return {schema:1,cursor:0,revision:0,records:{},events:[],probe:false,revealed:false}}
const cloneAnswer=(answer:StepAnswer):StepAnswer=>typeof answer==='string'?answer:Array.isArray(answer)?[...answer]:{...answer}
export function inputRevisions(a:TeamActivity,s:Simulation,index:number){return a.steps.slice(0,index).map(step=>s.records[step.id]?.revision||0)}
export function recordReady(a:TeamActivity,s:Simulation,index:number):boolean{
 const record=s.records[a.steps[index].id]
 return !!record?.usable&&(!record.operations||record.operations.length===a.steps[index].items!.length)&&record.inputs.every((revision,i)=>revision>0&&revision===s.records[a.steps[i].id]?.revision&&recordReady(a,s,i))
}
export function runOperation(a:TeamActivity,s:Simulation,index:number,payload:StepAnswer,orderAction?:string):Simulation{
 const step=a.steps[index],previous=s.records[step.id],profile=caseProfile(a)
 let value=cloneAnswer(payload),operations:string[]|undefined,usable:boolean,observation:string
 if(step.type==='order'){
  operations=[...(previous?.operations||[])]
  if(!orderAction||!step.items!.some(x=>x.id===orderAction)||operations.includes(orderAction))return s
  const dependencies=step.before||step.solution!.slice(1).map((id,i)=>[step.solution![i],id])
  const missing=dependencies.filter(([from,to])=>to===orderAction&&!operations!.includes(from)).map(([from])=>step.items!.find(x=>x.id===from)!.text)
  operations.push(orderAction);value=operations
  usable=(previous?.usable??true)&&!missing.length
  observation=missing.length?`Операция выполнена до подготовки: ${missing.join('; ')}. Результат операции непригоден; последующее выполнение подготовки не отменит её последствий.`:`Операция выполнена: ${step.items!.find(x=>x.id===orderAction)!.text}.`
  if(operations.length===step.items!.length&&usable)usable=gradeStep(step,operations).status==='correct'
 }else{
  const grade=gradeStep(step,value)
  if(grade.status==='empty'&&step.type!=='matching'&&step.type!=='multiple')return s
  usable=grade.status==='correct'
  observation=`Записано в «${step.title}»: ${describeAnswer(step,value)||'пакет без вложений'}.`
 }
 if(!usable)observation+=` Последствие в учебной модели: ${failureConsequence(a)}`
 const inputBroken=a.steps.slice(0,index).some((_,i)=>!recordReady(a,s,i))
 if(inputBroken)observation+=` ${profile.consumer}: ${profile.propagation}`
 const revision=s.revision+1,record:Execution={payload:value,revision,inputs:inputRevisions(a,s,index),usable,observation,operations}
 const operation=orderAction?step.items!.find(x=>x.id===orderAction)!.text:step.title
 return {...s,revision,records:{...s.records,[step.id]:record},probe:false,events:[...s.events,{sequence:revision,stage:index,operation,observation}]}
}
export function clearStage(a:TeamActivity,s:Simulation,index:number):Simulation{
 const records={...s.records};delete records[a.steps[index].id]
 const revision=s.revision+1
 return {...s,revision,records,probe:false,events:[...s.events,{sequence:revision,stage:index,operation:'Восстановить участок до выполнения',observation:'Участок возвращён к исходным данным. Ранее выполненные зависимые операции сохраняются как устаревшие; их нужно повторить.'}]}
}
export function probeSimulation(a:TeamActivity,s:Simulation){
 return a.steps.map((step,index)=>{
  const record=s.records[step.id]
  if(!record)return {id:step.id,status:'missing' as const,message:`${step.title}: рабочий результат отсутствует.`}
  if(record.operations&&record.operations.length!==step.items!.length)return {id:step.id,status:'failed' as const,message:`${step.title}: часть операций не выполнена.`}
  if(!record.usable)return {id:step.id,status:'failed' as const,message:`${step.title}: ${failureConsequence(a)} Проверьте участок: ${step.hint}`}
  if(!recordReady(a,s,index))return {id:step.id,status:'stale' as const,message:`${step.title}: использована отсутствующая, непригодная или уже изменённая запись предыдущего участка. Повторите операцию после исправления её входа.`}
  return {id:step.id,status:'ready' as const,message:`${step.title}: результат применим; входные записи соответствуют текущему состоянию.`}
 })
}
export function runProbe(a:TeamActivity,s:Simulation):Simulation{
 const diagnostics=probeSimulation(a,s),sequence=s.revision+1
 return {...s,revision:sequence,probe:true,events:[...s.events,{sequence,stage:a.steps.length-1,operation:'Контрольный прогон',observation:diagnostics.map(d=>d.message).join(' ')}]}
}
export function restoreSimulation(a:TeamActivity,raw:unknown):Simulation{
 if(!raw||typeof raw!=='object'||(raw as Simulation).schema!==1)return newSimulation()
 const saved=raw as Simulation,s=newSimulation()
 // Replay the persisted operations. Stored success flags are never trusted.
 if(!Array.isArray(saved.events)||!saved.records||typeof saved.records!=='object')return s
 const records=Object.entries(saved.records).filter(([id,r])=>a.steps.some(step=>step.id===id)&&r&&Number.isSafeInteger(r.revision)&&r.revision>0).sort(([,a],[,b])=>a.revision-b.revision)
 for(const [id,r]of records){const index=a.steps.findIndex(step=>step.id===id),step=a.steps[index];try{
  const grade=gradeStep(step,r.payload)
  if(grade.status==='empty'&&step.type!=='matching'&&step.type!=='multiple')continue
  const usable=step.type==='order'?JSON.stringify(r.payload)===JSON.stringify(r.operations)&&Array.isArray(r.operations)&&r.operations.length>0&&r.operations.every((id,i)=>{
   const deps=step.before||step.solution!.slice(1).map((id,j)=>[step.solution![j],id])
   return step.items!.some(item=>item.id===id)&&r.operations!.indexOf(id)===i&&deps.filter(([,to])=>to===id).every(([from])=>r.operations!.slice(0,i).includes(from))
  }):grade.status==='correct'
  s.records[id]={payload:cloneAnswer(r.payload),revision:r.revision,inputs:a.steps.slice(0,index).map((_,i)=>Number.isSafeInteger(r.inputs?.[i])?r.inputs[i]:0),usable:!!usable,observation:typeof r.observation==='string'?r.observation:'',operations:step.type==='order'&&Array.isArray(r.operations)?[...r.operations]:undefined}
 }catch{/* malformed local record is retained by the browser, but not executed */}}
 s.revision=Math.max(0,...Object.values(s.records).map(r=>r.revision),...saved.events.map(e=>Number.isSafeInteger(e?.sequence)?e.sequence:0))
 s.cursor=Number.isInteger(saved.cursor)?Math.max(0,Math.min(a.steps.length,saved.cursor)):0
 s.events=saved.events.filter(e=>e&&Number.isInteger(e.stage)&&e.stage>=0&&e.stage<a.steps.length&&typeof e.operation==='string'&&typeof e.observation==='string')
 s.probe=saved.probe===true;s.revealed=saved.revealed===true&&s.events.length>0
 return s
}
