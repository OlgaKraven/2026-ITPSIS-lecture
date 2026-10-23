import {expect,test} from '@playwright/test'
import type {Page} from '@playwright/test'
import {readFileSync} from 'node:fs'
import type {PracticeStep,StepAnswer,TeamActivity} from '../src/teamPractice'
const course=JSON.parse(readFileSync('public/course.json','utf8'))
function activity(id:string):TeamActivity{return JSON.parse(readFileSync(`public/activities/${id}.json`,'utf8'))}
function correct(s:PracticeStep):StepAnswer{if(s.type==='numeric')return String(s.value);if(s.type==='code')return s.accepted![0];if(s.type==='single')return s.solution![0];if(s.type==='matching')return Object.fromEntries(s.items!.map((x,i)=>[x.id,s.solution![i]]));return s.solution!}
function incorrect(s:PracticeStep):StepAnswer{if(s.type==='numeric')return String(s.value!+1);if(s.type==='code')return 'incorrect';if(s.type==='single')return s.choices!.find(c=>c.id!==s.solution![0])!.id;if(s.type==='multiple')return [s.solution![0]];if(s.type==='order')return [...s.solution!].reverse();return Object.fromEntries(s.items!.map((x,i)=>[x.id,s.choices!.find(c=>c.id!==s.solution![i])!.id]))}
async function fill(page:Page,s:PracticeStep,value:StepAnswer){
 if(s.type==='numeric'||s.type==='code'){await page.locator('.team-value input').fill(value as string);return}
 if(s.type==='single'){await page.locator(`.team-choices input[value="${value}"]`).check();return}
 if(s.type==='multiple'){for(const c of s.choices!)await page.locator(`.team-choices input[value="${c.id}"]`).setChecked((value as string[]).includes(c.id));return}
 if(s.type==='matching'){for(const [i,item]of s.items!.entries())await page.locator('.team-matching select').nth(i).selectOption((value as Record<string,string>)[item.id]);return}
 for(const [i,id]of (value as string[]).entries()){
  let ids=await page.locator('.team-order li').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-item-id')))
  while(ids.indexOf(id)>i){await page.locator(`.team-order li[data-item-id="${id}"]`).getByRole('button',{name:/Выше:/}).click();ids=await page.locator('.team-order li').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-item-id')))}
 }
}
async function solve(page:Page,a:TeamActivity){
 await page.getByRole('button',{name:'Начать решение',exact:true}).click()
 for(const [i,s]of a.steps.entries()){
  await expect(page.locator('.team-current')).toHaveAttribute('data-step-id',s.id)
  await fill(page,s,correct(s));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-feedback')).toContainText('Шаг выполнен верно')
  if(i<a.steps.length-1)await page.getByRole('button',{name:'Следующий шаг',exact:true}).click()
 }
}
for(const l of course.lectures)test(`all 8 team cases: ${l.id}; every step rejects errors and checks the team answer`,async({page})=>{
 test.setTimeout(180000)
 for(const p of l.slides.filter(s=>s.supplement)){
  const a=activity(p.id.replace(/-passport$/,'-case'))
  await page.goto(`./?mode=case&case=${a.id}`)
  await expect(page.locator('.team-progress')).toContainText('Шаг 0 / 3');await expect(page.locator('.case-study textarea')).toHaveCount(0);await expect(page.locator('.team-current')).toHaveCount(0)
  await page.getByRole('button',{name:'Начать решение',exact:true}).click()
  for(const [i,s]of a.steps.entries()){
   await expect(page.locator('.team-current')).toHaveAttribute('data-step-id',s.id)
   if(i<2)await expect(page.getByRole('button',{name:'Следующий шаг',exact:true})).toBeDisabled()
   await fill(page,s,incorrect(s));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-feedback')).toHaveClass(/incorrect/)
   await expect(page.locator('.team-complete')).toHaveCount(0);await page.getByRole('button',{name:'Подсказка к шагу',exact:true}).click();await expect(page.locator('.team-hint')).toHaveText(s.hint)
   await expect(page.locator('.team-hint')).not.toContainText(s.explanation)
   await fill(page,s,correct(s));await expect(page.locator('.team-hint')).toHaveCount(0)
   await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-feedback')).toHaveClass(/\bcorrect\b/);await expect(page.locator('.team-feedback')).toContainText(s.explanation)
   if(i<2)await page.getByRole('button',{name:'Следующий шаг',exact:true}).click()
  }
  await expect(page.locator('.team-complete')).toBeVisible();await expect(page.locator('.case-solution')).toHaveCount(0);await page.getByRole('button',{name:'Открыть полный разбор',exact:true}).click();await expect(page.locator('.case-solution')).toContainText(a.explanation)
 }
})
test('early edit revokes later confirmations; reload restores only reachable progress',async({page})=>{
 const a=activity('s07-10-backup-restore-Q03-case');await page.goto('./?mode=case&case='+a.id);await solve(page,a);await page.getByRole('button',{name:'Открыть полный разбор',exact:true}).click();await expect(page.locator('.case-solution')).toBeVisible();await page.reload();await expect(page.locator('.team-complete')).toBeVisible()
 await page.getByRole('button',{name:'Назад',exact:true}).click();await page.getByRole('button',{name:'Назад',exact:true}).click();await fill(page,a.steps[0],incorrect(a.steps[0]));await expect(page.locator('.team-complete')).toHaveCount(0);await expect(page.locator('.case-solution')).toHaveCount(0);await expect(page.getByRole('button',{name:'Следующий шаг',exact:true})).toBeDisabled();await page.reload();await expect(page.locator('.team-progress')).toContainText('Проверено: 0 / 3')
 await fill(page,a.steps[0],correct(a.steps[0]));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();await expect(page.getByRole('button',{name:'Следующий шаг',exact:true})).toBeDisabled()
})
test('numeric zero, empty input, reset, themes, keyboard and narrow view retain the step contract',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const width of [320,390,1024]){
  await page.setViewportSize({width,height:900});await page.goto('./?mode=case&case=s08-02-error-collection-Q06-case');await expect(page.locator('.team-overview')).toBeVisible();await page.waitForTimeout(100);await expect(page.locator('.team-progress')).toContainText('Шаг 0');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
 }
 const a=activity('s08-02-error-collection-Q06-case');await page.getByRole('button',{name:'Начать решение',exact:true}).click();await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-feedback')).toContainText('Введите');await expect(page.getByRole('button',{name:'Следующий шаг',exact:true})).toBeDisabled()
 await fill(page,a.steps[0],correct(a.steps[0]));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();await fill(page,a.steps[1],'0');await page.locator('.team-value input').press('Enter');await expect(page.locator('.team-feedback')).toContainText('Шаг выполнен верно')
 await page.getByRole('button',{name:'Тёмная тема',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Сбросить решение',exact:true}).click();await expect(page.locator('.team-progress')).toContainText('Шаг 0');await expect(page.locator('.team-progress')).toContainText('Проверено: 0 / 3')
})

test('team controls have readable text contrast in both themes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./?mode=case&case=s07-01-support-lifecycle-Q01-case');await page.getByRole('button',{name:'Начать решение',exact:true}).click()
 for(const theme of ['light','dark']){
  if(theme==='dark')await page.getByRole('button',{name:'Тёмная тема',exact:true}).click()
  await expect.poll(()=>page.locator('.team-practice .button:not(:disabled)').evaluateAll(nodes=>{
   const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number)
   const lum=(values:number[])=>values.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0)
   return nodes.flatMap(e=>{const s=getComputedStyle(e),a=lum(rgb(s.color)),b=lum(rgb(s.backgroundColor)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);return ratio<4.5?[{text:e.textContent,ratio}]:[]})
  })).toEqual([])
 }
})

test('previous data and the actual team answers remain available without reopening a solved step',async({page})=>{
 const a=activity('s07-08-update-regulation-Q01-case');await page.goto('./?mode=case&case='+a.id);await page.getByRole('button',{name:'Начать решение',exact:true}).click()
 for(const s of a.steps.slice(0,2)){await fill(page,s,correct(s));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click()}
 await page.locator('.team-history summary').click();await expect(page.locator('.team-history')).toContainText(a.steps[1].prompt);await expect(page.locator('.team-history')).toContainText('Ответ команды:');await expect(page.locator('.team-current')).toHaveAttribute('data-step-id',a.steps[2].id)
})
test('an alternate independent experiment order is accepted; hint gives method rather than solved order',async({page})=>{
 const a=activity('s07-05-reproduction-Q02-case');await page.goto('./?mode=case&case='+a.id);await page.getByRole('button',{name:'Начать решение',exact:true}).click()
 for(const s of a.steps.slice(0,2)){await fill(page,s,correct(s));await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click()}
 await fill(page,a.steps[2],['item-1','item-0','item-2']);await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-complete')).toBeVisible()
})
test('deduplication data and rounded mean can be solved without a numerical answer in the hint',async({page})=>{
 const a=activity('s08-04-postmortem-Q06-case');await page.goto('./?mode=case&case='+a.id);await page.getByRole('button',{name:'Начать решение',exact:true}).click();await expect(page.locator('.team-data tbody tr')).toHaveCount(4)
 await page.locator('.team-value input').fill('4');await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Подсказка к шагу',exact:true}).click();await expect(page.locator('.team-hint')).toHaveText(a.steps[0].hint);await expect(page.locator('.team-hint')).not.toContainText('3')
 await page.locator('.team-value input').fill('3');await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();await page.locator('.team-history summary').click();await expect(page.locator('.team-history .team-data tbody tr')).toHaveCount(4);await page.locator('.team-value input').fill('3,33');await page.getByRole('button',{name:'Проверить шаг',exact:true}).click();await expect(page.locator('.team-feedback')).toContainText('Шаг выполнен верно')
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await expect(page.locator('.team-progress')).toContainText('Проверено: 2 / 3');await page.getByRole('button',{name:'Продолжить решение',exact:true}).click();await expect(page.locator('.team-progress')).toContainText('Проверено: 2 / 3')
})
