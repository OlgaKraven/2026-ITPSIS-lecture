import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import lifecycle from '../authoring/scenarios/lifecycle.mjs';
import levels from '../authoring/scenarios/levels.mjs';
import sla from '../authoring/scenarios/sla.mjs';
import tickets from '../authoring/scenarios/tickets.mjs';
import reproduction from '../authoring/scenarios/reproduction.mjs';
import update from '../authoring/scenarios/update.mjs';
import backup from '../authoring/scenarios/backup.mjs';
import escalation from '../authoring/scenarios/escalation.mjs';
import knowledge from '../authoring/scenarios/knowledge.mjs';
import changes from '../authoring/scenarios/changes.mjs';
import failure from '../authoring/scenarios/failure.mjs';
import evidence from '../authoring/scenarios/evidence.mjs';
import layers from '../authoring/scenarios/layers.mjs';
import postmortem from '../authoring/scenarios/postmortem.mjs';
import hardware from '../authoring/scenarios/hardware.mjs';
export const authored=[...lifecycle,...levels,...sla,...tickets,...reproduction,...escalation,...knowledge,...update,...changes,...backup,...failure,...evidence,...layers,...postmortem,...hardware];
function validate(scenario,test){
 const fail=message=>{throw Error(scenario.id+': '+message)};
 const keys=new Set(Object.keys(scenario.initial));
 const visit=expression=>{
  if(typeof expression!=='object'||expression===null){if(typeof expression==='number'&&!Number.isFinite(expression))fail('Non-finite value');return}
  if('ref' in expression){if(!keys.has(expression.ref))fail('Unknown state field '+expression.ref);return}
  if('input' in expression)return;
  if(!['eq','ne','and','or','not','add','sub','mul','div','min','max','gt','gte','lt','lte','if'].includes(expression.op)||!Array.isArray(expression.args))fail('Invalid expression');
  expression.args.forEach(visit);
 };
 if(!scenario.actions.length||!scenario.checks.length||!scenario.rules.length||!scenario.debrief)fail('Incomplete scenario');
 if(scenario.fields.length!==keys.size||new Set(scenario.fields.map(f=>f.key)).size!==keys.size)fail('State fields must all be visible');
 if(scenario.scenes.at(-1)?.when!==true)fail('No default scene');
 Object.values(scenario.computed).forEach(visit);
 for(const action of scenario.actions){
  if(action.visible!==undefined)visit(action.visible);if(action.requires!==undefined)visit(action.requires);
  if(action.outcomes.at(-1)?.when!==true)fail('No fallback outcome '+action.id);
  for(const outcome of action.outcomes){visit(outcome.when);for(const [key,value]of Object.entries(outcome.set)){if(!keys.has(key)||key in scenario.computed)fail('Cannot assign '+key);visit(value)}}
 }
 scenario.scenes.forEach(s=>visit(s.when));scenario.checks.forEach(c=>visit(c.when));
 const ids=new Set(scenario.actions.map(a=>a.id));if(ids.size!==scenario.actions.length)fail('Duplicate action ID');
 if(test.faults.length<2)fail('Need two independently specified error routes');
 for(const path of [test.happy.actions,...test.faults.flatMap(f=>[f.path,f.recover])])for(const step of path)if(!ids.has(typeof step==='string'?step:step.id))fail('Unknown route action');
}
export async function compileScenarios(){
 if(authored.length!==120||new Set(authored.map(a=>a.scenario.id)).size!==120)throw Error('Exactly 120 distinct scenarios required');
 await mkdir('public/scenarios',{recursive:true});
 const fixtures=[];
 for(const {scenario,test}of authored){
  validate(scenario,test);
  const activity=JSON.parse(await readFile(`public/activities/${scenario.id}.json`,'utf8'));
  const result={...scenario,title:activity.title,condition:activity.condition};
  await writeFile(`public/scenarios/${scenario.id}.json`,JSON.stringify(result,null,2)+'\n');
  fixtures.push({id:scenario.id,...test});
 }
 await writeFile('authoring/scenarios/student-routes.json',JSON.stringify(fixtures,null,2)+'\n');
 console.log(`Compiled ${authored.length} operational scenarios.`);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await compileScenarios();
