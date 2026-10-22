import { createRoot } from 'react-dom/client'
import { LectureSite, validateCourse } from './engine'
import {CourseCatalog} from './CourseCatalog'
import './presentation-design.css'
import './typography.css'
import {migrateCompatibleProgress} from './compatibility'

async function start() {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}course.json`)
  if (!response.ok) throw Error('Не удалось загрузить курс')
  const course = await response.json()
  validateCourse(course)
  const url = new URL(location.href)
  if(!['audience','print'].includes(url.searchParams.get('mode')||'')){
    try{migrateCompatibleProgress(course,base,localStorage)}catch{console.warn('Сохранённые данные остались в предыдущей редакции; браузер не разрешил перенос.')}
  }
  if(url.searchParams.get('mode')==='case'){const {CaseStudy}=await import('./CaseStudy');createRoot(document.getElementById('root')!).render(<CaseStudy course={course} base={base}/>);return}
  // Ссылки прежнего проигрывателя сохраняют учебный объект через карту переноса.
  const oldTopic = url.searchParams.get('topic')
  if (oldTopic) {
    const mapResponse = await fetch(`${base}legacy-links.json`)
    if (!mapResponse.ok) throw Error('Не удалось загрузить карту прежних ссылок')
    const map = await mapResponse.json()
    const oldNumber = url.searchParams.get('slide') || '1'
    url.searchParams.set('lecture', oldTopic)
    url.searchParams.set('slide', map[oldTopic]?.[oldNumber] || '')
    url.searchParams.delete('topic')
  }
  if (url.pathname.replace(/\/$/, '').endsWith('/print')) {
    url.pathname = base
    url.searchParams.set('mode', 'print')
    if (oldTopic) url.searchParams.set('scope', oldTopic)
  }
  history.replaceState(null, '', url)
  document.title = `${course.code} · ${course.discipline}`
  createRoot(document.getElementById('root')!).render(<LectureSite course={course} base={base} renderCatalog={props=><CourseCatalog {...props}/>} />)
}
start().catch(error => { document.getElementById('root')!.textContent = String(error) })
