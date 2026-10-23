import {test,expect} from '@playwright/test'
import {readFileSync} from 'node:fs'
import type {Course} from '../src/engine/model'
const course:Course=JSON.parse(readFileSync('public/course.json','utf8'))
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
