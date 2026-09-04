import { expect, test } from '@playwright/test'
import { course, topics } from '../src/data/courseData'

test('catalog contains approved topics and semester filters', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('./')
  await expect(page.locator('.topic-card')).toHaveCount(topics.length)
  for (const semester of course.semesters) {
    await page.getByRole('button', { name: `${semester} семестр` }).click()
    await expect(page.locator('.topic-card')).toHaveCount(topics.filter((topic) => topic.semester === semester).length)
  }
  await expect(page.locator('.brand-lockup img')).toHaveJSProperty('complete', true)
  await expect(page.locator('.hero-mascot img')).toHaveJSProperty('complete', true)
  await expect(page.getByRole('heading', { name: 'Подготовьте титульный лист и лекции' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Скачать лекции в PDF' }).getByRole('link')).toHaveCount(3)
  expect(errors).toEqual([])
})

test('responsive catalog has no horizontal overflow at required sizes', async ({ page }) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('./')
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(sizes.scroll, `overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(sizes.client)
    await expect(page.getByRole('button', { name: 'Открыть' }).first()).toBeVisible()
  }
})

test('direct links, keyboard navigation and final screen work', async ({ page }) => {
  await page.goto(`./?topic=${topics[0].id}&slide=1`)
  await expect(page.locator('.slide-counter')).toHaveText('1 / 85')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.slide-counter')).toHaveText('2 / 85')
  await page.goto(`./?topic=${topics[0].id}&slide=85`)
  await expect(page.getByRole('heading', { name: `Вопросы по теме «${topics[0].displayTitle}»` })).toBeVisible()
  await expect(page.locator('.mascot-mask img').first()).toHaveJSProperty('complete', true)
})

test('every approved topic opens directly with exactly 85 screens', async ({ page }) => {
  for (const topic of topics) {
    await page.goto(`./?topic=${topic.id}&slide=1`)
    await expect(page.locator('.slide-counter'), topic.id).toHaveText('1 / 85')
    await expect(page.getByRole('heading', { name: topic.displayTitle })).toBeVisible()
    await expect(page.locator('.active-slide')).not.toContainText('0 ч')
    await expect(page.locator('.active-slide')).not.toContainText('компетенции:')
    await expect(page.getByRole('button', { name: 'Сохранить в PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Печать для студента' })).toHaveCount(0)
  }
})

test('long topic titles fit the title slide without an inner scrollbar', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  for (const topic of topics) {
    await page.goto(`./?topic=${topic.id}&slide=1`)
    const titleCopy = page.locator('.active-slide .kind-title .slide-copy')
    const sizes = await titleCopy.evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }))
    expect(sizes.scrollHeight, topic.displayTitle).toBeLessThanOrEqual(sizes.clientHeight + 1)
  }
})

test('invalid topic and slide recover without runtime crash', async ({ page }) => {
  await page.goto('./?topic=does-not-exist&slide=900')
  await expect(page.getByRole('status')).toContainText('не найдена')
  await expect(page.locator('.topic-card')).toHaveCount(topics.length)
})

test('materials QR and printable route are complete', async ({ page }) => {
  await page.goto(`./?topic=${topics[0].id}&slide=5`)
  await expect(page.getByAltText('QR-код: материалы МДК.06.02')).toHaveJSProperty('complete', true)
  await expect(page.getByRole('link', { name: course.materialsUrl })).toHaveAttribute('href', course.materialsUrl)

  await page.goto(`./?topic=${topics[0].id}&slide=3`)
  await expect(page.getByAltText('QR-код: Программное обеспечение управления проектами')).toHaveJSProperty('complete', true)
  await expect(page.getByAltText('QR-код: Архитектура вычислительных систем и компьютерных сетей')).toHaveJSProperty('complete', true)

  await page.goto(`./print?topic=${topics[0].id}&variant=teacher`)
  await page.waitForFunction(() => document.body.dataset.printReady === 'true')
  await expect(page.locator('.print-page')).toHaveCount(85)
  await expect(page.locator('.print-page').nth(84).getByRole('heading', { name: `Вопросы по теме «${topics[0].displayTitle}»` })).toBeVisible()
})

test('print slides keep their content inside the page at presentation size', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  for (const topic of topics) {
    await page.goto(`./print?topic=${topic.id}&variant=student`)
    await page.waitForFunction(() => document.body.dataset.printReady === 'true')
    const problems = await page.locator('.print-page').evaluateAll((pages) => pages.flatMap((page, index) => {
      const copy = page.querySelector<HTMLElement>('.slide-copy')
      const footer = page.querySelector<HTMLElement>('.slide-footer')
      if (!copy || !footer) return [{ slide: index + 1, reason: 'missing layout region', title: '' }]
      const copyRect = copy.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()
      const reasons = [
        copy.scrollHeight > copy.clientHeight + 1 ? 'vertical text overflow' : '',
        copy.scrollWidth > copy.clientWidth + 1 ? 'horizontal text overflow' : '',
        copyRect.bottom > footerRect.top + 1 ? 'footer overlap' : '',
      ].filter(Boolean)
      return reasons.map((reason) => ({
        slide: index + 1,
        reason,
        title: page.querySelector('h2')?.textContent ?? '',
        copyHeight: `${copy.clientHeight}/${copy.scrollHeight}`,
      }))
    }))
    expect(problems, topic.id).toEqual([])
  }
})

test('semester PDF route combines all lectures from the selected semester', async ({ page }) => {
  const semester = 8
  const semesterTopics = topics.filter((topic) => topic.semester === semester)
  await page.goto(`./print?scope=semester-${semester}&variant=student`)
  await page.waitForFunction(() => document.body.dataset.printReady === 'true')
  await expect(page.locator('.print-page')).toHaveCount(semesterTopics.length * 85)
})
