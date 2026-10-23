import {useId} from 'react'
import type {ReactNode} from 'react'
import type {Visual} from './model'
import {ExtendedInfographic, extendedInfographicHeight, svgTextLines, svgTextHeight, SVG_LINE_HEIGHT} from './ExtendedInfographic'
import {DurationFigure,StateTracks} from './StudyVisual'

const palette=['var(--ig-muted)','var(--ig-muted)','var(--ig-muted)','var(--ig-muted)','var(--ig-muted)']
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4,useGrouping:false})
type LabelKind='title'|'body'|'edge'|'axis'|'value'
function Label({text,x,y,size=24,width=300,bold=false,fill='var(--ig-ink)',kind='body',anchor='middle'}:{text:string;x:number;y:number;size?:number;width?:number;bold?:boolean;fill?:string;kind?:LabelKind;anchor?:'middle'|'start'|'end'}){
  return <text className={`svg-label svg-label--${kind}`} x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} fontWeight={bold?750:450}>
    {svgTextLines(text,width,size).map((line,i)=><tspan key={i} x={x} dy={i?`${SVG_LINE_HEIGHT}em`:0}>{line}</tspan>)}
  </text>
}

export function Infographic({visual:v,base='/',focus=-1,progress=0,modelTime,track=0}:{visual:Visual;base?:string;focus?:number;progress?:number;modelTime?:number;track?:number}){
  const marker=useId().replace(/:/g,'')
  if(v.type==='duration')return <DurationFigure visual={v} modelTime={modelTime}/>
  if((v.type==='comparison'||v.type==='matrix')&&v.display==='stateTracks')return <StateTracks visual={v} focus={focus} track={track}/>
  if(v.type==='comparison'||v.type==='matrix')return <figure className="infographic infographic-table" tabIndex={0} aria-label={'Сопоставление: '+v.caption}>
    <div className="table-scroll"><table className="comparison-table"><thead><tr>{v.columns.map((c,i)=><th scope="col" key={i}>{c}</th>)}</tr></thead><tbody>{v.rows.map((row,r)=><tr key={r} data-ig-active={focus===r}>{row.map((cell,c)=>c===0?<th scope="row" key={c}>{cell}</th>:<td key={c}>{cell}</td>)}</tr>)}</tbody></table></div><figcaption>{v.caption}</figcaption>
  </figure>
  const W=1040
  let H=extendedInfographicHeight(v)
  let shape:ReactNode=null

  if(v.type==='process'||v.type==='timeline'){
    const gap=36,width=(1000-gap*(v.items.length-1))/v.items.length,pad=22
    const top=v.type==='timeline'?95:72,titleSize=27,bodySize=24
    const heights=v.items.map(item=>({title:svgTextHeight(item.title,width-pad*2,titleSize),body:svgTextHeight(item.text,width-pad*2,bodySize)}))
    const boxHeight=Math.max(174,...heights.map(h=>pad*2+h.title+16+h.body))
    H=top+boxHeight+24
    shape=<>
      {v.type==='timeline'&&<line x1="50" y1="58" x2="990" y2="58" stroke="var(--ig-line)" strokeWidth="5"/>}
      {v.items.map((item,i)=>{
        const x=20+i*(width+gap),cy=v.type==='timeline'?58:34
        return <g key={i} data-ig-active={focus===i}>
          {v.type==='process'&&i<v.items.length-1&&<path d={`M ${x+width+5} ${top+boxHeight/2} h ${gap-15}`} fill="none" stroke="var(--ig-muted)" strokeWidth="1.5" markerEnd={`url(#${marker})`}/>}
          <rect x={x} y={top} width={width} height={boxHeight} rx="13" fill="var(--ig-neutral)" stroke="var(--ig-line)"/>
          <rect x={x} y={top} width={width} height="5" rx="2" fill={palette[i%palette.length]}/>
          <circle cx={x+width/2} cy={cy} r="25" fill={palette[i%palette.length]}/>
          <text className="svg-label svg-label--axis" x={x+width/2} y={cy+8} textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ig-surface)">{i+1}</text>
          <Label text={item.title} x={x+width/2} y={top+pad+titleSize} size={titleSize} width={width-pad*2} kind="title" bold/>
          <Label text={item.text} x={x+width/2} y={top+pad+heights[i].title+16+bodySize} size={bodySize} width={width-pad*2}/>
        </g>
      })}
      {progress>0&&<circle className="diagram-token" r="12" cx={focus<0?20+progress*width/2:20+(focus+.5)*(width+gap)-gap/2+progress*(width+gap)} cy={top+boxHeight/2}/>}
    </>
  }
  else if(v.type==='tree'){
    const width=960/v.branches.length,titleSize=27,bodySize=24,rootWidth=440
    const rootHeight=Math.max(64,svgTextHeight(v.root,rootWidth-40,28)+24),rootBottom=8+rootHeight
    const trunkY=rootBottom+30,branchTop=trunkY+42
    const branchHeight=Math.max(64,...v.branches.map(b=>svgTextHeight(b.title,width-60,titleSize)+28))
    const layout=v.branches.map(branch=>{
      let y=branchTop+branchHeight+20
      const items=branch.items.map(text=>{
        const h=Math.max(58,svgTextHeight(text,width-92,bodySize)+26),item={text,y,h}
        y+=h+14
        return item
      })
      return {items,bottom:y-14}
    })
    H=Math.max(branchTop+branchHeight,...layout.map(b=>b.bottom))+24
    shape=<>
      <rect x={520-rootWidth/2} y="8" width={rootWidth} height={rootHeight} rx="12" fill="#1c1c1c"/>
      <Label text={v.root} x={520} y={20+28} size={28} width={rootWidth-40} fill="white" kind="title" bold/>
      <path d={`M520 ${rootBottom} V${trunkY}`} stroke="var(--ig-muted)" strokeWidth="1.5"/>
      {v.branches.map((branch,i)=>{
        const x=40+i*width,cx=x+width/2
        return <g key={i}>
          <path d={`M520 ${trunkY} H${cx} V${branchTop-10}`} fill="none" stroke={palette[i%palette.length]} strokeWidth="1.5" markerEnd={`url(#${marker})`}/>
          <rect x={x+12} y={branchTop} width={width-24} height={branchHeight} rx="10" fill="#f4f4f6" stroke={palette[i%palette.length]} strokeWidth="2"/>
          <Label text={branch.title} x={cx} y={branchTop+14+titleSize} size={titleSize} width={width-60} kind="title" bold/>
          {layout[i].items.map((item,j)=><g key={j}>
            <path d={`M${x+25} ${branchTop+branchHeight} V${item.y+item.h/2} H${x+37}`} fill="none" stroke={palette[i%palette.length]} strokeWidth="2" markerEnd={`url(#${marker})`}/>
            <rect x={x+45} y={item.y} width={width-60} height={item.h} rx="8" fill="#fff" stroke="var(--ig-line)"/>
            <Label text={item.text} x={cx+15} y={item.y+13+bodySize} size={bodySize} width={width-92}/>
          </g>)}
        </g>
      })}
    </>
  }
  else if(v.type==='network'){
    const gap=62,width=(1000-gap*(v.nodes.length-1))/v.nodes.length,titleSize=27,bodySize=24,pad=22
    const edgeWidth=Math.min(290,width+gap-16)
    const edgeHeight=Math.max(30,...v.edges.map(e=>svgTextHeight(e.label,edgeWidth,23)))
    const top=edgeHeight+44
    const heights=v.nodes.map(n=>({title:svgTextHeight(n.title,width-pad*2,titleSize),body:svgTextHeight(n.text,width-pad*2,bodySize)}))
    const boxHeight=Math.max(164,...heights.map(h=>pad*2+h.title+16+h.body))
    const positions=v.nodes.map((_,i)=>({x:20+i*(width+gap),y:top,w:width}))
    H=top+boxHeight+24
    shape=<>
      {v.edges.map((edge,i)=>{
        const a=positions[v.nodes.findIndex(n=>n.id===edge.from)],b=positions[v.nodes.findIndex(n=>n.id===edge.to)]
        if(!a||!b)return null
        const right=b.x>a.x,sx=right?a.x+a.w:a.x,ex=right?b.x-10:b.x+b.w+10
        return <g key={i}>
          <path d={`M${sx} ${top+boxHeight/2} H${ex}`} stroke="var(--ig-muted)" strokeWidth="1.5" fill="none" markerEnd={`url(#${marker})`}/>
          <Label text={edge.label} x={(sx+ex)/2} y={12+23} size={23} width={edgeWidth} kind="edge"/>
        </g>
      })}
      {v.nodes.map((node,i)=>{
        const p=positions[i]
        return <g key={node.id}>
          <rect x={p.x} y={p.y} width={p.w} height={boxHeight} rx="12" fill="#fff" stroke={palette[i%palette.length]} strokeWidth="1.5"/>
          <Label text={node.title} x={p.x+p.w/2} y={top+pad+titleSize} size={titleSize} width={width-pad*2} kind="title" bold/>
          <Label text={node.text} x={p.x+p.w/2} y={top+pad+heights[i].title+16+bodySize} size={bodySize} width={width-pad*2}/>
        </g>
      })}
    </>
  }
  else if(v.type==='bars'){
    const left=260,width=670,top=v.threshold===undefined?30:58,labelWidth=220
    const rowHeights=v.items.map(item=>Math.max(76,svgTextHeight(item.label,labelWidth,26)+20))
    let rowY=top
    const rows=v.items.map((item,i)=>{const row={item,y:rowY,h:rowHeights[i]};rowY+=row.h;return row})
    const axisY=rowY+8
    H=axisY+(v.unit?84:62)
    shape=<>
      {[0,.25,.5,.75,1].map(f=><g key={f}>
        <line x1={left+width*f} y1={top-8} x2={left+width*f} y2={axisY} stroke="var(--ig-line)" strokeDasharray="4 4"/>
        <text className="svg-label svg-label--axis" x={left+width*f} y={axisY+32} textAnchor="middle" fontSize="24" fill="#555">{number.format(v.max*f)}</text>
      </g>)}
      {rows.map(({item,y,h},i)=>{
        const valueWidth=Math.max(0,item.value/v.max*width),labelH=svgTextHeight(item.label,labelWidth,26)
        const valueNearRight=valueWidth>width-75
        return <g key={item.label}>
          <Label text={item.label} x={left-20} y={y+(h-labelH)/2+26} width={labelWidth} size={26} kind="title" anchor="end"/>
          <rect x={left} y={y+(h-46)/2} width={valueWidth} height="46" rx="6" fill={palette[i%palette.length]}/>
          <text className="svg-label svg-label--value" x={left+valueWidth+(valueNearRight?-12:12)} y={y+h/2+9} textAnchor={valueNearRight?'end':'start'} fontSize="28" fill={valueNearRight?'white':'#1c1c1c'} fontWeight="800">{number.format(item.value)}</text>
        </g>
      })}
      {v.threshold!==undefined&&<g>
        <line x1={left+v.threshold/v.max*width} y1={top-8} x2={left+v.threshold/v.max*width} y2={axisY} stroke="#1c1c1c" strokeWidth="2" strokeDasharray="7 5"/>
        <text className="svg-label svg-label--axis" x={Math.min(760,left+v.threshold/v.max*width+10)} y="26" fontSize="23" fill="#1c1c1c">Критерий: {number.format(v.threshold)} {v.unit}</text>
      </g>}
      {v.unit&&<text className="svg-label svg-label--axis" x="1016" y={H-10} textAnchor="end" fontSize="23" fill="#555">{v.unit}</text>}
    </>
  }

  return <figure className={`infographic infographic-${v.type}`} tabIndex={0} aria-label={`Схема: ${v.caption}`}>
    <svg className="infographic-svg" role="img" aria-label={v.caption} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="var(--ig-muted)"/></marker></defs>
      {shape||<ExtendedInfographic visual={v} marker={marker} base={base}/>}
    </svg>
    <figcaption>{v.caption}</figcaption>
  </figure>
}
