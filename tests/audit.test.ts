import {readFileSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import {reading} from '../authoring/student-reading.mjs'
import {applyStudentCorrections} from '../authoring/student-corrections.mjs'
import {context} from '../authoring/itil-context.mjs'
import {cases} from '../authoring/transfer-cases.mjs'
import {validateCourse} from '../src/engine/model'
import {validatePublishedNotes,mergeNotes} from '../src/engine/publishedNotes'
import type {Course} from '../src/engine/model'
import {migrateCompatibleProgress} from '../src/compatibility'
const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'))
const course:Course=read('public/course.json'),original=read('authoring/original-course.json'),pack=read('authoring/teacher-notes.json')

applyStudentCorrections(original,context)
describe('finished course and independent evidence cases',()=>{
 it('shows each explanation with its rule and each summary decision with its acceptance criterion',()=>{
  for(const [li,l] of course.lectures.entries())for(const [qi,q] of original.topics[li].questions.entries()){
   const id=`${l.id}-Q${String(qi+1).padStart(2,'0')}`
   const theory=l.slides.find(s=>s.id===`${id}-theory`)!
   const term=l.slides.find(s=>s.id===`${id}-term`)!
   const [,,explanation]=context[li].questions[qi]
   expect(pack.notes[theory.id].script).toContain(explanation)
   expect(theory.body).toContain(explanation)
   expect(theory.body).toContain(q.rule)
   expect(term.body).toBe(reading[li][qi].clarification)
   expect(term.body).not.toBe(term.notebook)
   const summary=l.slides.find(s=>s.id===`${l.id}-summary-${qi<4?'a':'b'}`)!
   expect(summary.rows).toHaveLength(4)
   expect(summary.rows![qi%4].every(cell=>cell.trim().length>0)).toBe(true)
   expect(JSON.stringify(l.slides.filter(s=>s.id.startsWith(id)&&!s.task))).toContain(q.check)
  }
 })

 it.each(['2026-09-12-itil-4','2026-10-23-itpsis-5','2026-10-23-itpsis-6','2026-10-23-itpsis-7','2026-10-23-itpsis-8'])('migrates compatible progress and attempts from %s without replacing current data',(previous)=>{
  const l=course.lectures[0],slide=l.slides[4],task=l.slides.find(s=>s.task)!.task!
  const prefix='lecture:/course/:itpsis'
  const values=new Map<string,string>([
   [`${prefix}:${previous}:${l.id}:progress`,JSON.stringify(slide.id)],
   [`${prefix}:${previous}:attempts`,JSON.stringify({[task.id]:{draft:['decision'],attempts:1},unknown:{draft:[]}})],
  ])
  const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)}}
  migrateCompatibleProgress(course,'/course/',storage)
  expect(JSON.parse(values.get(`${prefix}:${course.contentVersion}:${l.id}:progress`)!)).toBe(slide.id)
  expect(Object.keys(JSON.parse(values.get(`${prefix}:${course.contentVersion}:attempts`)!))).toEqual([task.id])
  const current=`${prefix}:${course.contentVersion}:${l.id}:progress`
  values.set(current,JSON.stringify(l.slides[0].id));migrateCompatibleProgress(course,'/course/',storage)
  expect(JSON.parse(values.get(current)!)).toBe(l.slides[0].id)
  expect(values.has(`${prefix}:${previous}:attempts`)).toBe(true)
 })
 it('introduces all matching terms before the student must use them',()=>{
  const norm=(text:string)=>text.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')
  for(const l of course.lectures)for(const [index,s] of l.slides.entries())if(s.task?.type==='matching'){
   const prefix=s.id.replace(/-test-4$/,'-')
   const visible=norm(JSON.stringify(l.slides.slice(0,index).filter(x=>x.id.startsWith(prefix)&&!x.task&&!x.supplement)))
   for(const item of [...(s.task.items||[]),...(s.task.options||[])])expect(visible,`${s.id}: ${item.text}`).toContain(norm(item.text))
  }
 })
 it('keeps a separate worked variation and condition-specific distractor for every independent case',()=>{
  for(const [li,l] of course.lectures.entries())for(let qi=0;qi<8;qi++){
   const prefix=`${l.id}-Q${String(qi+1).padStart(2,'0')}`
   const activity=read(`public/activities/${prefix}-case.json`)
   const flow=l.slides.find(s=>s.id===`${prefix}-flow`)!
   expect(activity.revision).toBe(4)
   expect(activity.steps).toHaveLength(3)
   expect(new Set(activity.steps.map(s=>s.type)).size).toBeGreaterThan(1)
   expect(JSON.stringify(flow)).not.toContain(activity.condition)
   expect(JSON.stringify(flow)).not.toContain(activity.explanation)
   if(flow.rows)expect(flow.rows[0][1]).not.toBe(original.topics[li].questions[qi].example)
  }
 })
 it('validates the exact deployed model and slide-aligned notes',()=>{
  expect(()=>validateCourse(course)).not.toThrow()
  for(const l of course.lectures){
   const part=read(`public/teacher-notes/${l.id}.json`)
   expect(()=>validatePublishedNotes(part,course,l)).not.toThrow()
   expect(part.notes).toEqual(Object.fromEntries(l.slides.map(s=>[s.id,pack.notes[s.id]])))
  }
 })
 it('keeps all 120 questions, stable assessment keys and separate transfer cases',()=>{
  expect(cases.flat()).toHaveLength(120)
  let count=0
  for(const [li,l] of course.lectures.entries())for(const [qi,q] of original.topics[li].questions.entries()){
   const prefix=`${l.id}-Q${String(qi+1).padStart(2,'0')}`
   const passport=l.slides.find(s=>s.id===`${prefix}-passport`)!
   const activity=read(`public/activities/${prefix}-case.json`)
   expect(activity.condition).not.toBe(q.example)
   expect(activity.steps).toHaveLength(3)
   for(const step of activity.steps)if(step.type==='single')expect(step.choices.length).toBeGreaterThanOrEqual(3)
   expect(passport.supplement?.href).toBe(`?mode=case&case=${activity.id}`)
   expect(l.slides.indexOf(passport)+1).toBe(l.slides.findIndex(s=>s.id===`${prefix}-test-1`))
   count++
  }
  expect(count).toBe(120)
 })
 it('retains explicit personal clearing while filling untouched fields',()=>{
  const id=course.lectures[0].slides[0].id,n=pack.notes[id]
  const merged=mergeNotes({[id]:n},{},{[id]:{script:''}})
  expect(merged[id].script).toBe('')
  expect(merged[id].answer).toBe(n.answer)
 })
 it('preserves the full baseline order and unchanged assessment keys',()=>{
  const baseline=read('authoring/audit-baseline.json'),bank=read('public/assessment.json')
  const grading=(keys:Record<string,Record<string,unknown>>)=>Object.fromEntries(Object.entries(keys).map(([id,k])=>[id,Object.fromEntries(Object.entries(k).filter(([field])=>!['explanation','optionExplanations'].includes(field)))]))
  expect(grading(bank.keys)).toEqual(grading(baseline.assessmentKeys))
  for(const l of course.lectures){
   const before=baseline.slides[l.id] as string[]
   expect(l.slides.filter(s=>before.includes(s.id)).map(s=>s.id)).toEqual(before.filter(id=>!id.endsWith('-literature-2')))
  }
 })
})
