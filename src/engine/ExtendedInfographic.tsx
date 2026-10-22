import type {Visual} from './model'
import {assetUrl} from './model'

const colors=['#DE040D','#4561C8','#1C8D00','#66758A','#9A7079','#4561C8']
export const SVG_LINE_HEIGHT=1.3

function wrapCharacters(text:string,capacity:number){
  const limit=Math.max(4,Math.floor(capacity)),out:string[]=[]
  let line=''
  for(const word of text.trim().split(/\s+/)){
    const letters=Array.from(word)
    const chunks=Array.from({length:Math.max(1,Math.ceil(letters.length/limit))},(_,i)=>letters.slice(i*limit,(i+1)*limit).join(''))
    for(const chunk of chunks){
      const next=line?`${line} ${chunk}`:chunk
      if(Array.from(next).length>limit&&line){out.push(line);line=chunk}else line=next
    }
  }
  if(line)out.push(line)
  return out.length?out:['']
}

// A conservative Cyrillic/Latin advance estimate. Geometry and rendering call
// this same function, so line counts and the allocated card height agree.
export function svgTextLines(text:string,width:number,size:number){
  return wrapCharacters(text,width/(size*.58))
}
export function svgTextHeight(text:string,width:number,size:number){
  return svgTextLines(text,width,size).length*size*SVG_LINE_HEIGHT
}

type LabelKind='title'|'body'|'edge'|'axis'|'value'
function Text({s,x,y,max=22,size=22,bold=false,fill='#1c1c1c',width,kind}:{s:string;x:number;y:number;max?:number;size?:number;bold?:boolean;fill?:string;width?:number;kind?:LabelKind}){
  const lines=width===undefined?wrapCharacters(s,max):svgTextLines(s,width,size)
  return <text className={`svg-label svg-label--${kind||(bold?'title':'body')}`} x={x} y={y} textAnchor="middle" fill={fill} fontSize={size} fontWeight={bold?750:450}>
    {lines.map((line,i)=><tspan x={x} dy={i?`${SVG_LINE_HEIGHT}em`:0} key={i}>{line}</tspan>)}
  </text>
}

function Box({x,y,w=280,h=80,title,body,color='#4561C8',titleSize=22,bodySize=20,adaptive=false}:{x:number;y:number;w?:number;h?:number;title:string;body?:string;color?:string;titleSize?:number;bodySize?:number;adaptive?:boolean}){
  const pad=18,titleHeight=svgTextHeight(title,w-pad*2,titleSize)
  const required=pad*2+titleHeight+(body?14+svgTextHeight(body,w-pad*2,bodySize):0)
  return <g>
    <rect x={x} y={y} width={w} height={adaptive?Math.max(h,required):h} rx="12" fill="#f5f5f7" stroke={color} strokeWidth="2"/>
    <Text s={title} x={x+w/2} y={adaptive?y+pad+titleSize:y+34} size={titleSize} width={adaptive?w-pad*2:undefined} max={Math.round(w/13)} kind="title" bold/>
    {body&&<Text s={body} x={x+w/2} y={adaptive?y+pad+titleHeight+14+bodySize:y+73} size={bodySize} width={adaptive?w-pad*2:undefined} max={Math.round(w/12)} kind="body"/>}
  </g>
}

function cycleGeometry(v:Extract<Visual,{type:'cycle'}>){
  const width=300,titleSize=27,bodySize=24,pad=18
  const height=Math.max(136,...v.items.map((n,i)=>pad*2+svgTextHeight(`${i+1}. ${n.title}`,width-pad*2,titleSize)+14+svgTextHeight(n.text,width-pad*2,bodySize)))
  const top=20,gap=84,bottom=top+height+gap
  const positions=v.items.length===3?[{x:210,y:top+height/2},{x:830,y:top+height/2},{x:520,y:bottom+height/2}]
    :v.items.length<=4?[{x:250,y:top+height/2},{x:790,y:top+height/2},{x:790,y:bottom+height/2},{x:250,y:bottom+height/2}].slice(0,v.items.length)
      :v.items.map((_,i)=>({x:520+350*Math.cos(-Math.PI/2+i*2*Math.PI/v.items.length),y:250+170*Math.sin(-Math.PI/2+i*2*Math.PI/v.items.length)}))
  const labelY=v.items.length<=2?top+height+58:top+height+gap/2+8
  return {width,height,positions,H:Math.max(Math.max(...positions.map(p=>p.y+height/2))+24,labelY+24),labelY}
}

function comparisonGeometry(v:Extract<Visual,{type:'comparison'|'matrix'}>){
  const columnWidth=1000/v.columns.length,headerSize=26,bodySize=24,pad=14
  const headerHeight=Math.max(60,...v.columns.map(s=>svgTextHeight(s,columnWidth-pad*2,headerSize)+pad*2))
  const rowHeights=v.rows.map(row=>Math.max(62,...row.map(s=>svgTextHeight(s,columnWidth-pad*2,bodySize)+pad*2)))
  return {columnWidth,headerSize,bodySize,pad,headerHeight,rowHeights,H:10+headerHeight+rowHeights.reduce((a,b)=>a+b,0)+24}
}

export function extendedInfographicHeight(v:Visual){
  if(v.type==='cycle')return cycleGeometry(v).H
  if(v.type==='comparison'||v.type==='matrix')return comparisonGeometry(v).H
  return 400
}

export function ExtendedInfographic({visual:v,marker,base}:{visual:Visual;marker:string;base:string}){
  const arrow=`url(#${marker})`
  if(v.type==='cycle'){
    const g=cycleGeometry(v)
    return <>
      {v.items.length>1&&g.positions.map((a,i)=>{
        const b=g.positions[(i+1)%g.positions.length],dx=b.x-a.x,dy=b.y-a.y
        const ratio=1/Math.max(Math.abs(dx)/(g.width/2+9),Math.abs(dy)/(g.height/2+9))
        const twoNodeY=a.y+(i===0?-22:22)
        const edge=v.items.length===2?`M${a.x+Math.sign(dx)*(g.width/2+8)} ${twoNodeY} H${b.x-Math.sign(dx)*(g.width/2+12)}`
          :`M${a.x+dx*ratio} ${a.y+dy*ratio} L${b.x-dx*ratio} ${b.y-dy*ratio}`
        return <path key={`edge-${i}`} d={edge} stroke={colors[i%colors.length]} strokeWidth="4" fill="none" markerEnd={arrow}/>
      })}
      {v.items.map((node,i)=>{
        const p=g.positions[i]
        return <Box key={i} x={p.x-g.width/2} y={p.y-g.height/2} w={g.width} h={g.height} title={`${i+1}. ${node.title}`} body={node.text} color={colors[i%colors.length]} titleSize={27} bodySize={24} adaptive/>
      })}
      <Text s="Повторять цикл" x={520} y={g.labelY} width={260} size={24} kind="edge" bold/>
    </>
  }
  if(v.type==='comparison'||v.type==='matrix'){
    const g=comparisonGeometry(v)
    let y=10+g.headerHeight
    const rows=v.rows.map((row,i)=>{const value={row,y,h:g.rowHeights[i]};y+=value.h;return value})
    return <>
      {v.columns.map((s,i)=><g key={`header-${i}`}>
        <rect x={20+i*g.columnWidth} y="10" width={g.columnWidth} height={g.headerHeight} fill="#1c1c1c"/>
        <Text s={s} x={20+(i+.5)*g.columnWidth} y={10+g.pad+g.headerSize} width={g.columnWidth-g.pad*2} size={g.headerSize} fill="white" kind="title" bold/>
      </g>)}
      {rows.map(({row,y,h},r)=>row.map((s,i)=><g key={`${r}-${i}`}>
        <rect x={20+i*g.columnWidth} y={y} width={g.columnWidth} height={h} fill={r%2?'#f1f2f5':'#fff'} stroke="#d4d5da"/>
        <Text s={s} x={20+(i+.5)*g.columnWidth} y={y+g.pad+g.bodySize} width={g.columnWidth-g.pad*2} size={g.bodySize} bold={i===0} kind="body"/>
      </g>))}
    </>
  }
  if(v.type==='decision')return <><Box x={365} y={5} w={310} h={60} title={v.start}/><path d="M520 65 V96" stroke="#66758A" strokeWidth="3" markerEnd={arrow}/><path d="M520 100 L730 200 L520 300 L310 200 Z" fill="#fff1f1" stroke="#DE040D" strokeWidth="3"/><Text s={v.question} x={520} y={190} max={23} bold/><path d="M730 200 H795" stroke="#1C8D00" strokeWidth="3" markerEnd={arrow}/><Text s="Да" x={762} y={182} size={23} bold/><Box x={805} y={148} w={215} h={115} title={v.yes} color="#1C8D00"/><path d="M310 200 H245" stroke="#DE040D" strokeWidth="3" markerEnd={arrow}/><Text s="Нет" x={275} y={182} size={23} bold/><Box x={20} y={148} w={215} h={115} title={v.no} color="#DE040D"/></>
  if(v.type==='beforeAfter')return <>{[v.before,v.after].map((panel,i)=><g key={i}><rect x={20+i*530} y="12" width="485" height="312" rx="14" fill={i?'#f5fff2':'#f4f4f6'} stroke={i?'#1c8d00':'#9699a3'} strokeWidth="2"/><Text s={panel.title} x={262+i*530} y={48} bold size={26}/>{panel.fields.map((f,j)=><g key={j}><text className="svg-label svg-label--title" x={43+i*530} y={95+j*75} fontSize="21" fontWeight="650" fill="#333">{f.label}</text><rect x={43+i*530} y={105+j*75} width="438" height="38" rx="6" fill="#fff" stroke={i?'#1c8d00':'#b9bbc2'}/><text className="svg-label svg-label--body" x={56+i*530} y={130+j*75} fontSize="19" fill="#62626d">{f.value}</text></g>)}</g>)}<Text s={v.changes.join(' · ')} x={520} y={365} max={90} size={21} bold/></>
  if(v.type==='conceptMap'){const positions=[{x:150,y:65},{x:520,y:40},{x:890,y:65},{x:150,y:300},{x:520,y:340},{x:890,y:300}];return <>{v.items.map((n,i)=>{const p=positions[i];return <g key={i}><path d={`M520 192 L${p.x} ${p.y}`} stroke={colors[i]} strokeWidth="2"/><Text s={n.relation} x={(p.x+520)/2} y={(p.y+192)/2+(i>=3?18:-8)} max={16} size={18} kind="edge"/><rect x={p.x-130} y={p.y-33} width="260" height="76" rx="10" fill="#fff" stroke={colors[i]} strokeWidth="2"/><Text s={n.title} x={p.x} y={p.y-4} bold size={22}/><Text s={n.example} x={p.x} y={p.y+25} size={19}/></g>})}<rect x="370" y="153" width="300" height="78" rx="14" fill="#1c1c1c"/><Text s={v.center} x={520} y={200} bold fill="white" size={29}/></>}
  if(v.type==='states'){const w=166,gap=43;return <>{v.states.map((s,i)=><g key={s}><Box x={15+i*(w+gap)} y={64} w={w} h={80} title={s} color={colors[i]}/>{i<v.states.length-1&&<path d={`M${15+i*(w+gap)+w} 104 H${15+(i+1)*(w+gap)-8}`} stroke="#66758a" strokeWidth="3" markerEnd={arrow}/>}</g>)}{v.cancelFrom.map(i=><path key={i} d={`M${98+i*(w+gap)} 144 V220 H520 V277`} stroke="#DE040D" strokeWidth="2" fill="none" markerEnd={arrow}/>)}<Text s="Отмена разрешена только из отмеченных состояний" x={520} y={250} size={20} max={60}/><Box x={380} y={285} w={280} h={65} title="Отменён" color="#DE040D"/></>}
  if(v.type==='cause'){return <>{[{title:'Причина',body:v.cause},{title:'Следствие',body:v.effect},{title:'Решение',body:v.solution}].map((n,i)=><g key={i}><Box x={20+i*350} y={75} w={300} h={205} title={n.title} body={n.body} color={colors[i]}/>{i<2&&<path d={`M${320+i*350} 178 H${360+i*350}`} stroke="#66758a" strokeWidth="3" markerEnd={arrow}/>}</g>)}</>}
  if(v.type==='callouts'){return <><rect x="20" y="8" width="635" height="370" rx="12" fill="#f4f4f6" stroke="#d4d5da"/><image href={assetUrl(v.image,base)} x="28" y="16" width="620" height="355" preserveAspectRatio="xMidYMid meet" aria-label={v.alt}/>{v.items.map((n,i)=><g key={i}><circle cx={28+n.x/100*620} cy={16+n.y/100*355} r="18" fill="#DE040D" stroke="white" strokeWidth="3"/><text className="svg-label svg-label--axis" x={28+n.x/100*620} y={22+n.y/100*355} fontSize="20" textAnchor="middle" fill="white" fontWeight="800">{i+1}</text><circle cx="700" cy={49+i*87} r="17" fill="#DE040D"/><text className="svg-label svg-label--axis" x="700" y={56+i*87} textAnchor="middle" fontSize="20" fill="white" fontWeight="750">{i+1}</text><text className="svg-label svg-label--title" x="731" y={48+i*87} fontSize="22" fill="#1c1c1c" fontWeight="750">{n.title}</text><Text s={n.text} x={865} y={77+i*87} max={24} size={19}/></g>)}</>}
  if(v.type==='codeParts'){return <>{v.parts.map((p,i)=><g key={i}><rect x="18" y={14+i*90} width="568" height="78" rx="8" fill="#202024"/><rect x="18" y={14+i*90} width="5" height="78" fill={colors[i]}/><text className="svg-label svg-label--body" x="36" y={62+i*90} fontFamily="Consolas,monospace" fontSize="23" fill="white">{p.code}</text><path d={`M600 ${54+i*90} H644`} stroke={colors[i]} strokeWidth="3" markerEnd={arrow}/><text className="svg-label svg-label--title" x="668" y={45+i*90} fontSize="23" fontWeight="750" fill="#1c1c1c">{p.label}</text><text className="svg-label svg-label--body" x="668" y={77+i*90} fontSize="20" fill="#505058">{p.explanation}</text></g>)}</>}
  return null
}
