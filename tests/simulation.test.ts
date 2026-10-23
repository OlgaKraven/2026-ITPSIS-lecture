import {readFileSync,readdirSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import type {PracticeStep,StepAnswer,TeamActivity} from '../src/teamPractice'
import {caseProfile,clearStage,newSimulation,probeSimulation,recordReady,restoreSimulation,runOperation,runProbe} from '../src/caseSimulation'
import type {Simulation} from '../src/caseSimulation'
import {failureConsequence} from '../src/caseConsequences'
import {diagramSteps} from '../src/engine/DiagramPlayer'
const activities:TeamActivity[]=readdirSync('public/activities').filter(p=>p.endsWith('.json')).map(p=>JSON.parse(readFileSync('public/activities/'+p,'utf8')))
function payload(s:PracticeStep):StepAnswer{if(s.type==='numeric')return String(s.value);if(s.type==='code')return s.accepted![0];if(s.type==='single')return s.solution![0];if(s.type==='matching')return Object.fromEntries(s.items!.map((item,i)=>[item.id,s.solution![i]]));return s.solution!}
function operate(a:TeamActivity,s:Simulation,index:number,correct=true){
 const step=a.steps[index]
 if(step.type==='order'){let next=s;for(const id of correct?step.solution!:[...step.solution!].reverse())next=runOperation(a,next,index,[],id);return next}
 const wrong=step.type==='numeric'?String(step.value!+10):step.type==='code'?'unknown':step.type==='single'?step.choices!.find(c=>c.id!==step.solution![0])!.id:step.type==='matching'?{}:[]
 return runOperation(a,s,index,correct?payload(step):wrong)
}
describe('case execution rather than gated question grading',()=>{
 it('has a concrete consequence and domain model for every one of the 120 cases',()=>{
  expect(activities).toHaveLength(120);expect(new Set(activities.map(failureConsequence)).size).toBe(120)
  for(const a of activities)expect(caseProfile(a).artifact).toBeTruthy()
 })
 it.each(activities.map(a=>[a.id,a] as const))('%s: failures flow downstream; repair needs re-execution, even after reload',(_,a)=>{
  let s=newSimulation()
  expect(probeSimulation(a,s).every(d=>d.status==='missing')).toBe(true)
  s=operate(a,s,0,false)
  expect(s.events.length).toBeGreaterThan(0)
  for(let i=1;i<a.steps.length;i++)s=operate(a,s,i)
  expect(recordReady(a,s,2)).toBe(false)
  expect(probeSimulation(a,s)[0].status).toBe('failed')
  expect(probeSimulation(a,s)[2].status).toBe('stale')
  s=runProbe(a,s);expect(s.events.at(-1)?.operation).toBe('Контрольный прогон')
  s=restoreSimulation(a,JSON.parse(JSON.stringify(s)))
  expect(probeSimulation(a,s)[2].status).toBe('stale')
  s=clearStage(a,s,0);s=operate(a,s,0)
  expect(recordReady(a,s,2)).toBe(false)
  for(let i=1;i<a.steps.length;i++){s=clearStage(a,s,i);s=operate(a,s,i)}
  expect(probeSimulation(a,s).every(d=>d.status==='ready')).toBe(true)
  expect(probeSimulation(a,restoreSimulation(a,JSON.parse(JSON.stringify(s))))).toEqual(probeSimulation(a,s))
 })
 it.each(activities.map(a=>[a.id,a] as const))('%s: every later failure breaks the sink; skipped input cannot be bypassed',(_,a)=>{
  for(let broken=1;broken<a.steps.length;broken++){
   let s=newSimulation();for(let i=0;i<a.steps.length;i++)s=operate(a,s,i,i!==broken)
   expect(recordReady(a,s,2)).toBe(false);expect(probeSimulation(a,s)[broken].status).toBe('failed')
  }
  let s=newSimulation();s=operate(a,s,2);expect(recordReady(a,s,2)).toBe(false)
 })
 it('executing preparation later does not repair an operation already run too early',()=>{
  const a=activities.find(a=>a.steps.some(s=>s.type==='order'))!,i=a.steps.findIndex(s=>s.type==='order'),step=a.steps[i]
  let s=newSimulation();for(let j=0;j<i;j++)s=operate(a,s,j)
  s=runOperation(a,s,i,[],step.solution!.at(-1));expect(s.records[step.id].observation).toContain('до подготовки')
  for(const id of step.solution!.slice(0,-1))s=runOperation(a,s,i,[],id)
  expect(s.records[step.id].usable).toBe(false)
  s=clearStage(a,s,i);s=operate(a,s,i);expect(recordReady(a,s,i)).toBe(true)
 })
 it('incomplete operations and forged local success flags never satisfy consumers',()=>{
  const a=activities.find(a=>a.steps[0].type==='order')!,step=a.steps[0]
  const s=runOperation(a,newSimulation(),0,[],step.solution![0]);expect(recordReady(a,s,0)).toBe(false)
  const wrong=operate(a,clearStage(a,s,0),0,false);wrong.records[step.id].usable=true
  expect(restoreSimulation(a,wrong).records[step.id].usable).toBe(false)
  expect(restoreSimulation(a,{schema:0})).toEqual(newSimulation())
 })
 it('preserves independent valid orderings',()=>{
  const a=activities.find(a=>a.id==='s07-05-reproduction-Q02-case')!;let s=newSimulation();for(let i=0;i<2;i++)s=operate(a,s,i)
  for(const id of ['item-1','item-0','item-2'])s=runOperation(a,s,2,[],id)
  expect(recordReady(a,s,2)).toBe(true)
 })
 it('derives linear animation durations from the model time, not from the event count',()=>{
  const steps=diagramSteps({id:'test',kind:'process',title:'Time',kicker:'',visual:{type:'duration',segments:[{title:'A',value:2},{title:'B',value:4}],unit:'с',max:6,ticks:[],rows:[],columns:[],axisLabel:'time',caption:'test'}})
  expect(steps[1].duration/steps[0].duration).toBe(2);expect(steps.map(s=>s.time)).toEqual([2,6]);expect(steps.reduce((n,s)=>n+s.duration,0)).toBe(8000)
 })
})
