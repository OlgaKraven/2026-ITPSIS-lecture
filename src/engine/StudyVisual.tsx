import type {Slide,Visual} from './model'
import './study-visual.css'

export function RowVisual({slide}:{slide:Slide}){
 const rows=slide.rows!
 if(slide.id.endsWith('-warning')&&rows.length===1)return <div className="study-contrast">{slide.columns!.map((label,i)=><section key={label} className={i===1?'study-focus':undefined}><h3>{label}</h3><p>{rows[0][i]}</p></section>)}</div>
 if(slide.columns?.[0]==='Часть разбора')return <dl className="study-reasoning">{rows.map(([label,text],i)=><div key={label} className={i===1?'study-focus':undefined}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
 return <div className="table-scroll" tabIndex={0} role="region" aria-label={`Таблица: ${slide.title}`}><table className="comparison-table"><thead><tr>{slide.columns?.map((x,i)=><th scope="col" key={i}>{x}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
}

export function StateTracks({visual:v,focus=-1,track=0}:{visual:Extract<Visual,{type:'comparison'|'matrix'}>;focus?:number;track?:number}){
 return <figure className="study-tracks" aria-label="Два самостоятельных маршрута состояний">{v.rows.map(([name,states,criterion],row)=><section key={name}><h3>{name}</h3><ol>{states.split(' → ').map((state,i)=><li key={i} data-ig-active={row===track&&i===focus}>{state}</li>)}</ol><p><strong>Критерий:</strong> {criterion}</p></section>)}<figcaption>{v.caption}</figcaption></figure>
}

export function DurationFigure({visual:v,modelTime}:{visual:Extract<Visual,{type:'duration'}>;modelTime?:number}){
 const x=(value:number)=>40+value/v.max*960
 let cursor=0
 return <figure className="study-duration" aria-label={v.caption}>
 <div className="study-duration-scroll" tabIndex={0} role="region" aria-label="Временная шкала; на узком экране доступен горизонтальный просмотр">
 <svg viewBox="0 0 1040 170" role="img" aria-label={`${v.axisLabel}. ${v.segments.map(s=>`${s.title}: ${s.value} ${v.unit}`).join('; ')}${v.threshold?`; ${v.threshold.label}`:''}`}>
 {v.segments.map((s,i)=>{const start=cursor;cursor+=s.value;return <g key={i}><rect x={x(start)} y="58" width={x(cursor)-x(start)} height="38" className="study-interval"/><line x1={x(start)} x2={x(start)} y1="56" y2="98" className="study-divider"/><text x={(x(start)+x(cursor))/2} y="84" textAnchor="middle">{i+1}</text></g>})}
 <line x1="40" x2="1000" y1="110" y2="110" className="study-axis"/>
 {v.ticks.map(t=><g key={t.value}><line x1={x(t.value)} x2={x(t.value)} y1="105" y2="118" className="study-axis"/><text x={x(t.value)} y="146" textAnchor="middle">{t.label}</text></g>)}
 {v.threshold&&<g><line x1={x(v.threshold.value)} x2={x(v.threshold.value)} y1="40" y2="111" className="study-threshold"/><text x={x(v.threshold.value)} y="25" textAnchor={v.threshold.value/v.max>.8?'end':'middle'} className="study-threshold-label">{v.threshold.label}</text></g>}
 {modelTime!==undefined&&<g data-model-time={modelTime}><line x1={x(modelTime)} x2={x(modelTime)} y1="48" y2="118" className="diagram-cursor"/><circle className="diagram-token" cx={x(modelTime)} cy="110" r="8"/></g>}
 </svg></div>
 <p className="study-axis-label">{v.axisLabel}</p>
 <ol className="study-duration-legend">{v.segments.map((s,i)=><li key={i}><span>{i+1}</span><div><strong>{s.title}</strong><p>{s.value} {v.unit}</p></div></li>)}</ol>
 <figcaption>{v.caption}</figcaption></figure>
}
