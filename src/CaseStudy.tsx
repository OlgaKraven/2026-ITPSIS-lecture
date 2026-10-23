import {useEffect,useState} from 'react'
import type {Course} from './engine'
import './case-study.css'
import {CaseDiagram} from './CaseDiagram'

type Activity={id:string;revision:number;lectureId:string;questionId:string;title:string;condition:string;observations:string[];task:string;options:{id:string;text:string}[];correct:string;explanation:string;rule:string;mistake:string}
type Draft={prediction:string;choice:string;reason:string;checked:boolean;revealed:boolean;step:number}
const empty:Draft={prediction:'',choice:'',reason:'',checked:false,revealed:false,step:0}
function read(key:string):Draft{try{return {...empty,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return empty}}

export function CaseStudy({course,base}:{course:Course;base:string}){
 const [activity,setActivity]=useState<Activity|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 const [draft,setDraft]=useState<Draft>(empty),[storageError,setStorageError]=useState(false),[feedback,setFeedback]=useState('')
 const [theme,setTheme]=useState(()=>{try{return JSON.parse(localStorage.getItem(`lecture:${base}:${course.id}:theme`)||'"light"')}catch{return 'light'}})
 const id=new URL(location.href).searchParams.get('case')||''
 useEffect(()=>{document.documentElement.dataset.theme=(theme==='dark'||theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'},[theme])
 useEffect(()=>{
  const controller=new AbortController();setError('')
  if(!/^[a-z0-9-]+-Q\d\d-case$/.test(id)){setError('Учебный случай не найден.');return}
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
 if(error)return <main className="case-study"><h1>Самостоятельный случай</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>setRetry(n=>n+1)}>Повторить загрузку</button><a href={base}>Каталог</a></main>
 if(!activity)return <main className="case-study" role="status">Загружаем условие…</main>
 const lecture=course.lectures.find(l=>l.id===activity.lectureId)!
 const href=`${base}?lecture=${lecture.id}&slide=${activity.questionId}-passport`
 const max=activity.observations.length,step=Math.max(0,Math.min(max,draft.step))
 const check=()=>{
  if(!draft.prediction.trim()||!draft.choice||!draft.reason.trim()){setFeedback('Запишите прогноз, выберите вывод и обоснуйте его наблюдением.');return}
  update({checked:true});setFeedback(draft.choice===activity.correct?'Вывод выбран верно. Сверьте своё обоснование с разбором. Свободный текст автоматически не оценивается.':activity.mistake)
 }
 return <main className="case-study">
  <header><a className="button secondary" href={href}>Вернуться к лекции</a><button className="button secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'Светлая тема':'Тёмная тема'}</button></header>
  <p className="eyebrow">{course.code} · {lecture.semester} семестр · Учебный случай</p><h1>{activity.title}</h1>
  <section className="case-condition"><h2>Условие</h2><p>{activity.condition}</p></section>
  {storageError&&<p role="alert">Черновик не сохраняется в этом браузере. Скопируйте свои записи перед закрытием.</p>}
  <label className="case-field">Мой прогноз<textarea aria-label="Мой прогноз" value={draft.prediction} onChange={e=>update({prediction:e.target.value})}/></label>
  <section className="case-evidence" aria-label="Разбор наблюдений">
   <div className="case-step" aria-live="polite">{step===0?'Обзор: прочитайте условие и запишите прогноз.':`Наблюдение ${step} из ${max}`}</div>
   <CaseDiagram id={activity.id} focus={step} reveal={draft.checked&&draft.revealed}/><ol>{activity.observations.map((s,i)=><li key={i} aria-current={step===i+1?'step':undefined} className={step===i+1?'case-focus':''}>{s}</li>)}</ol>
   <div className="case-navigation"><button className="button secondary" disabled={!step} onClick={()=>update({step:step-1})}>Назад</button><span>Шаг {step} / {max}</span><button className="button primary" disabled={step===max} onClick={()=>update({step:step+1})}>Далее</button><button className="button secondary" onClick={()=>update({step:0})}>К обзору</button></div>
  </section>
  <form onSubmit={e=>{e.preventDefault();check()}}>
   <fieldset><legend>{activity.task}</legend>{activity.options.map(o=><label className="case-option" key={o.id}><input type="radio" name="case-decision" value={o.id} checked={draft.choice===o.id} onChange={()=>update({choice:o.id,checked:false,revealed:false})}/><span>{o.text}</span></label>)}</fieldset>
   <label className="case-field">Моё обоснование<textarea aria-label="Моё обоснование" value={draft.reason} onChange={e=>update({reason:e.target.value,checked:false,revealed:false})}/></label>
   <button className="button primary" type="submit">Проверить вывод</button>
   <p role="status">{feedback|| (draft.checked?'Попытка сохранена. Сверьте обоснование с разбором.':'')}</p>
  </form>
  {draft.checked&&<button className="button secondary" onClick={()=>update({revealed:!draft.revealed})}>{draft.revealed?'Скрыть разбор':'Открыть разбор'}</button>}
  {draft.checked&&draft.revealed&&<aside className="case-solution"><h2>Основание решения</h2><p>{activity.explanation}</p><p>{activity.rule}</p><p>Уточните свой вывод: какое наблюдение его подтверждает и что остаётся непроверенным?</p></aside>}
 </main>
}
