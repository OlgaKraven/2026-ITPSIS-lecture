import type { SourceRecord } from '../types'
import { laboratories, topics } from './courseData'

const checkedAt = '2026-09-04'

const coreSources: SourceRecord[] = [
  {
    id: 'rpd-itpsis-text', title: 'Исходный текст МДК.06.02 «Инженерно-техническая поддержка сопровождения информационных систем»', type: 'rpd',
    purpose: 'Названия семестровых блоков, темы, лабораторные работы и самостоятельная работа', location: 'PROMPT.md', localCopy: 'PROMPT.md',
    version: 'текст, предоставленный пользователем', checkedAt, official: true,
    publication: 'Публикуются структурированные выдержки; отсутствующие часы, баллы и компетенции не добавляются.', usedIn: ['все презентации курса'],
  },
  {
    id: 'itpsis-materials', title: 'Папка материалов МДК.06.02', type: 'materials', purpose: 'Экран 05 и QR-код',
    location: 'https://disk.yandex.ru/d/jfdIENXO7WUADQ', localCopy: 'public/qr/itpsis-materials.png', version: 'ссылка предоставлена пользователем', checkedAt,
    official: false, publication: 'Публикуются ссылка и QR-код.', usedIn: ['экран 05 всех презентаций'],
  },
  {
    id: 'lit-main-01', title: 'Алексахин А. Н., Владыко И. Ю., Сибирская Е. В. Программное обеспечение управления проектами. 2025', type: 'book', purpose: 'Основная литература',
    location: 'https://www.iprbookshop.ru/books/156717/details', localCopy: 'public/qr/lit-main-01.png', version: '2025', checkedAt, official: true,
    publication: 'Публикуются библиографическое описание, ссылка и QR-код.', usedIn: ['экран 03 всех презентаций'],
  },
  {
    id: 'lit-main-02', title: 'Архитектура вычислительных систем и компьютерных сетей. 2025', type: 'book', purpose: 'Основная литература',
    location: 'https://www.iprbookshop.ru/books/156708/details', localCopy: 'public/qr/lit-main-02.png', version: '2025', checkedAt, official: true,
    publication: 'Публикуются библиографическое описание, ссылка и QR-код.', usedIn: ['экран 03 всех презентаций'],
  },
  {
    id: 'okfks-rhino', title: 'Маскот — специалист инженерно-технической поддержки', type: 'brand', purpose: 'Каталог, титульные экраны и финал',
    location: 'public/brand/mascot/okfks-rhino.png', localCopy: 'public/brand/mascot/okfks-rhino.png', version: 'фирменный ресурс шаблона', checkedAt,
    official: true, publication: 'Публикуется как элемент оформления курса.', usedIn: ['каталог', 'титульные и финальные экраны'],
  },
  {
    id: 'synergy-logo', title: 'Фирменный знак Университета «Синергия»', type: 'brand', purpose: 'Шапка, QR-коды и титульные экраны',
    location: 'public/brand/synergy-logo.png', localCopy: 'public/brand/synergy-logo.png', version: 'фирменный ресурс шаблона', checkedAt,
    official: true, publication: 'Публикуется как элемент оформления курса.', usedIn: ['все экраны'],
  },
]

const labSources: SourceRecord[] = laboratories.map((lab) => {
  const semester = lab.topicId.startsWith('s07') ? 7 : 8
  return {
    id: `lab-s${semester}-${String(lab.number).padStart(2, '0')}`,
    title: `Лабораторная работа № ${lab.number}. ${lab.title}`,
    type: 'laboratory',
    purpose: `Лабораторный маршрут ${semester}-го семестра`,
    location: 'PROMPT.md',
    localCopy: 'PROMPT.md',
    version: 'название предоставлено пользователем; часы и баллы не указаны',
    checkedAt,
    official: true,
    publication: 'Публикуется название без придуманных часов и баллов.',
    usedIn: topics.filter((topic) => topic.semester === semester).map((topic) => topic.id),
  }
})

export const sourceRegistry: SourceRecord[] = [...coreSources, ...labSources]

export const getSource = (id: string) => sourceRegistry.find((source) => source.id === id)
