import {expect,test} from '@playwright/test'
import type {Page} from '@playwright/test'
import {readFileSync} from 'node:fs'
import type {PracticeStep,StepAnswer,TeamActivity} from '../src/teamPractice'
const course=JSON.parse(readFileSync('public/course.json','utf8'))
const activity=(id:string):TeamActivity=>JSON.parse(readFileSync(`public/activities/${id}.json`,'utf8'))
function value(s:PracticeStep):StepAnswer{if(s.type==='numeric')return String(s.value);if(s.type==='code')return s.accepted![0];if(s.type==='single')return s.solution![0];if(s.type==='matching')return Object.fromEntries(s.items!.map((x,i)=>[x.id,s.solution![i]]));return s.solution!}
async function execute(page:Page,s:PracticeStep,answer:StepAnswer=value(s)){
 if(s.type==='single'){await page.locator(`[data-action-id="${answer}"]`).click();return}
 if(s.type==='order'){for(const id of answer as string[])await page.locator(`[data-action-id="${id}"]`).click();return}
 if(s.type==='numeric'||s.type==='code')await page.locator('.team-value input').fill(answer as string)
 if(s.type==='multiple')for(const c of s.choices!)await page.locator(`.sim-package input[value="${c.id}"]`).setChecked((answer as string[]).includes(c.id))
 if(s.type==='matching')for(const [i,item]of s.items!.entries())await page.locator('.team-matching select').nth(i).selectOption((answer as Record<string,string>)[item.id]||'')
 await page.locator('.team-current form button[type=submit]').click()
}
async function stage(page:Page,i:number){await page.locator('.sim-stages button').nth(i).click()}
for(const l of course.lectures)test(`all 8 executable cases: ${l.id}`,async({page})=>{
 test.setTimeout(180000)
 for(const p of l.slides.filter(s=>s.supplement)){
  const a=activity(p.id.replace(/-passport$/,'-case'))
  await page.goto(`./?mode=case&case=${a.id}`)
  await expect(page.locator('.case-solution')).toHaveCount(0)
  await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
  for(const [i,s]of a.steps.entries()){await stage(page,i);await execute(page,s)}
  await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','ready')
  await page.getByRole('button',{name:'Открыть полный разбор',exact:true}).click();await expect(page.locator('.case-solution')).toContainText(a.explanation)
 }
})
test('wrong numerical result flows into later operations; correction requires re-executing dependants after reload',async({page})=>{
 const a=activity('s07-10-backup-restore-Q03-case');await page.goto('./?mode=case&case='+a.id)
 await stage(page,0);await execute(page,a.steps[0],'30');await expect(page.locator('.sim-records article').first()).toContainText('30')
 await expect(page.getByRole('button',{name:'К следующему участку',exact:true})).toBeEnabled()
 for(let i=1;i<3;i++){await stage(page,i);await execute(page,a.steps[i])}
 await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken');await expect(page.locator('.sim-result')).toContainText('RTO')
 await page.reload();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
 await stage(page,0);await execute(page,a.steps[0]);await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken');await expect(page.locator('.sim-result')).toContainText('уже изменённая запись')
 for(let i=1;i<3;i++){await stage(page,i);if(a.steps[i].type==='order')await page.getByRole('button',{name:'Восстановить участок',exact:true}).click();await execute(page,a.steps[i])}
 await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','ready');await page.reload();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','ready')
 await expect(page.locator('.sim-log')).toContainText('Последствие в учебной модели')
})
test('operation before preparation causes persistent damage, and restoring the section allows recovery',async({page})=>{
 const a=activity('s07-06-escalation-Q07-case'),s=a.steps[0];await page.goto('./?mode=case&case='+a.id);await stage(page,0)
 await execute(page,s,[...s.solution!].reverse());await expect(page.locator('.sim-observation')).toContainText('Операция выполнена')
 await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
 await page.getByRole('button',{name:'Восстановить участок',exact:true}).click();await execute(page,s)
 for(let i=1;i<3;i++){await stage(page,i);await execute(page,a.steps[i])}
 await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','ready')
})
test('wrong decision is executed, not rejected by a quiz gate; downstream inputs and history show the branch',async({page})=>{
 const a=activity('s07-02-support-levels-Q05-case');await page.goto('./?mode=case&case='+a.id);await stage(page,0)
 const wrong=a.steps[0].choices!.find(c=>c.id!==a.steps[0].solution![0])!;await execute(page,a.steps[0],wrong.id)
 await expect(page.locator('.sim-records article').first()).toContainText(wrong.text)
 await stage(page,1);await expect(page.locator('.sim-input')).toContainText(wrong.text);await execute(page,a.steps[1]);await expect(page.locator('.sim-observation')).toContainText('Принимающая линия')
 await stage(page,2);await execute(page,a.steps[2]);await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
 await page.getByRole('button',{name:'Открыть полный разбор',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
})
test('partial and empty packages are transmitted and fail the consumer; skipped inputs also break execution',async({page})=>{
 const a=activity('s07-01-support-lifecycle-Q01-case');await page.goto('./?mode=case&case='+a.id);await stage(page,1);await execute(page,a.steps[1],[])
 await expect(page.locator('.sim-records article').nth(1)).toContainText('Сохранено');await stage(page,2);await execute(page,a.steps[2])
 await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken')
})
test('numeric zero, keyboard execution, reset, no personal notes, both themes and narrow screens',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 const a=activity('s08-02-error-collection-Q06-case');await page.goto('./?mode=case&case='+a.id)
 for(const width of [320,390,1024]){await page.setViewportSize({width,height:900});await expect(page.locator('.sim-state')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 await stage(page,0);await execute(page,a.steps[0]);await stage(page,1);await page.locator('.team-value input').fill('0');await page.locator('.team-value input').press('Enter');await expect(page.locator('.sim-records article').nth(1)).toContainText('0')
 await page.getByRole('button',{name:'Тёмная тема',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('.case-study textarea')).toHaveCount(0)
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Продолжить работу',exact:true}).click();await expect(page.locator('.sim-log li')).not.toHaveCount(0)
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Сбросить кейс',exact:true}).click();await expect(page.locator('.sim-log li')).toHaveCount(0);await expect(page.locator('.sim-records')).toContainText('Запись отсутствует')
})
