import {readFileSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import {cases} from '../authoring/transfer-cases.mjs'
import {validateCourse} from '../src/engine/model'
import {validatePublishedNotes,mergeNotes} from '../src/engine/publishedNotes'
import type {Course} from '../src/engine/model'
import {migrateCompatibleProgress} from '../src/compatibility'
const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'))
const course:Course=read('public/course.json'),original=read('authoring/original-course.json'),pack=read('authoring/teacher-notes.json')

describe('finished course and independent evidence cases',()=>{
 it('migrates compatible progress and attempts without replacing current data',()=>{
  const l=course.lectures[0],slide=l.slides[4],task=l.slides.find(s=>s.task)!.task!
  const prefix='lecture:/course/:itpsis',previous='2026-09-12-itil-4'
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
   expect(activity.observations.join(' ')).toBe(activity.condition)
   expect(activity.options.filter(o=>o.id===activity.correct)).toHaveLength(1)
   expect(new Set(activity.options.map(o=>o.text)).size).toBe(activity.options.length)
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
  expect(bank.keys).toEqual(baseline.assessmentKeys)
  for(const l of course.lectures){
   const before=baseline.slides[l.id] as string[]
   expect(l.slides.filter(s=>before.includes(s.id)).map(s=>s.id)).toEqual(before)
  }
 })
})
