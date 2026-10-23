import type {Course} from './engine'
type StorageAccess=Pick<Storage,'getItem'|'setItem'>
// The baseline test proves that these task IDs and keys are unchanged.
export function migrateCompatibleProgress(course:Course,base:string,storage:StorageAccess){
 const prefix=`lecture:${base}:${course.id}`,previousVersions=['2026-10-23-itpsis-7','2026-10-23-itpsis-6','2026-10-23-itpsis-5','2026-09-12-itil-4']
 for(const previous of previousVersions){
  if(course.contentVersion===previous)continue
  const parse=(key:string)=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}}
  for(const l of course.lectures){
   const target=`${prefix}:${course.contentVersion}:${l.id}:progress`
   if(storage.getItem(target)!==null)continue
   const saved=parse(`${prefix}:${previous}:${l.id}:progress`)
   const id=typeof saved==='string'?(course.slideAliases?.[saved]||saved):saved
   if(typeof id==='string'&&l.slides.some(s=>s.id===id))storage.setItem(target,JSON.stringify(id))
  }
  const target=`${prefix}:${course.contentVersion}:attempts`
  if(storage.getItem(target)!==null)continue
  const old=parse(`${prefix}:${previous}:attempts`)
  if(!old||typeof old!=='object'||Array.isArray(old))continue
  const ids=new Set(course.lectures.flatMap(l=>l.slides.flatMap(s=>s.task?[s.task.id]:[])))
  const entries=Object.entries(old).filter(([id,a])=>ids.has(id)&&a&&typeof a==='object'&&!Array.isArray(a))
  storage.setItem(target,JSON.stringify(Object.fromEntries(entries)))
 }
}
