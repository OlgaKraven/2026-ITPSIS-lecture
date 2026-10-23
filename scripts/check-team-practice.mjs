import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
import {gradeStep,initialAnswer,passedPrefix,editAnswer,restoreDraft,validOrder} from '../src/teamPractice.ts';
const course=JSON.parse(await readFile('public/course.json','utf8'));const map=[];let checks=0;const types={};const signatures=new Set();
const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(rest=>[x,...rest])):[[]];
const product=(options,count)=>count?product(options,count-1).flatMap(p=>options.map(x=>[...p,x])):[[]];
function expected(s){if(s.type==='numeric')return String(s.value);if(s.type==='code')return s.accepted[0];if(s.type==='single')return s.solution[0];if(s.type==='matching')return Object.fromEntries(s.items.map((x,i)=>[x.id,s.solution[i]]));return s.solution;}
for(const l of course.lectures)for(const passport of l.slides.filter(s=>s.supplement)){
 const a=JSON.parse(await readFile('public/activities/'+passport.id.replace(/-passport$/,'-case')+'.json','utf8'));assert.equal(a.revision,5);assert.equal(a.steps.length,3);assert.equal(a.questionId+'-passport',passport.id);const signature=JSON.stringify(a.steps.map(s=>[s.prompt,s.explanation]));assert.ok(!signatures.has(signature));signatures.add(signature);
 const draft={cursor:0,steps:{},revealed:false};
 for(const [i,s]of a.steps.entries()){
  assert.ok(s.title&&s.prompt&&s.hint&&s.explanation,s.id);assert.notEqual(s.hint,s.explanation,s.id);assert.ok(!/[0-9]/.test(s.hint),s.id+' hint includes a literal number');types[s.type]=(types[s.type]||0)+1;
  if(s.choices){assert.equal(new Set(s.choices.map(x=>x.text)).size,s.choices.length);assert.ok(s.solution.every(id=>s.choices.some(x=>x.id===id)));}
  if(s.type==='single')assert.ok(s.choices.length>=3);if(s.type==='multiple')assert.ok(s.solution.length>=2&&s.solution.length<s.choices.length);
  const right=expected(s);assert.equal(gradeStep(s,right).status,'correct',s.id);checks++;
  let candidates=[];
  if(s.type==='single')candidates=['',...s.choices.map(x=>x.id)];
  if(s.type==='multiple')candidates=Array.from({length:2**s.choices.length},(_,mask)=>s.choices.filter((_,j)=>mask&(1<<j)).map(x=>x.id));
  if(s.type==='matching')candidates=[{},...product(s.choices.map(x=>x.id),s.items.length).map(values=>Object.fromEntries(s.items.map((x,j)=>[x.id,values[j]])))];
  if(s.type==='order'){assert.notEqual(gradeStep(s,initialAnswer(s)).status,'correct',s.id+' initial order leaks answer');candidates=permutations(s.items.map(x=>x.id));}
  if(s.type==='numeric')candidates=['','   ','not a number',String(s.value+1),String(s.value-1),String(s.value),String(s.value).replace('.',',')];
  if(s.type==='code')candidates=['','incorrect',...s.accepted];
  for(const value of candidates){const g=gradeStep(s,value);if(g.status==='correct'){if(s.type==='matching')assert.deepEqual(value,right);else if(s.type==='multiple')assert.deepEqual([...value].sort(),[...right].sort());else if(s.type==='order')assert.ok(validOrder(s,value));else if(s.type==='single')assert.deepEqual(value,right);else if(s.type==='numeric')assert.equal(Number(value.replace(',','.')),s.value);else assert.ok(s.accepted.map(x=>x.toLowerCase()).includes(value.toLowerCase()));}checks++;}
  draft.steps[s.id]={answer:right,checked:true,attempts:1};assert.equal(passedPrefix(a,draft),i+1);checks++;
 }
 draft.cursor=3;draft.revealed=true;const edited=editAnswer(a,draft,0,initialAnswer(a.steps[0]));assert.equal(passedPrefix(a,edited),0);assert.equal(edited.revealed,false);assert.ok(a.steps.every(s=>edited.steps[s.id].checked===false));const restored=restoreDraft(a,edited);assert.ok(restored.cursor<=1);checks+=4;
 map.push({lectureId:l.id,activityId:a.id,title:a.title,condition:a.condition,steps:a.steps.map(s=>({id:s.id,title:s.title,type:s.type,prompt:s.prompt,hint:s.hint,data:s.data,before:s.before,explanation:s.explanation}))});
}
assert.equal(map.length,120);assert.equal(map.reduce((n,a)=>n+a.steps.length,0),360);
const result={contentVersion:course.contentVersion,status:'passed',activities:map.length,steps:360,types,gradingChecks:checks,review:map};await writeFile('reports/team-practice-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,review:undefined},null,2));
