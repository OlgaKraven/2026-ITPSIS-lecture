// Each call authors a concrete operation in a particular educational case.
export const single=(title,prompt,correct,wrong,explanation)=>({type:'single',title,prompt,choices:[correct,...wrong],solution:[0],explanation});
export const multi=(title,prompt,correct,wrong,explanation)=>({type:'multiple',title,prompt,choices:[...correct,...wrong],solution:correct.map((_,i)=>i),explanation});
export const order=(title,prompt,items,explanation)=>({type:'order',title,prompt,items,solution:items.map((_,i)=>i),explanation});
export const match=(title,prompt,pairs,explanation)=>({type:'matching',title,prompt,items:pairs.map(x=>x[0]),choices:[...new Set(pairs.map(x=>x[1]))],solution:pairs.map(x=>[...new Set(pairs.map(x=>x[1]))].indexOf(x[1])),explanation});
export const numeric=(title,prompt,unit,value,explanation)=>({type:'numeric',title,prompt,unit,value,tolerance:0,explanation});
export const code=(title,prompt,accepted,explanation)=>({type:'code',title,prompt,accepted,explanation});
