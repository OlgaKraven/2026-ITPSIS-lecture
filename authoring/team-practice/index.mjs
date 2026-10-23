import {hintGroups} from './hints.mjs';
import {reviewTeamPractice} from './student-review.mjs';
import l01 from './01.mjs';import l02 from './02.mjs';import l03 from './03.mjs';import l04 from './04.mjs';import l05 from './05.mjs';import l06 from './06.mjs';import l07 from './07.mjs';import l08 from './08.mjs';import l09 from './09.mjs';import l10 from './10.mjs';import l11 from './11.mjs';import l12 from './12.mjs';import l13 from './13.mjs';import l14 from './14.mjs';import l15 from './15.mjs';
export const teamPractice=reviewTeamPractice([l01,l02,l03,l04,l05,l06,l07,l08,l09,l10,l11,l12,l13,l14,l15]);
function shuffled(items,seed){let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);return items.map((item,i)=>({item,key:Math.imul(n^(i+1),2654435761)>>>0})).sort((a,b)=>a.key-b.key).map(x=>x.item);}
export function buildTeamSteps(li,qi,id){
 return teamPractice[li][qi].map((step,i)=>{
  const result={...step,hint:hintGroups[li][qi][i],id:`${id}-step-${i+1}`};
  if(step.choices){const choices=step.choices.map((text,j)=>({id:`choice-${j}`,text}));result.choices=shuffled(choices,result.id);result.solution=step.solution.map(j=>choices[j].id);}
  if(step.items){const items=step.items.map((text,j)=>({id:`item-${j}`,text}));result.items=step.type==='order'?shuffled(items,result.id):items;if(step.type==='order'){result.solution=items.map(x=>x.id);if(step.before)result.before=step.before.map(([a,b])=>[items[a].id,items[b].id]);if(result.items.every((item,j)=>item.id===result.solution[j]))result.items=[...result.items.slice(1),result.items[0]];}}
  if(result.before&&result.before.every(([a,b])=>result.items.findIndex(x=>x.id===a)<result.items.findIndex(x=>x.id===b)))result.items.reverse();
  return result;
 });
}
