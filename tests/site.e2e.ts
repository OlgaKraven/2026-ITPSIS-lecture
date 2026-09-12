import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Course } from '@olgakraven/lecture-engine'
const course: Course = JSON.parse(readFileSync('public/course.json', 'utf8'))
const bank = JSON.parse(readFileSync('public/assessment.json', 'utf8'))

test('catalog, preserved topics, search and semester filters', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.topic-card')).toHaveCount(15)
  for (const semester of course.semesters) {
    await page.getByRole('button', { name: `${semester} семестр`, exact: true }).click()
    await expect(page.locator('.topic-card')).toHaveCount(semester === 7 ? 10 : 5)
  }
  await page.getByRole('button', { name: 'Все темы', exact: true }).click()
  await page.getByRole('textbox', { name: 'Поиск по темам' }).fill('резервного')
  await expect(page.locator('.topic-card')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Материалы', exact: true })).toHaveAttribute('href', course.materialsUrl)
})

test('responsive catalog and slides fit wide, laptop and mobile screens', async ({ page }) => {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport)
    await page.goto('./')
    await expect(page.locator('.topic-card')).toHaveCount(15)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    const lecture = course.lectures[0]
    for (const kind of ['title', 'theory', 'notebook', 'process', 'test']) {
      const slide = lecture.slides.find(s => s.kind === kind)!
      await page.goto(`./?lecture=${lecture.id}&slide=${slide.id}`)
      await expect(page.locator('.active-slide .slide-frame')).toHaveAttribute('data-slide-id', slide.id)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    }
  }
})

test('legacy links, keyboard navigation, stable IDs and end navigation', async ({ page }) => {
  const l = course.lectures[0]
  await page.goto(`./?topic=${l.id}&slide=1`)
  await expect(page.locator('.slide-counter')).toHaveText(`1 / ${l.slides.length}`)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.slide-counter')).toHaveText(`2 / ${l.slides.length}`)
  await page.reload()
  await expect(page.locator('.slide-counter')).toHaveText(`2 / ${l.slides.length}`)
  await page.keyboard.press('End')
  await expect(page.getByRole('button', { name: 'Вперёд', exact: true })).toBeDisabled()
  await page.goto('./?topic=unknown&slide=900')
  await expect(page.locator('.notice')).toContainText('Лекция не найдена')
  await expect(page.locator('.topic-card')).toHaveCount(15)
})

test('all print pages fit their regions and have no private notes or attempts', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1600, height: 900 })
  for (const l of course.lectures) {
    await page.goto(`./?mode=print&scope=${l.id}`)
    await expect(page.locator('.print-page')).toHaveCount(l.slides.length)
    await page.evaluate(() => document.fonts.ready)
    const problems = await page.locator('.slide-frame').evaluateAll(nodes => nodes.flatMap(e => {
      const bad = [...e.querySelectorAll<HTMLElement>('.slide-copy,.slide-content,.public-task,td')].filter(x => x.scrollHeight > x.clientHeight + 3 || x.scrollWidth > x.clientWidth + 3).map(x => ({ id: e.getAttribute('data-slide-id'), type: x.className }))
      for (const svg of e.querySelectorAll('svg')) for (const text of svg.querySelectorAll('text')) {
        const r = text.getBBox(), b = svg.viewBox.baseVal
        if (r.x < -2 || r.y < -2 || r.x + r.width > b.width + 2 || r.y + r.height > b.height + 2 || (svg.closest('.infographic-process') && r.y > 150 && r.y + r.height > 307)) bad.push({ id: e.getAttribute('data-slide-id'), type: 'svg-text' })
      }
      return bad
    }))
    expect(problems, l.id).toEqual([])
    await expect(page.locator('.interactive-task,.note-reader,.task-status')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('ITPSIS_PRIVATE_SCRIPT_20260912')
  }
})

test('four assessment types, empty attempt, retry and restoration', async ({ page }) => {
  const l = course.lectures[0]
  for (const s of l.slides.filter(s => s.task).slice(0, 4)) {
    const t = s.task!, key = bank.keys[t.id]
    await page.goto(`./?lecture=${l.id}&slide=${s.id}`)
    await page.getByRole('button', { name: 'Проверить', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ещё попытка', exact: true })).toHaveCount(0)
    if (t.type === 'single' || t.type === 'multiple') {
      for (const id of key.correct) await page.locator('.choice-grid label').filter({ hasText: t.options!.find(o => o.id === id)!.text }).locator('input').check()
    } else if (t.type === 'short') await page.locator('.short-field input').fill(key.accepted[0])
    else for (const [i, item] of t.items!.entries()) await page.locator('.matching-fields select').nth(i).selectOption(key.pairs[item.id])
    await page.getByRole('button', { name: 'Проверить', exact: true }).click()
    await expect(page.locator('.task-status')).toContainText('Правильно')
    await page.reload()
    await expect(page.locator('.task-status')).toContainText('Правильно')
    await page.getByRole('button', { name: 'Ещё попытка', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Проверить', exact: true })).toBeVisible()
  }
})

test('two windows, independent preview, black screen and audience privacy', async ({ page }) => {
  const l = course.lectures[0]
  await page.goto(`./?lecture=${l.id}&slide=${l.slides[0].id}`)
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Начать занятие в двух окнах', exact: true }).click()
  const audience = await popup
  await expect(audience.locator('.slide-frame')).toHaveAttribute('data-slide-id', l.slides[0].id)
  await page.getByRole('button', { name: 'Вперёд', exact: true }).click()
  await expect(audience.locator('.slide-frame')).toHaveAttribute('data-slide-id', l.slides[1].id)
  await page.locator('.toc-list button').nth(4).click()
  await expect(audience.locator('.slide-frame')).toHaveAttribute('data-slide-id', l.slides[1].id)
  await page.getByRole('button', { name: 'Показать аудитории', exact: true }).click()
  await expect(audience.locator('.slide-frame')).toHaveAttribute('data-slide-id', l.slides[4].id)
  await page.getByRole('button', { name: 'Чёрный экран', exact: true }).click()
  await expect(audience.locator('.black-screen')).toBeVisible()
  await page.getByRole('button', { name: 'Вернуть слайд', exact: true }).click()
  await audience.reload()
  await expect(audience.locator('.slide-frame')).toHaveAttribute('data-slide-id', l.slides[4].id)
  const resources = await audience.evaluate(() => performance.getEntriesByType('resource').map(e => e.name))
  expect(resources.some(url => url.includes('assessment.json') || url.includes('teacher-pack'))).toBe(false)
})
