import {readFileSync,readdirSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import {actionEnabled,availableActions,completed,currentScene,newSimulation,persistSimulation,restoreSimulation,runAction} from '../src/caseSimulation'
import type {Scenario,Simulation,World} from '../src/caseSimulation'
import {diagramSteps} from '../src/engine/DiagramPlayer'
type Operation=string|{id:string;input:number}
type Route={actions:Operation[];expect:World}
type Fault={path:Operation[];expect:World;recover:Operation[];after:World}
const fixtures: {id:string;happy:Route;faults:Fault[]}[]=JSON.parse(readFileSync('authoring/scenarios/student-routes.json','utf8'))
const scenarios=fixtures.map(f=>JSON.parse(readFileSync(`public/scenarios/${f.id}.json`,'utf8')) as Scenario)
function walk(model:Scenario,from:Simulation,operations:Operation[]){let state=from;for(const operation of operations){const id=typeof operation==='string'?operation:operation.id,input=typeof operation==='string'?undefined:operation.input;const next=runAction(model,state,id,input);expect(next,`${model.id}: unavailable ${id}`).not.toBe(state);state=next}return state}
describe('domain operations, observable consequences and compensation',()=>{
 it('covers every published case without an adapter to quiz grading',()=>{
  expect(scenarios).toHaveLength(120)
  expect(new Set(scenarios.map(s=>s.id)).size).toBe(120)
  expect(readdirSync('public/activities').filter(p=>p.endsWith('.json')).sort()).toEqual(scenarios.map(s=>s.id+'.json').sort())
  expect(readFileSync('src/caseSimulation.ts','utf8')).not.toMatch(/gradeStep|solution|usable|stale/)
 })
 for(const [i,model]of scenarios.entries()){
  const fixture=fixtures[i]
  it(`${model.id}: correct operations reach the stated physical result`,()=>{
   const initial=newSimulation(model);expect(completed(model,initial.world)).toBe(false)
   const healthy=walk(model,initial,fixture.happy.actions)
   expect(healthy.world).toMatchObject(fixture.happy.expect);expect(completed(model,healthy.world)).toBe(true)
  })
  for(const [j,fault]of fixture.faults.entries())it(`${model.id}: student error ${j+1} changes the situation; compensation restores the goal`,()=>{
   const initial=newSimulation(model),broken=walk(model,initial,fault.path)
   expect(broken.world).toMatchObject(fault.expect);expect(completed(model,broken.world)).toBe(false)
   expect(broken.events.some(e=>e.changes.length>0)).toBe(true)
   expect(currentScene(model,broken.world)).not.toBe(currentScene(model,walk(model,newSimulation(model),fixture.happy.actions).world))
   const reloaded=restoreSimulation(model,JSON.parse(JSON.stringify(persistSimulation(model,broken))))
   expect(reloaded.world).toEqual(broken.world)
   const repaired=walk(model,reloaded,fault.recover)
   expect(repaired.world).toMatchObject(fault.after);expect(completed(model,repaired.world)).toBe(true)
   expect(repaired.events.slice(0,broken.events.length)).toEqual(broken.events)
   expect(restoreSimulation(model,persistSimulation(model,repaired)).world).toEqual(repaired.world)
  })
  it(`${model.id}: disabled and unknown operations cannot mutate state; stored world is replayed`,()=>{
   const initial=newSimulation(model)
   expect(runAction(model,initial,'not-an-operation')).toBe(initial)
   for(const action of availableActions(model,initial.world))if(!actionEnabled(action,initial.world))expect(runAction(model,initial,action.id)).toBe(initial)
   expect(restoreSimulation(model,{...persistSimulation(model,initial),world:{forged:true}}).world).toEqual(initial.world)
  })
 }
 it('keeps infographic timing proportional to the represented process',()=>{
  const steps=diagramSteps({id:'time-example',kind:'process',title:'Время',kicker:'',visual:{type:'duration',segments:[{title:'A',value:2},{title:'B',value:4}],unit:'с',max:6,ticks:[],rows:[],columns:[],axisLabel:'время',caption:'Длительности'}})
  expect(steps[1].duration/steps[0].duration).toBe(2)
  expect(steps.map(s=>s.time)).toEqual([2,6])
 })
})
