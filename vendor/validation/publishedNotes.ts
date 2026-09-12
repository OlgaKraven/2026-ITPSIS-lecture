import type {Course,Lecture,Note,TeacherPack} from './model.ts'
import {emptyNote} from './model.ts'

const fields=['script','preparation','notebook','questions','answer'] as const
export function validatePublishedNotes(value:unknown,course:Course,lecture:Lecture):TeacherPack {
 const pack=value as TeacherPack
 if(!pack||pack.schemaVersion!==1||pack.courseId!==course.id||pack.contentVersion!==course.contentVersion||!pack.notes||typeof pack.notes!=='object')throw Error('Заметки относятся к другому курсу или версии')
 const ids=new Set(lecture.slides.map(s=>s.id))
 if(Object.keys(pack.notes).length!==ids.size)throw Error('Комплект заметок лекции неполон')
 for(const [id,n] of Object.entries(pack.notes))if(!ids.has(id)||!n||!fields.every(k=>typeof n[k]==='string'&&n[k].trim())||!Number.isFinite(n.estimatedSeconds)||n.estimatedSeconds<=0)throw Error('Некорректная или пустая заметка')
 return pack
}
export function mergeNotes(published:Record<string,Note>,legacy:Record<string,Note>,edits:Record<string,Partial<Note>>):Record<string,Note>{
 const ids=new Set([...Object.keys(published),...Object.keys(legacy),...Object.keys(edits)])
 return Object.fromEntries([...ids].map(id=>{
  // Пустые вкладки старого импортированного комплекта дополняются из опубликованного.
  const prior=Object.fromEntries(Object.entries(legacy[id]||{}).filter(([,v])=>typeof v==='number'||typeof v==='string'&&v.trim()))
  // Явные новые правки, включая очищенное поле, имеют приоритет.
  return [id,{...emptyNote(),...published[id],...prior,...edits[id]}]
 }))
}
