import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
const course=JSON.parse(readFileSync('public/course.json','utf8'))
test('previous edition resumes stable slides and saved task drafts',async({page})=>{
 const l=course.lectures[0],s=l.slides.find(s=>s.task?.type==='single')
 const key=JSON.parse(readFileSync('public/assessment.json','utf8')).keys[s.task.id]
 await page.addInitScript(({lecture,slide,task,correct})=>{
  const prefix='lecture:/2026-ITPSIS-lecture/:itpsis:2026-09-12-itil-4'
  localStorage.setItem(`${prefix}:${lecture}:progress`,JSON.stringify(slide))
  localStorage.setItem(`${prefix}:attempts`,JSON.stringify({[task]:{draft:[correct],attempts:0,seed:1}}))
 },{lecture:l.id,slide:s.id,task:s.task.id,correct:key.correct[0]})
 await page.goto('./')
 await page.locator('.ok-open').first().click()
 await expect(page.locator('.active-slide .slide-frame')).toHaveAttribute('data-slide-id',s.id)
 await expect(page.locator('.choice-grid input:checked')).toHaveCount(1)
 await expect(page.locator('.choice-grid label').filter({hasText:s.task.options.find(o=>o.id===key.correct[0]).text}).locator('input')).toBeChecked()
})

test('catalog view, filters, profile and QR persist accessibly',async({page})=>{
 await page.goto('./')
 await expect(page.locator('.ok-hero h1')).toHaveText(course.discipline)
 await expect(page.locator('.ok-footer')).toHaveCount(0)
 await page.getByRole('button',{name:'8 семестр',exact:true}).click()
 await page.getByRole('button',{name:'Вид: список'}).click()
 await expect(page.locator('.ok-topic')).toHaveCount(5)
 await page.reload()
 await expect(page.getByRole('button',{name:'Вид: список'})).toHaveAttribute('aria-pressed','true')
 await expect(page.locator('.ok-topic')).toHaveCount(5)
 await page.getByLabel('Преподавателю — настройки').click()
 await page.getByLabel('ФИО преподавателя',{exact:true}).fill('Александра Константиновна Преподавательская')
 await page.getByLabel('Должность преподавателя').fill('Старший преподаватель информационных систем')
 await page.getByLabel('Кафедра преподавателя').fill('Кафедра прикладной информатики и информационных систем')
 await page.getByRole('button',{name:'Готово',exact:true}).click()
 await page.getByRole('button',{name:'Материалы — QR-код и ссылка'}).click()
 await expect(page.getByAltText('QR-код для открытия материалов')).toBeVisible()
 await page.keyboard.press('Escape')
 await expect(page.getByRole('button',{name:'Материалы — QR-код и ссылка'})).toBeFocused()
 await page.locator('.ok-open').first().click()
 await expect(page.locator('.title-profile')).toContainText('Преподавательская')
 await expect(page.locator('.title-profile')).toContainText('Кафедра прикладной информатики')
 await page.getByRole('button',{name:'Каталог',exact:true}).click()
 await expect(page.locator('.ok-topic')).toHaveCount(5)
})

test('published notes load only in presenter; explicit local edits survive reload',async({page})=>{
 const l=course.lectures[0],slide=l.slides.find(s=>s.id.endsWith('Q01-term'))
 await page.goto(`./?lecture=${l.id}&slide=${slide.id}`)
 expect((await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).some(x=>x.includes('teacher-notes/'))).toBe(false)
 const popup=page.waitForEvent('popup')
 await page.getByRole('button',{name:'Режим показа',exact:true}).click()
 const audience=await popup
 await expect(page.locator('.notes-load-status')).toContainText('Заметки курса загружены')
 await expect(page.locator('.note-reader')).not.toBeEmpty()
 await page.getByRole('button',{name:'Редактировать',exact:true}).click()
 await page.getByLabel('Редактировать: Сценарий').fill('ЛИЧНОЕ_ОБЪЯСНЕНИЕ_АУДИТ_20261023')
 await page.reload()
 await expect(page.locator('.notes-load-status')).toContainText('Заметки курса загружены')
 await expect(page.locator('.note-reader')).toHaveText('ЛИЧНОЕ_ОБЪЯСНЕНИЕ_АУДИТ_20261023')
 await page.getByRole('tab',{name:'Ответ',exact:true}).click()
 await expect(audience.locator('body')).not.toContainText('ЛИЧНОЕ_ОБЪЯСНЕНИЕ_АУДИТ_20261023')
 const urls=await audience.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))
 expect(urls.some(x=>x.includes('teacher-notes/')||x.includes('assessment.json'))).toBe(false)
 await page.getByRole('button',{name:'Завершить показ',exact:true}).click()
 await expect(page.locator('.active-slide .slide-frame')).toHaveAttribute('data-slide-id',slide.id)
 await expect(audience.locator('.black-screen')).toBeVisible()
 await expect(audience.locator('.slide-frame')).toHaveCount(0)
})

test('pointer and theme synchronize; audience explanation requires an explicit command',async({page})=>{
 const l=course.lectures[0],s=l.slides.find(s=>s.task?.type==='single')
 const bank=JSON.parse(readFileSync('public/assessment.json','utf8'))
 await page.goto(`./?lecture=${l.id}&slide=${s.id}`)
 const popup=page.waitForEvent('popup')
 await page.getByRole('button',{name:'Режим показа',exact:true}).click()
 const audience=await popup
 await expect(page.locator('.notes-load-status')).toContainText('Синхронизировано')
 await page.getByRole('button',{name:'Указка',exact:true}).click()
 const box=await page.locator('.mini-stage').boundingBox()
 await page.mouse.move(box!.x+box!.width*.4,box!.y+box!.height*.35)
 await expect(audience.locator('.laser-pointer')).toBeVisible()
 await page.getByLabel('Ещё',{exact:true}).click()
 await page.getByLabel('Тема презентации').selectOption('dark')
 await expect(audience.locator('html')).toHaveAttribute('data-theme','dark')
 await page.getByLabel('Ещё',{exact:true}).click()
 const correct=bank.keys[s.task.id].correct[0]
 await page.locator('.choice-grid label').filter({hasText:s.task.options.find(o=>o.id===correct).text}).locator('input').check()
 await page.getByRole('button',{name:'Проверить',exact:true}).click()
 await expect(audience.locator('.task-status')).toContainText('Правильно')
 await expect(audience.locator('.audience-answer')).toHaveCount(0)
 await page.getByRole('tab',{name:'Ответ',exact:true}).click()
 await expect(audience.locator('.audience-answer')).toHaveCount(0)
 await page.getByRole('button',{name:'Разбор ответа',exact:true}).click()
 await expect(audience.locator('.audience-answer')).toContainText(bank.keys[s.task.id].explanation)
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click()
 await expect(audience.locator('.audience-answer')).toHaveCount(0)
 await page.getByRole('button',{name:'Завершить показ',exact:true}).click()
})

test('table text remains readable against every row in light and dark themes',async({page})=>{
 await page.goto('./?mode=print&scope='+course.lectures[0].id)
 await expect(page.locator('.print-page')).toHaveCount(course.lectures[0].slides.length)
 for(const theme of ['light','dark']){
  const failures=await page.evaluate(theme=>{
   document.documentElement.dataset.theme=theme
   const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number)
   const luminance=(c:number[])=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
   return [...document.querySelectorAll('.comparison-table td,.comparison-table th')].flatMap(cell=>{
    let node:Element|null=cell,bg=''
    while(node){const value=getComputedStyle(node).backgroundColor;if(value!=='transparent'&&value!=='rgba(0, 0, 0, 0)'){bg=value;break}node=node.parentElement}
    const a=luminance(rgb(getComputedStyle(cell).color)),b=luminance(rgb(bg||'rgb(255, 255, 255)'))
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05)
    return ratio<4.5?[{id:cell.closest<HTMLElement>('[data-slide-id]')?.dataset.slideId,text:cell.textContent,ratio}]:[]
   })
  },theme)
  expect(failures,theme).toEqual([])
 }
})

test('merged bibliography keeps both sources and redirects the removed slide',async({page})=>{
 const l=course.lectures[0]
 await page.goto(`./?lecture=${l.id}&slide=${l.id}-literature-2`)
 await expect(page.locator('.active-slide .slide-frame')).toHaveAttribute('data-slide-id',l.id+'-literature-1')
 await expect(page.locator('.active-slide .reading-entry')).toHaveCount(2)
 await expect(page.locator('.active-slide .resource-qr')).toHaveCount(2)
})
