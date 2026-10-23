import {useEffect,useState} from 'react'
import type {Course} from './engine'
import './case-study.css'
import {CaseDiagram} from './CaseDiagram'

type Statement={id:string;text:string;category:string;feedback:string}
type Calculation={prompt:string;unit:string;value:number;hint:string}
type Activity={classificationTitle?:string;classificationHelp?:string;categoryLabels?:Record<string,string>;statements:Statement[];calculations:Calculation[];id:string;revision:number;lectureId:string;questionId:string;title:string;condition:string;observations:string[];task:string;options:{id:string;text:string}[];correct:string;explanation:string;rule:string;mistake:string}
type Draft={calculated:boolean;categories:Record<string,string>;numbers:Record<string,string>;choice:string;checked:boolean;revealed:boolean;step:number}
const empty:Draft={calculated:false,categories:{},numbers:{},choice:'',checked:false,revealed:false,step:0}
function read(key:string):Draft{try{return {...empty,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return empty}}

export function CaseStudy({course,base}:{course:Course;base:string}){
 const [activity,setActivity]=useState<Activity|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 const [draft,setDraft]=useState<Draft>(empty),[storageError,setStorageError]=useState(false),[feedback,setFeedback]=useState('')
 const [theme,setTheme]=useState(()=>{try{return JSON.parse(localStorage.getItem(`lecture:${base}:${course.id}:theme`)||'"light"')}catch{return 'light'}})
 const id=new URL(location.href).searchParams.get('case')||''
 useEffect(()=>{document.documentElement.dataset.theme=(theme==='dark'||theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'},[theme])
 useEffect(()=>{
  const controller=new AbortController();setError('')
  if(!/^[a-z0-9-]+-Q\d\d-case$/.test(id)){setError('Практическая задача не найден.');return}
  fetch(`${base}activities/${id}.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Не удалось загрузить условие.');return r.json()}).then((a:Activity)=>{
   if(controller.signal.aborted)return
   if(a.id!==id||!course.lectures.some(l=>l.id===a.lectureId)||!a.observations?.length)throw Error('Неверное условие.')
   setActivity(a);setDraft(read(`lecture:${base}:${course.id}:case:${a.id}:revision-${a.revision}`))
  }).catch(e=>{if(!controller.signal.aborted)setError(String(e))})
  return()=>controller.abort()
 },[id,base,course,retry])
 function update(change:Partial<Draft>){
  const next={...draft,...change};setDraft(next);setFeedback('')
  if(activity)try{localStorage.setItem(`lecture:${base}:${course.id}:case:${activity.id}:revision-${activity.revision}`,JSON.stringify(next));setStorageError(false)}catch{setStorageError(true)}
 }
 if(error)return <main className="case-study"><h1>Практическая задача</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>setRetry(n=>n+1)}>Повторить загрузку</button><a href={base}>Каталог</a></main>
 if(!activity)return <main className="case-study" role="status">Загружаем условие…</main>
 const lecture=course.lectures.find(l=>l.id===activity.lectureId)!
 const href=`${base}?lecture=${lecture.id}&slide=${activity.questionId}-passport`
 const max=activity.observations.length,step=Math.max(0,Math.min(max,draft.step))
 const numericCorrect=activity.calculations.every((c,i)=>draft.numbers[i]?.trim()&&Number(draft.numbers[i].replace(',','.'))===c.value)
 const canDecide=!activity.calculations.length||draft.calculated&&numericCorrect
 const check=()=>{
  if(!draft.choice||activity.statements.some(s=>!draft.categories[s.id])||activity.calculations.some((_,i)=>!draft.numbers[i]?.trim())){setFeedback('Выполните классификацию, заполните расчёты и выберите решение.');return}
  const correct=draft.choice===activity.correct&&activity.statements.every(s=>draft.categories[s.id]===s.category)&&activity.calculations.every((c,i)=>Number(draft.numbers[i].replace(',','.'))===c.value)
  update({checked:true,revealed:false});setFeedback(correct?'Задача решена верно: классификация, расчёты и вывод согласованы.': 'Есть ошибки. Проверьте отмеченные пункты и попробуйте ещё раз.')
 }
 return <main className="case-study">
  <header><a className="button secondary" href={href}>Вернуться к лекции</a><button className="button secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'Светлая тема':'Тёмная тема'}</button></header>
  <p className="eyebrow">{course.code} · {lecture.semester} семестр · Практическая задача</p><h1>{activity.title}</h1>
  <section className="case-condition"><h2>Условие</h2><p>{activity.condition}</p></section>
  {storageError&&<p role="alert">Черновик не сохраняется в этом браузере. Скопируйте свои записи перед закрытием.</p>}
  <section className="case-evidence" aria-label="Разбор наблюдений">
   <div className="case-step" aria-live="polite">{step===0?'Обзор: обсудите условие и выберите действия команды.':`Наблюдение ${step} из ${max}`}</div>
   <CaseDiagram id={activity.id} focus={step} reveal={draft.checked&&draft.revealed}/><ol>{activity.observations.map((s,i)=><li key={i} aria-current={step===i+1?'step':undefined} className={step===i+1?'case-focus':''}>{s}</li>)}</ol>
   <div className="case-navigation"><button className="button secondary" disabled={!step} onClick={()=>update({step:step-1})}>Назад</button><span>Шаг {step} / {max}</span><button className="button primary" disabled={step===max} onClick={()=>update({step:step+1})}>Далее</button><button className="button secondary" onClick={()=>update({step:0})}>К обзору</button></div>
  </section>
  <form onSubmit={e=>{e.preventDefault();check()}}>
   {canDecide&&<fieldset className="case-classification"><legend>1. {activity.classificationTitle||'Отделите исходные данные от выводов'}</legend><p>{activity.classificationHelp||'Для каждой записи выберите: что дано в условии, что обосновано данными, а что добавляет неподтверждённое предположение.'}</p>{activity.statements.map((s,i)=><div className="case-classification-item" key={s.id}><label htmlFor={'statement-'+s.id}>{s.text}</label><select id={'statement-'+s.id} aria-label={'Категория записи '+(i+1)} value={draft.categories[s.id]||''} onChange={e=>update({categories:{...draft.categories,[s.id]:e.target.value},checked:false,revealed:false})}><option value="">Выберите категорию</option><option value="fact">{activity.categoryLabels?.fact||'Факт из условия'}</option><option value="decision">{activity.categoryLabels?.decision||'Обоснованный вывод / действие'}</option><option value="assumption">{activity.categoryLabels?.assumption||'Неподтверждённое предположение'}</option></select>{draft.checked&&<p className="case-item-feedback" role="status">{draft.categories[s.id]===s.category?'Верно.':'Неверно. '+s.feedback}</p>}</div>)}</fieldset>}
   {!!activity.calculations.length&&<fieldset><legend>2. Выполните расчёт</legend>{activity.calculations.map((c,i)=><div className="case-classification-item" key={c.prompt}><label className="case-number">{c.prompt} ({c.unit})<input aria-label={c.prompt+' ('+c.unit+')'} inputMode="decimal" value={draft.numbers[i]||''} onChange={e=>update({numbers:{...draft.numbers,[i]:e.target.value},calculated:false,checked:false,revealed:false})}/></label>{(draft.checked||draft.calculated)&&<p role="status">{Number(draft.numbers[i]?.replace(',','.'))===c.value?'Верно. Единицы учтены.':'Неверно. '+c.hint}</p>}</div>)}<button type="button" className="button secondary" onClick={()=>update({calculated:true})}>Проверить расчёт</button></fieldset>}
   {canDecide&&<fieldset><legend>{activity.calculations.length?'3':'2'}. {activity.task}</legend>{activity.options.map(o=><label className="case-option" key={o.id}><input type="radio" name="case-decision" value={o.id} checked={draft.choice===o.id} onChange={()=>update({choice:o.id,checked:false,revealed:false})}/><span>{o.text}</span></label>)}</fieldset>}
   <button className="button primary" type="submit" disabled={!canDecide}>Проверить решение</button>
   {draft.checked&&<p role="status">{draft.choice===activity.correct?'Вывод выбран верно.':activity.mistake}</p>}
   <p role="status">{feedback|| (draft.checked?'Попытка сохранена. Исправьте ошибки или откройте разбор.':'')}</p>
  </form>
  {draft.checked&&<button className="button secondary" onClick={()=>update({revealed:!draft.revealed})}>{draft.revealed?'Скрыть разбор':'Открыть разбор'}</button>}
  {draft.checked&&draft.revealed&&<aside className="case-solution"><h2>Основание решения</h2><p>{activity.explanation}</p>{activity.calculations.map(c=><p key={c.prompt}>{c.prompt}: {c.value} {c.unit}.</p>)}<p>{activity.rule}</p><p>Обсудите командой: какое наблюдение его подтверждает и что остаётся непроверенным?</p></aside>}
 </main>
}
