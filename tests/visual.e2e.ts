import {test,expect} from '@playwright/test'
import {readFileSync} from 'node:fs'
import type {Course} from '../src/engine/model'
const course:Course=JSON.parse(readFileSync('public/course.json','utf8'))

test('local player moves in proportion to time, pauses in place and resumes without skipping the interrupted interval',async({page})=>{
 const id='s07-10-backup-restore-Q03-flow'
 await page.goto(`./?lecture=s07-10-backup-restore&slide=${id}`)
 await page.getByRole('button',{name:'Развернуть схему',exact:true}).click()
 const player=page.locator('.diagram-player'),cursor=player.locator('[data-model-time]')
 await expect(player).toHaveAttribute('data-step','0');await page.waitForTimeout(200);await expect(cursor).toHaveAttribute('data-model-time','0')
 await player.getByRole('button',{name:'Показать',exact:true}).click();await expect.poll(async()=>Number(await cursor.getAttribute('data-model-time'))).toBeGreaterThan(2)
 await player.getByRole('button',{name:'Пауза',exact:true}).click()
 const held=Number(await cursor.getAttribute('data-model-time')),step=await player.getAttribute('data-step')
 await page.waitForTimeout(250);expect(Number(await cursor.getAttribute('data-model-time'))).toBe(held);await expect(player).toHaveAttribute('data-step',step!)
 await player.getByRole('button',{name:'Показать',exact:true}).click();await expect.poll(async()=>Number(await cursor.getAttribute('data-model-time'))).toBeGreaterThan(held)
 await player.getByRole('button',{name:'Пауза',exact:true}).click()
 await page.emulateMedia({reducedMotion:'reduce'});await expect(player.getByRole('button',{name:'Показать',exact:true})).toHaveCount(0)
 await expect.poll(async()=>Number(await cursor.getAttribute('data-model-time'))).toBe([0,20,115,135][Number(await player.getAttribute('data-step'))])
 await expect(player).toHaveAttribute('data-fraction','0.0000');await page.emulateMedia({reducedMotion:'no-preference'})
 await player.getByRole('button',{name:'К началу',exact:true}).click();await expect(cursor).toHaveAttribute('data-model-time','0')
 await player.getByRole('button',{name:'Далее',exact:true}).click();await expect(cursor).toHaveAttribute('data-model-time','20')
 await player.getByRole('button',{name:'Далее',exact:true}).click();await expect(cursor).toHaveAttribute('data-model-time','115')
 await player.getByRole('button',{name:'Назад',exact:true}).click();await expect(cursor).toHaveAttribute('data-model-time','20')
 await player.getByRole('button',{name:'Далее',exact:true}).click();await player.getByRole('button',{name:'Далее',exact:true}).click();await expect(player.getByRole('button',{name:'Повторить',exact:true})).toBeVisible()
 await player.getByRole('button',{name:'Повторить',exact:true}).click();await expect(player.getByRole('button',{name:'Пауза',exact:true})).toBeVisible()
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))})
 await expect(player.getByRole('button',{name:'Показать',exact:true})).toBeVisible();const frozen=await player.getAttribute('data-fraction');await page.waitForTimeout(180);await expect(player).toHaveAttribute('data-fraction',frozen!)
 await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});await expect(player.getByRole('button',{name:'Показать',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();await expect(page.getByRole('button',{name:'Развернуть схему',exact:true})).toBeFocused()
 await page.getByRole('button',{name:'Развернуть схему',exact:true}).click();await expect(player).toHaveAttribute('data-step','0')
})
test('independent tracks reset without carrying execution forward; reduced motion keeps keyboard steps and the print model',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844})
 await page.goto('./?lecture=s07-01-support-lifecycle&slide=s07-01-support-lifecycle-Q04-flow')
 await page.getByRole('button',{name:'Развернуть схему',exact:true}).click();const player=page.locator('.diagram-player')
 await expect(player.getByRole('button',{name:'Показать',exact:true})).toHaveCount(0)
 await player.getByRole('button',{name:'Далее',exact:true}).click();await player.getByRole('button',{name:'Далее',exact:true}).click();await expect(player).toHaveAttribute('data-step','2')
 await player.getByRole('combobox',{name:'Маршрут записи',exact:true}).selectOption('1');await expect(player).toHaveAttribute('data-step','0')
 await player.getByRole('button',{name:'Далее',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(player).toHaveAttribute('data-step','1')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true)
 await page.goto('./?mode=print&scope=s07-01-support-lifecycle');await expect(page.locator('.diagram-player,.diagram-open')).toHaveCount(0);await expect(page.locator('.study-tracks li')).toHaveCount(8)
})
test('presenter controls synchronize diagram steps, cursor and closing to the audience without sending private notes',async({page,context})=>{
 await page.goto('./?lecture=s07-10-backup-restore&slide=s07-10-backup-restore-Q03-flow')
 const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Режим показа',exact:true}).click();const audience=await popup
 await expect(page.locator('.connection')).toContainText('Синхронизировано')
 await page.getByRole('button',{name:'Развернуть схему',exact:true}).click();await expect(audience.locator('.diagram-player')).toHaveAttribute('data-step','0')
 await page.locator('.diagram-player').getByRole('button',{name:'Далее',exact:true}).click();await expect(audience.locator('.diagram-player')).toHaveAttribute('data-step','1');await expect(audience.locator('.diagram-player [data-model-time]')).toHaveAttribute('data-model-time','20')
 await expect(audience.locator('.diagram-controls button')).toHaveCount(0);await expect(audience.locator('.presenter-notes')).toHaveCount(0)
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();await expect(audience.locator('.diagram-player')).toHaveCount(0)
 await page.getByRole('button',{name:'Завершить показ',exact:true}).click()
})
for(const theme of ['light','dark'])test(`instructional figures preserve scale and fit the ${theme} slide`,async({page})=>{
 await page.setViewportSize({width:1440,height:1000})
 await page.addInitScript(theme=>localStorage.setItem('lecture:/2026-ITPSIS-lecture/:itpsis:theme',JSON.stringify(theme)),theme)
 for(const l of course.lectures.filter(l=>l.slides.some(s=>s.visual?.type==='duration'||s.visual?.type==='comparison'&&s.visual.display))){
  await page.goto(`./?mode=print&scope=${l.id}`);await page.locator('.print-page').last().waitFor();await page.evaluate(()=>document.fonts.ready)
  for(const s of l.slides){
   if(s.visual?.type==='duration'){
    const figure=page.locator(`[data-slide-id="${s.id}"] .study-duration`)
    const widths=await figure.locator('rect.study-interval').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width))
    const unit=widths[0]/s.visual.segments[0].value
    s.visual.segments.forEach((segment,i)=>expect(widths[i]/segment.value).toBeCloseTo(unit,4))
    await expect(figure.locator('figcaption')).toHaveText(s.visual.caption)
   }
  }
 }
 const l=course.lectures[1];await page.goto(`./?mode=print&scope=${l.id}`);await page.locator('.print-page').last().waitFor();await page.evaluate(()=>document.fonts.ready)
 expect(await page.locator(`[data-slide-id="${l.id}-summary-b"] .table-scroll`).evaluate(e=>e.scrollHeight-e.clientHeight)).toBeLessThanOrEqual(3)
 const gap=await page.locator(`[data-slide-id="${l.id}-Q01-distinctions"]`).evaluate(e=>e.querySelector('.table-scroll')!.getBoundingClientRect().top-e.querySelector('h2')!.getBoundingClientRect().bottom)
 expect(gap).toBeGreaterThan(10)
})
for(const width of [390,1024])test(`reasoning, contrast, state tracks and duration remain readable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'})
 for(const id of ['s07-01-support-lifecycle-Q01-flow','s07-01-support-lifecycle-Q01-warning','s07-01-support-lifecycle-Q04-flow','s07-10-backup-restore-Q03-flow']){
  const l=course.lectures.find(l=>l.slides.some(s=>s.id===id))!
  await page.goto(`./?lecture=${l.id}&slide=${id}`);const slide=page.locator('.active-slide .slide-frame');await expect(slide).toHaveAttribute('data-slide-id',id);await page.evaluate(()=>document.fonts.ready)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true)
  const small=await slide.locator('.study-reasoning dd,.study-contrast p,.study-tracks li,.study-duration-legend li').evaluateAll(ns=>ns.filter(n=>parseFloat(getComputedStyle(n).fontSize)<17).length)
  expect(small).toBe(0)
 }
})
