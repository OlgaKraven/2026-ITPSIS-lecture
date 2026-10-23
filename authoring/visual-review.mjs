export function applyVisualReview(course){
 const flow=(li,q)=>course.lectures[li].slides.find(s=>s.id.endsWith(`Q${String(q).padStart(2,'0')}-flow`));
 flow(0,4).visual.display='stateTracks';
 const duration=(li,q,model)=>{const s=flow(li,q),old=s.visual||s;s.visual={type:'duration',columns:old.columns,rows:old.rows,caption:old.caption||`${old.rows[1][1]} ${old.rows[2][1]}`,...model};delete s.rows;delete s.columns;s.kind='process';};
 duration(2,5,{segments:[{title:'До принятия специалистом',value:7}],unit:'мин',max:7,ticks:[{value:0,label:'10:14'},{value:7,label:'10:21'}],axisLabel:'Время одного окна обслуживания · реакция: 7 минут'});
 duration(2,6,{segments:[{title:'До запуска обработчиков',value:5},{title:'До успешной заявки',value:5}],unit:'мин',max:10,ticks:[{value:0,label:'10:14'},{value:5,label:'10:19'},{value:10,label:'10:24'}],axisLabel:'Время одного окна обслуживания · восстановление: 10 минут'});
 duration(7,7,{segments:[{title:'Возврат',value:12},{title:'Проверка',value:5},{title:'Запас',value:3}],unit:'мин',max:20,ticks:[{value:0,label:'20:40'},{value:12,label:'20:52'},{value:17,label:'20:57'},{value:20,label:'21:00'}],axisLabel:'Крайний старт возврата → конец согласованного окна'});
 duration(9,2,{segments:[{title:'От подтверждённой копии до отказа',value:5}],unit:'ч',max:5,threshold:{value:4,label:'RPO: не более 4 ч'},ticks:[{value:0,label:'07:00'},{value:2,label:'09:00'},{value:4,label:'11:00'},{value:5,label:'12:00'}],axisLabel:'Возраст восстанавливаемой точки · 5 − 4 = 1 час сверх цели'});
 duration(9,3,{segments:[{title:'Решение',value:20},{title:'Восстановление',value:95},{title:'Проверка услуги',value:20}],unit:'мин',max:135,threshold:{value:120,label:'RTO: 120 мин'},ticks:[{value:0,label:'0'},{value:20,label:'20'},{value:60,label:'60'},{value:115,label:'115'},{value:135,label:'135'}],axisLabel:'Минуты от начала нарушения · 135 − 120 = 15 минут сверх цели'});
}
