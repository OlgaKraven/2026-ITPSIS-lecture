import {readFile,readdir} from 'node:fs/promises';
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(dir+'/'+e.name):dir+'/'+e.name))).flat()}
const all=await files('dist');
for(const path of all)if(/\/private\/|teacher-pack|teacher\.md|\.map$/.test(path))throw Error('Приватный файл в сборке: '+path);
const texts=(await Promise.all(all.filter(f=>/\.(json|js|html|css|txt)$/.test(f)).map(f=>readFile(f,'utf8')))).join('\n');
if(texts.includes('ITPSIS_PRIVATE_SCRIPT_20260912'))throw Error('Приватный маркер в сборке');
try{const pack=JSON.parse(await readFile('private/teacher-pack.json','utf8'));for(const [id,n]of Object.entries(pack.notes))if(n.script.length>80&&texts.includes(n.script))throw Error('Сценарий в сборке: '+id);console.log('Проверены все сценарии фактического TeacherPack.');}catch(e){if(e.code!=='ENOENT')throw e;console.log('Локальный TeacherPack отсутствует; проверены пути и приватный маркер.');}
console.log('PASS: приватных файлов, сценариев и source maps в dist нет; автономные учебные ключи публичны.');
