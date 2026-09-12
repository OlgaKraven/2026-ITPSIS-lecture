import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(dir+'/'+e.name):dir+'/'+e.name))).flat()}
const all=await files('dist'),course=JSON.parse(await readFile('dist/course.json','utf8')),pack=JSON.parse(await readFile('authoring/teacher-notes.json','utf8'));
const allowed=new Set(course.lectures.map(l=>`dist/teacher-notes/${l.id}.json`));
for(const path of all)if(path.includes('/teacher-notes/')&&!allowed.has(path))throw Error('Неизвестный файл заметок: '+path);
for(const l of course.lectures){const data=JSON.parse(await readFile(`dist/teacher-notes/${l.id}.json`,'utf8'));assert.equal(data.contentVersion,course.contentVersion);assert.equal(data.courseId,course.id);assert.deepEqual(data.notes,Object.fromEntries(l.slides.map(s=>[s.id,pack.notes[s.id]])));}
for(const path of all)if(/\/private\/|teacher-pack|teacher\.md|\.map$/.test(path))throw Error('Приватный файл в сборке: '+path);
const texts=(await Promise.all(all.filter(f=>/\.(json|js|html|css|txt)$/.test(f)).map(f=>readFile(f,'utf8')))).join('\n');
if(texts.includes('ITPSIS_PRIVATE_SCRIPT_20260912'))throw Error('Приватный маркер в сборке');
const student=(await Promise.all(all.filter(f=>!allowed.has(f)&&/\.(json|js|html|css|txt)$/.test(f)).map(f=>readFile(f,'utf8')))).join('\n');
const publicPassages=new Set(course.lectures.flatMap(l=>l.slides.flatMap(s=>[s.body,s.notebook,...(s.bullets||[])]).filter(Boolean)));
for(const [id,n]of Object.entries(pack.notes))if(n.script.length>80&&!publicPassages.has(n.script)&&student.includes(n.script))throw Error('Полный сценарий вне разрешённого комплекта: '+id);
console.log('PASS: опубликованы только согласованные заметки курса; личные файлы, приватные маркеры и source maps исключены.');
