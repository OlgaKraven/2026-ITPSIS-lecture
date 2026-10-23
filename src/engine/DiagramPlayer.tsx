import {useContext,useEffect,useRef,useState} from 'react'
import type {Slide,Visual} from './model'
import {Infographic} from './Infographic'
import './diagram-player.css'
import {DiagramSyncContext} from './DiagramSync'

export type DiagramStep={title:string;text:string;duration:number;time?:number}
export function diagramSteps(slide:Slide,track=0):DiagramStep[]{
 const v=slide.visual
 if(v?.type==='duration'){let time=0;const total=v.segments.reduce((n,s)=>n+s.value,0);return v.segments.map(s=>{time+=s.value;return {title:s.title,text:`Завершён интервал: ${s.value} ${v.unit}. От начала: ${time} ${v.unit}.`,duration:s.value/total*8000,time}})}
 if(v?.type==='process'||v?.type==='timeline'||v?.type==='cycle')return v.items.map(s=>({...s,duration:1400}))
 if((v?.type==='comparison'||v?.type==='matrix')&&v.display==='stateTracks')return (v.rows[track]||v.rows[0])[1].split(' → ').map((state,i)=>({title:state,text:`${(v.rows[track]||v.rows[0])[0]}: состояние ${i+1}. Критерий маршрута: ${(v.rows[track]||v.rows[0])[2]}`,duration:1400}))
 if(v?.type==='comparison'||v?.type==='matrix')return v.rows.map(row=>({title:row[0],text:row.map((cell,i)=>`${v.columns[i]}: ${cell}`).join('. '),duration:2000}))
 if(slide.rows)return slide.rows.map(row=>({title:row[0],text:row.slice(1).join('. '),duration:2000}))
 if(slide.steps)return slide.steps.map(s=>({...s,duration:1400}))
 return []
}
export function DiagramPlayer({slide,base}:{slide:Slide;base:string}){
 const sync=useContext(DiagramSyncContext)
 const [track,setTrack]=useState(0),[step,setStep]=useState(0),[playing,setPlaying]=useState(false),[fraction,setFraction]=useState(0),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
 const publishedAt=useRef(0)
 const position=useRef(0),last=useRef(0),steps=diagramSteps(slide,track),count=steps.length
 const v=slide.visual,tracks=(v?.type==='comparison'||v?.type==='matrix')&&v.display==='stateTracks'?v.rows:undefined
 const duration=v?.type==='duration'?v:undefined
 const currentTime=duration?((steps[step-1]?.time||0)+fraction*(duration.segments[step]?.value||0)):undefined
 const active=step>0?step-1:-1
 function stop(){setPlaying(false)}
 function move(next:number){stop();position.current=0;setFraction(0);setStep(Math.max(0,Math.min(count,next)))}
 useEffect(()=>{if(sync.readonly&&sync.state?.slideId===slide.id){setStep(sync.state.step);setTrack(sync.state.track);setFraction(reduced?0:sync.state.fraction);setPlaying(false)}},[sync.readonly,sync.state,slide.id,reduced])
 useEffect(()=>{if(sync.readonly||!sync.onChange)return;const now=performance.now();if(playing&&fraction>0&&now-publishedAt.current<33)return;publishedAt.current=now;sync.onChange({slideId:slide.id,open:true,step,track,fraction,playing})},[sync.readonly,sync.onChange,slide.id,step,track,fraction,playing])
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const listener=()=>{setReduced(mq.matches);if(mq.matches){setPlaying(false);position.current=0;setFraction(0)}};mq.addEventListener('change',listener);const hide=()=>{if(document.hidden)setPlaying(false)};document.addEventListener('visibilitychange',hide);return()=>{mq.removeEventListener('change',listener);document.removeEventListener('visibilitychange',hide)}},[])
 useEffect(()=>{
  if(!playing||reduced||sync.readonly||step>=count)return
  let frame=0;last.current=0
  const tick=(now:number)=>{if(document.hidden){setPlaying(false);return}if(last.current)position.current=Math.min(1,position.current+(now-last.current)/steps[step].duration);last.current=now;setFraction(position.current)
   if(position.current>=1){position.current=0;setFraction(0);setStep(n=>n+1);if(step+1>=count)setPlaying(false)}else frame=requestAnimationFrame(tick)
  }
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)
 },[playing,reduced,step,track,count,slide,sync.readonly])
 const visual:Visual|undefined=v|| (slide.steps?{type:'process',items:slide.steps,caption:'Последовательность действий из объяснения.'}:undefined)
 return <section className="diagram-player infographic" data-step={step} data-fraction={fraction.toFixed(4)} aria-label="Пошаговый разбор схемы" onKeyDown={e=>{if(sync.readonly)return;if(e.target instanceof Element&&e.target.closest('input,select,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();move(step+1)}if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();move(step-1)}}}>
 {tracks&&<label className="diagram-track">Маршрут записи<select disabled={sync.readonly} value={track} onChange={e=>{stop();position.current=0;setFraction(0);setStep(0);setTrack(Number(e.target.value))}}>{tracks.map((row,i)=><option value={i} key={row[0]}>{row[0]}</option>)}</select></label>}
 <p className="diagram-context">{duration?`Линейная шкала: весь маршрут за 8 с показа. Модельное время: ${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(currentTime!)} ${duration.unit}.`:tracks?'Маршруты записей самостоятельны. Выбор маршрута возвращает к исходному состоянию.':v?.type==='process'||slide.steps?'Маркер обозначает переход к следующему действию.':'Последовательный разбор связей и данных; подсветка обозначает фокус объяснения.'}</p>
 <div className="diagram-canvas" data-active-index={active}>
 {visual?<Infographic visual={visual} base={base} focus={active} progress={reduced?0:fraction} modelTime={reduced&&duration?(steps[step-1]?.time||0):currentTime} track={track}/>:<div className="diagram-rows">{slide.rows?.map((row,i)=><section key={i} data-active={i===active}><h3>{row[0]}</h3><p>{row.slice(1).join('. ')}</p></section>)}</div>}
 </div>
 <div className="diagram-controls">{!sync.readonly&&<><button className="button secondary" disabled={step===0} onClick={()=>move(step-1)}>Назад</button>{!reduced&&<button className="button primary" disabled={!count} onClick={()=>{if(playing){stop();return}if(step===count){position.current=0;setFraction(0);setStep(0)}setPlaying(true)}}>{playing?'Пауза':step===count?'Повторить':'Показать'}</button>}<button className="button secondary" disabled={step===count} onClick={()=>move(step+1)}>Далее</button><button className="button secondary" onClick={()=>move(0)}>К началу</button></>}<span>Шаг {step} / {count}</span></div>
 <p className="diagram-caption" aria-live="polite" aria-atomic="true">{step===0?'Обзор. Исходные данные и все связи; действия ещё не выполнены.':`${steps[step-1]?.title}. ${steps[step-1]?.text}`}</p>
 {reduced&&<p className="diagram-context">Уменьшенное движение: все состояния доступны кнопками «Назад» и «Далее».</p>}
 </section>
}
