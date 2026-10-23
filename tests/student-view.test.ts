import {readFileSync}from'node:fs'
import{describe,it,expect}from'vitest'
import{gradeStep}from'../src/teamPractice'
const course=JSON.parse(readFileSync('public/course.json','utf8'))
const step=(key:string)=>{const[l,q,s]=key.split('.').map(Number);const p=course.lectures[l-1].slides.filter(x=>x.supplement)[q-1];return JSON.parse(readFileSync('public/activities/'+p.id.replace('-passport','-case')+'.json','utf8')).steps[s-1]}
// Independently calculated from the visible task conditions, not from the keys.
const calculations={
 '1.8.1':36/18,'2.3.1':40-25,'2.6.1':20,
 '3.2.1':60-50,'3.2.2':10+15,'3.5.2':11-2,'3.6.2':13,'3.6.3':13-7,'3.7.1':35-15,'3.7.2':60-20,'3.8.1':4/40*100,'3.8.2':6/120*100,
 '4.2.2':11-3,'4.4.1':10+14,'5.2.2':14-10,'6.3.1':20-12,'7.1.2':18/30*100,'7.8.1':30,'7.8.2':12/30*100,
 '8.7.1':12-8,'8.7.2':12+3,'9.7.1':100-5,'10.2.1':60-32,'10.2.2':28-20,'10.3.1':15+30+20,'10.3.2':65-60,'10.5.1':60/10,
 '11.1.1':50/100*100,'11.2.1':5/500*100,'11.7.1':15-2,'11.8.1':40-12,'12.4.1':12-10,'12.5.1':1000*.05,'12.5.2':8*1000,'12.6.2':0,'13.5.1':600-150,
 '14.2.1':6,'14.6.1':new Set(['U17','U21','U17','U08']).size,'14.6.2':Number(((3+2+4+1)/3).toFixed(2)),'15.3.1':72-70,'15.3.2':80-72,'15.7.1':60/30
}
describe('student independently solves numerical conditions',()=>{
 it.each(Object.entries(calculations))('%s accepts the independently calculated result',(key,value)=>{const s=step(key);expect(s.type).toBe('numeric');expect(gradeStep(s,String(value)).status).toBe('correct');expect(gradeStep(s,'').status).toBe('empty');expect(gradeStep(s,String(value+1)).status).toBe('incorrect');expect(s.hint).not.toMatch(/[0-9]/)})
 it.each([['3.4.1','P2'],['3.4.3','P1'],['12.6.1','07:05'],['14.3.1','09:02']])('%s accepts the matrix/time result',(key,value)=>expect(gradeStep(step(key),value).status).toBe('correct'))
 const allowed={
  '1.2.2':[[0,1,2],[1,0,2]],'2.1.2':[[0,1,2],[0,2,1]],'4.8.2':[[0,1,2],[1,0,2]],'5.2.3':[[0,1,2],[1,0,2]],'10.8.2':[[0,1,2],[0,2,1]],'11.4.2':[[0,1,2],[1,0,2]]
 }
 it.each(Object.entries(allowed))('%s accepts both allowed orders and rejects an unmet prerequisite',(key,orders)=>{const s=step(key);for(const order of orders)expect(gradeStep(s,order.map(i=>'item-'+i)).status).toBe('correct');expect(gradeStep(s,['item-2','item-1','item-0']).status).toBe('incorrect')})
})
