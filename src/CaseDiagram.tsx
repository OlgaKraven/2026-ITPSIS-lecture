export function CaseDiagram({id,focus,reveal=false}:{id:string;focus:number;reveal?:boolean}){
 if(id==='s07-10-backup-restore-Q02-case'){
  // One common, linear time scale: 13:30–14:00, 20 screen units per minute.
  return <figure className="case-calculation" tabIndex={0} role="region" aria-label="Временная шкала; доступна горизонтальная прокрутка"><svg viewBox="0 0 760 180" role="img" aria-label={reveal?'От подтверждённой копии 13:32 до отказа 14:00 — 28 минут. RPO допускает 20 минут.':'Пригодная точка 13:32, отказ 14:00, цель RPO 20 минут. Сравните интервал с целью.'}>
   <line x1="70" x2="670" y1="75" y2="75" stroke="currentColor" strokeWidth="2"/>
   <rect x="270" y="95" width="400" height="16" fill="#b6b6be"/><text x="470" y="140" textAnchor="middle">Допустимая потеря: 20 минут</text>
   <rect x="110" y="45" width="560" height="16" fill="#cb2823" opacity={focus?1:.35}/><text x="390" y="30" textAnchor="middle">{reveal?'Фактический интервал: 28 минут':'Определите интервал от точки до отказа'}</text>
   <line x1="110" x2="110" y1="65" y2="85" stroke="currentColor"/><text x="110" y="105" textAnchor="middle">13:32</text><text x="670" y="105" textAnchor="end">14:00</text>
  </svg><figcaption>Учебные данные. Масштаб линейный: 20 минут соответствуют 400 единицам шкалы. До проверки выберите, удовлетворяет ли точка восстановления цели. На узком экране шкалу можно прокрутить горизонтально.</figcaption></figure>
 }
 if(id==='s07-10-backup-restore-Q03-case'){
  const data=[{title:'Подготовка',minutes:15},{title:'Восстановление',minutes:30},{title:'Проверка услуги',minutes:20}];let cursor=70
  if(!reveal)return <figure className="case-calculation" tabIndex={0} role="region" aria-label="Исходные длительности последовательных этапов"><svg viewBox="0 0 800 180" role="img" aria-label="Подготовка 15 минут, восстановление 30, проверка 20. Самостоятельно рассчитайте полный маршрут.">
   {data.map((d,i)=><g key={d.title}><rect x={20+i*260} y="35" width="240" height="100" rx="8" fill="none" stroke="currentColor"/><text x={140+i*260} y="72" textAnchor="middle">{d.title}</text><text x={140+i*260} y="108" textAnchor="middle">{d.minutes} минут</text></g>)}
  </svg><figcaption>Три последовательных этапа. Самостоятельно рассчитайте общую длительность и сравните с целью 60 минут. Полная шкала появится в разборе после попытки.</figcaption></figure>

  return <figure className="case-calculation" tabIndex={0} role="region" aria-label="Временная шкала; доступна горизонтальная прокрутка"><svg viewBox="0 0 800 210" role="img" aria-label="Последовательный маршрут восстановления: 15, 30 и 20 минут. Цель RTO — 60 минут.">
   {data.map((d,i)=>{const x=cursor;cursor+=d.minutes*9;return <g key={d.title}><rect x={x} y="55" width={d.minutes*9} height="45" fill={i===(focus-1)?'#cb2823':'#777780'} opacity={focus&&i!==(focus-1)?.5:1}/><text x={x+d.minutes*4.5} y="40" textAnchor="middle">{d.minutes} мин</text><text x={x+d.minutes*4.5} y={i===0?125:145} textAnchor="middle">{d.title}</text></g>})}
   {[0,15,45,60,65].map(m=><g key={m}><line x1={70+m*9} x2={70+m*9} y1="155" y2="165" stroke="currentColor"/><text x={70+m*9} y="188" textAnchor="middle">{m}</text></g>)}
   <line x1="610" x2="610" y1="50" y2="165" stroke="#cb2823" strokeDasharray="5 4"/><text x="610" y="18" textAnchor="middle">RTO 60 мин</text>
  </svg><figcaption>Шкала — минуты от начала восстановления. В данном случае этапы последовательны; длина каждого интервала пропорциональна длительности. На узком экране шкалу можно прокрутить горизонтально.</figcaption></figure>
 }
 return null
}
