import {useEffect,useState} from 'react'
import type {Course} from './engine'
import {actionEnabled,availableActions,checks,completed,currentScene,newSimulation,persistSimulation,renderText,restoreSimulation,runAction} from './caseSimulation'
import type {Scenario,ScenarioAction,Simulation,Value} from './caseSimulation'
import './case-study.css'

const valueText=(value:Value)=>typeof value==='boolean'?(value?'да':'нет'):typeof value==='number'?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(value):value
function Operation({action,simulation,execute}:{action:ScenarioAction;simulation:Simulation;execute:(id:string,value?:number)=>void}){
 const [value,setValue]=useState(''),enabled=actionEnabled(action,simulation.world)
 return <div className="scenario-operation" data-operation={action.id}>
  {action.input?<form onSubmit={e=>{e.preventDefault();execute(action.id,Number(value.replace(',','.')))}}><label>{action.input.label}<input type="number" step="any" min={action.input.min} max={action.input.max} required value={value} onChange={e=>setValue(e.target.value)}/> {action.input.unit}</label><button className="button secondary" type="submit" disabled={!enabled||!value}>{action.label}</button></form>:<button className="button secondary" data-action-id={action.id} disabled={!enabled} onClick={()=>execute(action.id)}>{action.label}</button>}
  {!enabled&&<p className="operation-reason">{action.blocked||'Для операции пока нет необходимого состояния.'}</p>}
 </div>
}
function storageKey(base:string,course:Course,scenario:Scenario){return `lecture:${base}:${course.id}:simulation:${scenario.id}:model-2`}
export function CaseStudy({course,base}:{course:Course;base:string}){
 const [scenario,setScenario]=useState<Scenario|null>(null),[simulation,setSimulation]=useState<Simulation|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[storageError,setStorageError]=useState(false),[resetPending,setResetPending]=useState(false)
 const id=new URL(location.href).searchParams.get('case')||''
 const [theme,setTheme]=useState(()=>{try{return JSON.parse(localStorage.getItem(`lecture:${base}:${course.id}:theme`)||'"light"')}catch{return 'light'}})
 useEffect(()=>{document.documentElement.dataset.theme=theme==='dark'||theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';try{localStorage.setItem(`lecture:${base}:${course.id}:theme`,JSON.stringify(theme))}catch{}},[theme,base,course.id])
 useEffect(()=>{
  const controller=new AbortController();setError('')
  if(!/^[a-z0-9-]+-Q\d\d-case$/.test(id)){setError('Практическая задача не найдена.');return}
  fetch(`${base}scenarios/${id}.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Не удалось загрузить сценарий.');return r.json()}).then((model:Scenario)=>{
   if(controller.signal.aborted)return
   if(model.id!==id||!model.actions?.length||!model.checks?.length||!course.lectures.some(l=>l.id===model.lectureId))throw Error('Неверный состав сценария.')
   let saved:unknown;try{saved=JSON.parse(localStorage.getItem(storageKey(base,course,model))||'null')}catch{}
   setScenario(model);setSimulation(restoreSimulation(model,saved));document.title=model.title+' — Интерактивный кейс'
  }).catch(e=>{if(!controller.signal.aborted)setError(String(e))})
  return()=>controller.abort()
 },[id,base,course,retry])
 function update(next:Simulation){setSimulation(next);setResetPending(false);if(scenario)try{localStorage.setItem(storageKey(base,course,scenario),JSON.stringify(persistSimulation(scenario,next)));setStorageError(false)}catch{setStorageError(true)}}
 if(error)return <main className="case-study"><h1>Практическая задача</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>setRetry(n=>n+1)}>Повторить загрузку</button><a href={base}>Каталог</a></main>
 if(!scenario||!simulation)return <main className="case-study" role="status">Загружаем сценарий…</main>
 const model=scenario,state=simulation,lecture=course.lectures.find(l=>l.id===model.lectureId)!,last=state.events.at(-1),results=checks(model,state.world),ready=completed(model,state.world)
 const label=(key:string)=>model.fields.find(f=>f.key===key)?.label||key
 function execute(action:string,value?:number){const next=runAction(model,state,action,value);if(next!==state)update(next)}
 return <main className="case-study team-practice case-simulation" data-case-id={model.id}>
  <header><a className="button secondary" href={`${base}?lecture=${lecture.id}&slide=${model.questionId}-passport`}>Вернуться к лекции</a><button className="button secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'Светлая тема':'Тёмная тема'}</button></header>
  <p className="eyebrow">{course.code} · {lecture.semester} семестр · Интерактивный кейс</p><h1>{model.title}</h1>
  <section className="case-condition"><h2>Исходная ситуация</h2><p>{model.condition}</p><p><strong>Цель:</strong> {model.goal}</p><ul>{model.rules.map((rule,i)=><li key={i}>{rule}</li>)}</ul><p className="case-data-label">Выполняйте операции и наблюдайте результат. Время в модели проходит при выполнении действий. Исправляйте последствия в текущей ситуации; история сохраняется.</p></section>
  {storageError&&<p role="alert">Браузер не сохраняет ход работы. Продолжать можно до закрытия страницы.</p>}
  <section className="sim-state" aria-label="Состояние системы"><h2>Состояние системы</h2><dl className="scenario-fields">{model.fields.map(field=>{
   const changed=last?.changes.some(change=>change.key===field.key)
   return <div key={`${field.key}:${changed?state.events.length:0}`} data-field={field.key} data-value={String(state.world[field.key])} className={changed?'state-changed':''}><dt>{field.label}</dt><dd>{valueText(state.world[field.key])}{field.unit&&<span> {field.unit}</span>}</dd></div>
  })}</dl></section>
  <section className="scenario-work" aria-labelledby="situation-heading"><h2 id="situation-heading">Текущая ситуация</h2><p className="scenario-scene" data-scene role="status" aria-live="polite">{currentScene(model,state.world)}</p>
   {last&&<div className="sim-observation" aria-label="Результат последней операции"><strong>{last.label}</strong><p>{last.text}</p>{last.changes.length>0?<ul>{last.changes.map(change=><li key={change.key}>{label(change.key)}: {valueText(change.before)} → {valueText(change.after)}</li>)}</ul>:<p>Состояние системы не изменилось.</p>}</div>}
   <h3>Доступные операции</h3><div className="scenario-actions">{availableActions(model,state.world).map(action=><Operation key={action.id} action={action} simulation={state} execute={execute}/>)}</div>
  </section>
  <section className="sim-probe"><h2>Проверка результата</h2><button className="button primary" onClick={()=>update({...state,probe:true})}>Выполнить контрольный прогон</button>
   {state.probe&&<div className="sim-result" data-result={ready?'ready':'broken'} role="status"><h3>{ready?'Цель достигнута':'Работа ещё не завершена'}</h3><ul>{results.map((result,i)=><li key={i} data-met={result.met}>{result.met?'Выполнено: ':'Требуется: '}{result.text}</li>)}</ul></div>}
   <button className="button secondary sim-solution-toggle" onClick={()=>update({...state,revealed:!state.revealed})}>{state.revealed?'Скрыть разбор':'Открыть разбор механизма'}</button>
  </section>
  {state.revealed&&<aside className="case-solution"><h2>Почему меняется результат</h2><p>{renderText(model.debrief,state.world)}</p><p>Разбор не выполняет операции и не меняет состояние системы.</p></aside>}
  <details className="sim-log"><summary>Журнал действий · {state.events.length}</summary><ol>{state.events.map((event,i)=><li key={i}><strong>{event.label}</strong><p>{event.text}</p>{event.changes.map(change=><p key={change.key}>{label(change.key)}: {valueText(change.before)} → {valueText(change.after)}</p>)}</li>)}</ol></details>
  <div className="case-navigation"><button className="button secondary" onClick={()=>setResetPending(true)}>Начать заново</button></div>
  {resetPending&&<section className="team-reset" aria-label="Подтверждение сброса"><p>Начать отдельное прохождение с исходной ситуации? Текущие действия этого кейса будут удалены из сохранения браузера.</p><button className="button secondary" onClick={()=>setResetPending(false)}>Продолжить работу</button><button className="button primary" onClick={()=>update(newSimulation(model))}>Сбросить кейс</button></section>}
 </main>
}
