import {useEffect,useRef,useState} from 'react'
import type {Course} from './engine'
import {CaseDiagram} from './CaseDiagram'
import {describeAnswer,editAnswer,gradeStep,initialAnswer,passedPrefix,restoreDraft} from './teamPractice'
import type {PracticeStep,StepAnswer,TeamActivity,TeamDraft} from './teamPractice'
import './case-study.css'
const empty:TeamDraft={cursor:0,steps:{},revealed:false}
function DataTable({data}:{data:PracticeStep['data']}){return data?<div className="team-data" tabIndex={0} role="region" aria-label={data.caption}><table><caption>{data.caption}</caption><thead><tr>{data.columns.map((c,i)=><th scope="col" key={i}>{c}</th>)}</tr></thead><tbody>{data.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>:null}
function storageKey(course:Course,base:string,a:TeamActivity){return `lecture:${base}:${course.id}:case:${a.id}:revision-${a.revision}`}
function Input({step,answer,change}:{step:PracticeStep;answer:StepAnswer;change:(answer:StepAnswer)=>void}){
 if(step.type==='numeric'||step.type==='code')return <label className="team-value">{step.type==='numeric'?`Ответ (${step.unit})`:'Ответ'}<input aria-label={step.type==='numeric'?`Ответ (${step.unit})`:'Ответ'} inputMode={step.type==='numeric'?'decimal':'text'} autoComplete="off" value={typeof answer==='string'?answer:''} onChange={e=>change(e.target.value)}/></label>
 if(step.type==='matching')return <div className="team-matching">{step.items!.map((item,i)=><label key={item.id}><span>{item.text}</span><select aria-label={`Соответствие ${i+1}: ${item.text}`} value={typeof answer==='object'&&!Array.isArray(answer)?answer[item.id]||'':''} onChange={e=>change({...typeof answer==='object'&&!Array.isArray(answer)?answer:{},[item.id]:e.target.value})}><option value="">Выберите соответствие</option>{step.choices!.map(c=><option key={c.id} value={c.id}>{c.text}</option>)}</select></label>)}</div>
 if(step.type==='order'){
  const ids=Array.isArray(answer)?answer:step.items!.map(x=>x.id)
  const move=(i:number,delta:number)=>{const next=[...ids];[next[i],next[i+delta]]=[next[i+delta],next[i]];change(next)}
  return <ol className="team-order">{ids.map((id,i)=><li key={id} data-item-id={id}><span>{step.items!.find(x=>x.id===id)?.text}</span><button type="button" className="button secondary" aria-label={`Выше: ${step.items!.find(x=>x.id===id)?.text}`} disabled={!i} onClick={()=>move(i,-1)}>↑</button><button type="button" className="button secondary" aria-label={`Ниже: ${step.items!.find(x=>x.id===id)?.text}`} disabled={i===ids.length-1} onClick={()=>move(i,1)}>↓</button></li>)}</ol>
 }
 return <div className="team-choices">{step.choices!.map(c=><label className="case-option" key={c.id}><input type={step.type==='multiple'?'checkbox':'radio'} name={step.id} value={c.id} checked={step.type==='multiple'?Array.isArray(answer)&&answer.includes(c.id):answer===c.id} onChange={()=>change(step.type==='multiple'?(Array.isArray(answer)&&answer.includes(c.id)?answer.filter(x=>x!==c.id):[...Array.isArray(answer)?answer:[],c.id]):c.id)}/><span>{c.text}</span></label>)}</div>
}
export function CaseStudy({course,base}:{course:Course;base:string}){
 const [activity,setActivity]=useState<TeamActivity|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[draft,setDraft]=useState<TeamDraft>(empty),[storageError,setStorageError]=useState(false),[feedback,setFeedback]=useState(''),[hint,setHint]=useState(false),[resetPending,setResetPending]=useState(false)
 const heading=useRef<HTMLHeadingElement>(null)
 const [theme,setTheme]=useState(()=>{try{return JSON.parse(localStorage.getItem(`lecture:${base}:${course.id}:theme`)||'"light"')}catch{return 'light'}})
 const id=new URL(location.href).searchParams.get('case')||''
 useEffect(()=>{document.documentElement.dataset.theme=theme==='dark'||theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';try{localStorage.setItem(`lecture:${base}:${course.id}:theme`,JSON.stringify(theme))}catch{}},[theme,base,course.id])
 useEffect(()=>{const controller=new AbortController();setError('');if(!/^[a-z0-9-]+-Q\d\d-case$/.test(id)){setError('Практическая задача не найдена.');return}
 fetch(`${base}activities/${id}.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Не удалось загрузить задачу.');return r.json()}).then((a:TeamActivity)=>{if(controller.signal.aborted)return;if(a.id!==id||!Array.isArray(a.steps)||a.steps.length<3||!course.lectures.some(l=>l.id===a.lectureId))throw Error('Неверный состав задачи.');let value:unknown;try{value=JSON.parse(localStorage.getItem(storageKey(course,base,a))||'null')}catch{}setActivity(a);setDraft(restoreDraft(a,value))}).catch(e=>{if(!controller.signal.aborted)setError(String(e))});return()=>controller.abort()},[id,base,course,retry])
 function update(next:TeamDraft){setDraft(next);setFeedback('');setHint(false);setResetPending(false);if(activity)try{localStorage.setItem(storageKey(course,base,activity),JSON.stringify(next));setStorageError(false)}catch{setStorageError(true)}}
 function navigate(cursor:number){update({...draft,cursor});requestAnimationFrame(()=>heading.current?.focus())}
 if(error)return <main className="case-study"><h1>Практическая задача</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>setRetry(n=>n+1)}>Повторить загрузку</button><a href={base}>Каталог</a></main>
 if(!activity)return <main className="case-study" role="status">Загружаем задачу…</main>
 const a=activity,l=course.lectures.find(l=>l.id===a.lectureId)!,prefix=passedPrefix(a,draft),index=draft.cursor-1,step=a.steps[index],state=step&&draft.steps[step.id],answer=step?(state?.answer??initialAnswer(step)):'',grade=step&&state?.checked?gradeStep(step,answer):null,complete=prefix===a.steps.length
 function check(){if(!step)return;const result=gradeStep(step,answer);if(result.status==='empty'){setFeedback(result.message);return}update({...draft,steps:{...draft.steps,[step.id]:{answer,checked:true,attempts:(state?.attempts||0)+1}}});setFeedback(result.message)}
 return <main className="case-study team-practice">
 <header><a className="button secondary" href={`${base}?lecture=${l.id}&slide=${a.questionId}-passport`}>Вернуться к лекции</a><button className="button secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'Светлая тема':'Тёмная тема'}</button></header>
 <p className="eyebrow">{course.code} · {l.semester} семестр · Практическая задача</p><h1>{a.title}</h1>
 {storageError&&<p role="alert">Браузер не сохраняет ход решения. Продолжать можно до закрытия страницы.</p>}
 {draft.cursor===0?<section className="case-condition"><h2>Условие</h2><p>{a.condition}</p><p className="case-data-label">Учебный случай. Обсудите ответ командой; преподаватель вводит согласованное решение.</p></section>:<details className="case-condition"><summary>Условие задачи</summary><p>{a.condition}</p></details>}
 <nav className="team-progress" aria-label="Ход решения"><span>Шаг {draft.cursor} / {a.steps.length}</span><span>Проверено: {prefix} / {a.steps.length}</span></nav>
 {draft.cursor===0?<section className="team-overview"><h2 ref={heading} tabIndex={-1}>План командного решения</h2><ol>{a.steps.map(s=><li key={s.id}>{s.title}</li>)}</ol><CaseDiagram id={a.id} focus={0}/><button className="button primary" onClick={()=>navigate(1)}>Начать решение</button></section>:<section className="team-current" data-step-id={step.id} data-step-type={step.type}>
 <h2 ref={heading} tabIndex={-1}>{step.title}</h2><p className="team-prompt">{step.prompt}</p><DataTable data={step.data}/>
 {index>0&&<details className="team-history"><summary>Данные и решения предыдущих шагов</summary>{a.steps.slice(0,index).map((previous,i)=>draft.steps[previous.id]?.checked&&i<prefix?<section key={previous.id}><h3>Шаг {i+1}: {previous.title}</h3><p>{previous.prompt}</p><DataTable data={previous.data}/><p><strong>Ответ команды:</strong> {describeAnswer(previous,draft.steps[previous.id].answer)}</p></section>:null)}</details>}
 {step.type==='multiple'&&<p className="case-data-label">Выберите все подходящие пункты. Лишний пункт делает набор неверным.</p>}{step.type==='matching'&&<p className="case-data-label">Выберите соответствие для каждой строки. Один вариант можно использовать несколько раз.</p>}{step.type==='order'&&<p className="case-data-label">Расставьте действия по зависимостям кнопками ↑ и ↓. Если взаимный порядок не задан, допускаются разные верные последовательности.</p>}
 <form onSubmit={e=>{e.preventDefault();check()}}><Input step={step} answer={answer} change={value=>update(editAnswer(a,draft,index,value))}/><button className="button primary" type="submit">Проверить шаг</button></form>
 <div className={`team-feedback ${grade?.status||''}`} role="status" aria-live="polite">{feedback||grade?.message||''}</div>
 {grade?.items&&<ul className="team-row-feedback">{grade.items.map(x=><li key={x.id}>{step.items!.find(item=>item.id===x.id)?.text}: {x.correct?'верно':'нужно исправить'}</li>)}</ul>}
 {grade?.status==='incorrect'&&<button className="button secondary" onClick={()=>setHint(!hint)}>{hint?'Скрыть подсказку':'Подсказка к шагу'}</button>}{hint&&<aside className="team-hint">{step.hint}</aside>}
 <div className="case-navigation"><button className="button secondary" onClick={()=>navigate(draft.cursor-1)}>Назад</button>{draft.cursor<a.steps.length&&<button className="button primary" disabled={grade?.status!=='correct'} onClick={()=>navigate(draft.cursor+1)}>Следующий шаг</button>}</div>
 </section>}
 {complete&&<section className="team-complete"><h2>Командное решение проверено</h2><p>Все {a.steps.length} шага выполнены верно.</p><button className="button secondary" onClick={()=>update({...draft,revealed:!draft.revealed})}>{draft.revealed?'Скрыть разбор':'Открыть полный разбор'}</button></section>}
 {complete&&draft.revealed&&<aside className="case-solution"><h2>Разбор задачи</h2><ol>{a.steps.map(s=><li key={s.id}><strong>{s.title}.</strong> {s.explanation}</li>)}</ol><p>{a.explanation}</p><p>{a.rule}</p><CaseDiagram id={a.id} focus={0} reveal/></aside>}
 <footer className="team-actions"><button className="button secondary" onClick={()=>navigate(0)}>К условию и плану</button><button className="button secondary" onClick={()=>setResetPending(true)}>Начать заново</button></footer>
 {resetPending&&<aside className="team-reset" aria-label="Сброс решения"><p>Сбросить ответы и проверки этой задачи? До подтверждения решение сохраняется.</p><button className="button secondary" onClick={()=>setResetPending(false)}>Продолжить решение</button><button className="button primary" onClick={()=>update(empty)}>Сбросить решение</button></aside>}
 </main>
}
