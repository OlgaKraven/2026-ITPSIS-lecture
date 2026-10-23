import {expect,test} from '@playwright/test'
import type {Page} from '@playwright/test'
import {readFileSync} from 'node:fs'
type Operation=string|{id:string;input:number}
type State=Record<string,string|number|boolean>
type Route={actions:Operation[];expect:State}
type Fault={path:Operation[];expect:State;recover:Operation[];after:State}
const fixtures:{id:string;happy:Route;faults:Fault[]}[]=JSON.parse(readFileSync('authoring/scenarios/student-routes.json','utf8'))
async function walk(page:Page,actions:Operation[]){for(const action of actions){
 const id=typeof action==='string'?action:action.id,operation=page.locator(`[data-operation="${id}"]`)
 if(typeof action!=='string')await operation.locator('input').fill(String(action.input))
 await operation.getByRole('button').click()
}}
async function stateIs(page:Page,expected:State){for(const [key,value]of Object.entries(expected))await expect(page.locator(`[data-field="${key}"]`)).toHaveAttribute('data-value',String(value))}
async function probe(page:Page,result:string){await page.getByRole('button',{name:'Выполнить контрольный прогон',exact:true}).click();await expect(page.locator('.sim-result')).toHaveAttribute('data-result',result)}
async function reset(page:Page){await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Сбросить кейс',exact:true}).click()}
async function world(page:Page){return page.locator('[data-field]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.getAttribute('data-field'),n.getAttribute('data-value')])))}

for(const fixture of fixtures)test(`student: ${fixture.id} — healthy, two failures, compensation and reload`,async({page})=>{
 test.setTimeout(90000)
 await page.goto('./?mode=case&case='+fixture.id)
 await expect(page.locator('[data-scene]')).toBeVisible()
 await expect(page.locator('.case-solution')).toHaveCount(0)
 await probe(page,'broken')
 await walk(page,fixture.happy.actions);await stateIs(page,fixture.happy.expect);await probe(page,'ready')
 const healthy=await world(page),healthyScene=await page.locator('[data-scene]').innerText()
 await page.reload();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','ready');expect(await world(page)).toEqual(healthy)
 for(const fault of fixture.faults){
  await reset(page);await walk(page,fault.path);await stateIs(page,fault.expect);await probe(page,'broken')
  const broken=await world(page),scene=await page.locator('[data-scene]').innerText()
  expect(broken).not.toEqual(healthy);expect(scene).not.toBe(healthyScene)
  await page.getByRole('button',{name:'Открыть разбор механизма',exact:true}).click();expect(await world(page)).toEqual(broken)
  await page.reload();await expect(page.locator('.sim-result')).toHaveAttribute('data-result','broken');expect(await world(page)).toEqual(broken)
  await walk(page,fault.recover);await stateIs(page,fault.after);await probe(page,'ready')
  expect(await world(page)).not.toEqual(broken)
  await page.locator('.sim-log summary').click();await expect(page.locator('.sim-log li')).toHaveCount(fault.path.length+fault.recover.length)
 }
})

test('compatibility changes request execution and recovery action availability',async({page})=>{
 await page.goto('./?mode=case&case=s07-08-update-regulation-Q01-case')
 await expect(page.locator('[data-operation="client4"]')).toHaveCount(0)
 await walk(page,['client5','test']);await stateIs(page,{api:4,client:5,service:'отказ: несовместимый API',tested:false})
 await expect(page.locator('[data-operation="client4"]')).toBeVisible()
 await expect(page.locator('[data-scene]')).toContainText('Клиент 5 не может работать с API 4')
 await walk(page,['api5','test']);await stateIs(page,{service:'работают',tested:false,bridge:false})
 await walk(page,['client4','manifest','bridge','client5','test']);await probe(page,'ready')
})

test('keyboard, light and dark themes, narrow screens, reduced motion and reset cancellation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./?mode=case&case=s07-02-support-levels-Q05-case')
 for(const width of [320,390,1024]){await page.setViewportSize({width,height:900});await expect(page.locator('.sim-state')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 const operation=page.locator('[data-operation="incident"] button');await operation.focus();await page.keyboard.press('Enter');await stateIs(page,{queue:'инциденты'})
 await page.getByRole('button',{name:'Тёмная тема',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Продолжить работу',exact:true}).click();await stateIs(page,{queue:'инциденты'})
 await reset(page);await stateIs(page,{queue:'не назначен'});await expect(page.locator('.sim-log li')).toHaveCount(0)
 await expect(page.locator('.case-study textarea')).toHaveCount(0)
})
