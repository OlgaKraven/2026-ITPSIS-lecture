export const ref=key=>({ref:key});
const op=(name,...args)=>({op:name,args});
export const eq=(key,value)=>op('eq',ref(key),value),ne=(key,value)=>op('ne',ref(key),value);
export const and=(...args)=>op('and',...args),or=(...args)=>op('or',...args),not=x=>op('not',x);
export const add=(...args)=>op('add',...args),sub=(a,b)=>op('sub',a,b),mul=(a,b)=>op('mul',a,b),div=(a,b)=>op('div',a,b);
export const max=(...args)=>op('max',...args),min=(...args)=>op('min',...args),gt=(key,x)=>op('gt',ref(key),x),gte=(key,x)=>op('gte',ref(key),x),lt=(key,x)=>op('lt',ref(key),x),lte=(key,x)=>op('lte',ref(key),x),iff=(c,a,b)=>op('if',c,a,b);
export const input={input:true};
export const outcome=(when,set,text)=>({when,set,text});
export const action=(id,label,set,text,options={})=>({id,label,...options,outcomes:[outcome(true,set,text)]});
export const branch=(id,label,outcomes,options={})=>({id,label,...options,outcomes});
export const scene=(when,text)=>({when,text}),check=scene;
export const need=(requires,blocked)=>({requires,blocked});
export const show=visible=>({visible});
export function define(id,config){
 const {state,computed={},...rest}=config;
 return {id,revision:2,initial:Object.fromEntries(Object.entries(state).map(([k,v])=>[k,v[1]])),fields:Object.entries(state).map(([key,v])=>({key,label:v[0],...v[2]?{unit:v[2]}:{}})),computed,...rest};
}
export const route=(actions,expect)=>({actions,expect});
export const fault=(path,expect,recover,after={})=>({path,expect,recover,after});
export function pack(lectureId,entries){return entries.map((config,i)=>{
 const {happy,faults,...body}=config;
 return {scenario:define(`${lectureId}-Q${String(i+1).padStart(2,'0')}-case`,{lectureId,questionId:`${lectureId}-Q${String(i+1).padStart(2,'0')}`,...body}),test:{happy,faults}};
})}
