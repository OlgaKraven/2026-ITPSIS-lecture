import { createRoot } from 'react-dom/client'
import { LectureSite, validateCourse } from '@olgakraven/lecture-engine'
import '@olgakraven/lecture-engine/style.css'

async function start() {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}course.json`)
  if (!response.ok) throw Error('Не удалось загрузить курс')
  const course = await response.json()
  validateCourse(course)
  const url = new URL(location.href)
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
  createRoot(document.getElementById('root')!).render(<LectureSite course={course} base={base} />)
}
start().catch(error => { document.getElementById('root')!.textContent = String(error) })
