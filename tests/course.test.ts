import { describe, expect, it } from 'vitest'
import { course, laboratories, semesterWorkloads, topics, validateCourseData } from '../src/data/courseData'
import { buildDeck, countServiceSlides } from '../src/deck/buildDeck'
import { normalizeOrganizationUnit } from '../src/lib/teacherProfile'

describe('teacher profile normalization', () => {
  it.each([
    ['кафедра кафедра Цифровой экономики', 'кафедра Цифровой экономики'],
    ['Лаборатория лаборатория ИИ', 'Лаборатория ИИ'],
    ['лаборатория искусственного интеллекта', 'лаборатория искусственного интеллекта'],
    ['  Кафедра   информационных   систем  ', 'Кафедра информационных систем'],
  ])('normalizes %s', (input, expected) => expect(normalizeOrganizationUnit(input)).toBe(expected))
})

describe('course and deck invariants', () => {
  it('keeps 10 separate presentations in semester 7 and 5 in semester 8', () => {
    expect(validateCourseData()).toBe(true)
    expect(topics).toHaveLength(15)
    expect(topics.filter((topic) => topic.semester === 7)).toHaveLength(10)
    expect(topics.filter((topic) => topic.semester === 8)).toHaveLength(5)
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(15)
    expect(laboratories).toHaveLength(12)
    expect(laboratories.filter((lab) => lab.topicId.startsWith('s07')).map((lab) => lab.number)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(laboratories.filter((lab) => lab.topicId.startsWith('s08')).map((lab) => lab.number)).toEqual([1, 2, 3, 4, 5])
  })

  it('does not invent absent hours, points or competency codes', () => {
    expect(course.totals).toEqual({ lectureHours: 0, laboratoryHours: 0, selfStudyHours: 0, totalHours: 0, finalAssessment: 'зачёт с оценкой' })
    expect(semesterWorkloads.every((item) => item.totalHours === 0)).toBe(true)
    expect(laboratories.every((lab) => lab.hours === 0 && lab.points === 0)).toBe(true)
    topics.forEach((topic) => {
      expect(topic.lectureHours).toBe(0)
      expect(topic.laboratoryHours).toBe(0)
      expect(topic.competencies).toEqual([])
      expect(topic.sourceTitle.length).toBeGreaterThan(30)
      expect(topic.sourceContent.length).toBeGreaterThan(0)
      expect(topic.questions).toHaveLength(8)
    })
  })

  it.each(topics.map((topic) => [topic.id, topic] as const))('builds a coherent 85-screen deck with unique titles for %s', (_id, topic) => {
    const deck = buildDeck(topic, course)
    const visibleText = deck.map((slide) => [slide.kicker, slide.title, slide.body, slide.note, slide.transition, ...(slide.bullets ?? [])].filter(Boolean).join(' ')).join('\n')
    const forbiddenServiceLabels = /^(слайд|новый слайд|раздел|блок|инфографика|визуализация|ключевой вывод|обновлённая версия|актуализировано|комментарий|примечание для дизайнера|вставить изображение|текст для слайда)$/i
    expect(deck).toHaveLength(85)
    expect(countServiceSlides(deck)).toBe(5)
    expect(deck.filter((slide) => ![2, 3, 4, 5, 85].includes(slide.number))).toHaveLength(80)
    expect(deck.filter((slide) => slide.kind === 'divider').map((slide) => slide.number)).toEqual([13, 20, 27, 34, 41, 48, 55, 62])
    expect(new Set(deck.map((slide) => slide.title)).size).toBe(85)
    expect(deck[82].body).toContain('первоначальный ответ')
    expect(deck[84].title).toContain(topic.displayTitle)
    expect(deck.filter((slide) => slide.kind === 'divider').map((slide) => slide.title)).toEqual(topic.questions.map((question) => question.title))
    expect(deck[8].visual?.type).toBe('process')
    expect(deck.filter((slide) => slide.visual).length).toBeGreaterThanOrEqual(2)
    expect(deck.some((slide) => slide.visual?.type === 'bar')).toBe(false)
    expect(deck.some((slide) => `${slide.body ?? ''} ${slide.bullets?.join(' ') ?? ''}`.includes('0 ч'))).toBe(false)
    expect(deck.some((slide) => `${slide.body ?? ''} ${slide.bullets?.join(' ') ?? ''}`.includes('компетенции:'))).toBe(false)
    deck.forEach((slide) => {
      expect(slide.kicker).not.toMatch(forbiddenServiceLabels)
      expect(slide.title).not.toMatch(forbiddenServiceLabels)
    })
    topic.questions.forEach((question) => {
      for (const preservedText of [question.title, question.focus, question.rule, question.example, question.decision, question.pitfall, question.check]) {
        expect(visibleText).toContain(preservedText)
      }
    })
    const narrativeText = deck.flatMap((slide) => [slide.body, slide.note, slide.transition]).filter((text): text is string => Boolean(text))
    expect(new Set(narrativeText).size).toBe(narrativeText.length)
    deck.forEach((slide) => expect(slide.sourceIds.length).toBeGreaterThan(0))
  })
})
