export type Value = string | number | boolean
export type Expression = Value | {ref:string} | {input:true} | {op:string;args:Expression[]}
export type World = Record<string,Value>
export type Outcome = {when:Expression;set:Record<string,Expression>;text:string}
export type ScenarioAction = {id:string;label:string;visible?:Expression;requires?:Expression;blocked?:string;input?:{label:string;min:number;max:number;unit:string};outcomes:Outcome[]}
export type Scenario = {
 id:string;revision:number;lectureId:string;questionId:string;title:string;condition:string;goal:string;rules:string[]
 initial:World;fields:{key:string;label:string;unit?:string}[];computed:Record<string,Expression>
 actions:ScenarioAction[];scenes:{when:Expression;text:string}[];checks:{when:Expression;text:string}[];debrief:string
}
export type CaseEvent = {action:string;input?:number;label:string;text:string;changes:{key:string;before:Value;after:Value}[]}
export type Simulation = {schema:2;world:World;events:CaseEvent[];revealed:boolean;probe:boolean}

export function evaluate(expression:Expression,world:World,input?:number):Value {
 if(typeof expression!=='object')return expression
 if('ref' in expression){if(!(expression.ref in world))throw Error('Unknown state field: '+expression.ref);return world[expression.ref]}
 if('input' in expression){if(input===undefined)throw Error('Missing operation value');return input}
 const values=expression.args.map(e=>evaluate(e,world,input)),n=(i:number)=>Number(values[i])
 switch(expression.op){
  case 'eq':return values[0]===values[1]
  case 'ne':return values[0]!==values[1]
  case 'and':return values.every(Boolean)
  case 'or':return values.some(Boolean)
  case 'not':return !values[0]
  case 'add':return values.reduce<number>((s,v)=>s+Number(v),0)
  case 'sub':return n(0)-n(1)
  case 'mul':return n(0)*n(1)
  case 'div':return n(1)===0?0:n(0)/n(1)
  case 'max':return Math.max(...values.map(Number))
  case 'min':return Math.min(...values.map(Number))
  case 'gt':return n(0)>n(1)
  case 'gte':return n(0)>=n(1)
  case 'lt':return n(0)<n(1)
  case 'lte':return n(0)<=n(1)
  case 'if':return values[0]?values[1]:values[2]
  default:throw Error('Unknown state expression: '+expression.op)
 }
}
function recompute(scenario:Scenario,world:World):World {
 const next={...world}
 // Computed fields are ordered; later fields may use earlier derived values.
 for(const [key,expression]of Object.entries(scenario.computed))next[key]=evaluate(expression,next)
 return next
}
export function newSimulation(scenario:Scenario):Simulation{return {schema:2,world:recompute(scenario,scenario.initial),events:[],revealed:false,probe:false}}
export function renderText(text:string,world:World){return text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,(_,key)=>typeof world[key]==='boolean'?(world[key]?'да':'нет'):String(world[key]??'—'))}
export function availableActions(scenario:Scenario,world:World){return scenario.actions.filter(a=>a.visible===undefined||!!evaluate(a.visible,world))}
export function actionEnabled(action:ScenarioAction,world:World){return action.requires===undefined||!!evaluate(action.requires,world)}
export function currentScene(scenario:Scenario,world:World){return renderText(scenario.scenes.find(s=>evaluate(s.when,world))?.text||scenario.goal,world)}
export function checks(scenario:Scenario,world:World){return scenario.checks.map(c=>({text:renderText(c.text,world),met:!!evaluate(c.when,world)}))}
export function completed(scenario:Scenario,world:World){return checks(scenario,world).every(c=>c.met)}
export function runAction(scenario:Scenario,simulation:Simulation,id:string,input?:number):Simulation {
 const action=availableActions(scenario,simulation.world).find(a=>a.id===id)
 if(!action||!actionEnabled(action,simulation.world))return simulation
 if(action.input&&(!Number.isFinite(input)||input!<action.input.min||input!>action.input.max))return simulation
 const outcome=action.outcomes.find(o=>!!evaluate(o.when,simulation.world,input))
 if(!outcome)return simulation
 const world={...simulation.world}
 // All assignments in one outcome read the same pre-operation state.
 for(const [key,expression]of Object.entries(outcome.set)){
  if(!(key in scenario.initial)||key in scenario.computed)throw Error('Operation cannot assign field: '+key)
  world[key]=evaluate(expression,simulation.world,input)
 }
 const next=recompute(scenario,world)
 const changes=Object.keys(next).filter(key=>next[key]!==simulation.world[key]).map(key=>({key,before:simulation.world[key],after:next[key]}))
 const event:CaseEvent={action:id,...input===undefined?{}:{input},label:action.label,text:renderText(outcome.text,next),changes}
 return {...simulation,world:next,events:[...simulation.events,event],probe:false}
}
export function persistSimulation(scenario:Scenario,s:Simulation){return {schema:2,revision:scenario.revision,actions:s.events.map(e=>({id:e.action,...e.input===undefined?{}:{input:e.input}})),revealed:s.revealed,probe:s.probe}}
export function restoreSimulation(scenario:Scenario,raw:unknown):Simulation {
 let simulation=newSimulation(scenario)
 if(!raw||typeof raw!=='object')return simulation
 const saved=raw as ReturnType<typeof persistSimulation>
 if(saved.schema!==2||saved.revision!==scenario.revision||!Array.isArray(saved.actions)||saved.actions.length>2000)return simulation
 for(const operation of saved.actions){
  if(!operation||typeof operation.id!=='string'||operation.input!==undefined&&typeof operation.input!=='number')return newSimulation(scenario)
  const next=runAction(scenario,simulation,operation.id,operation.input)
  if(next===simulation)return newSimulation(scenario)
  simulation=next
 }
 return {...simulation,revealed:saved.revealed===true,probe:saved.probe===true}
}
