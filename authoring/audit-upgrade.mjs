import {compactSummaries} from './student-summaries.mjs';
import {distractors} from './case-distractors.mjs';
import {reading} from './student-reading.mjs';
import {foundations} from './student-foundations.mjs';
import {cases} from './transfer-cases.mjs';
export const auditVersion='2026-10-23-itpsis-7';

export function upgradeCourse(course,bank,original,questionMap){
 const activities=[];
 course.teacherNotesPreviousVersions=['2026-09-12-itil-2','2026-09-12-itil-3','2026-09-12-itil-4','2026-10-23-itpsis-5','2026-10-23-itpsis-6'];
 course.mascot='brand/rhino-itpsis.png';
 course.year='';
 course.publicUrl='https://olgakraven.github.io/2026-ITPSIS-lecture/';
 for(const [li,l] of course.lectures.entries()){
  const get=suffix=>l.slides.find(s=>s.id===`${l.id}-${suffix}`);
  // The purpose and discipline are already on the title; do not repeat the objective there.
  delete get('title').body;
  get('intro').bullets=[foundations[li][0]];
  get('readiness').title='Как читать данные этого разбора';
  get('readiness').body=foundations[li][1];
  for(const suffix of ['summary-a','summary-b'])if(compactSummaries[`${l.id}-${suffix}`])get(suffix).rows=compactSummaries[`${l.id}-${suffix}`];
  for(const [qi,q] of original.topics[li].questions.entries()){
   const prefix=`Q${String(qi+1).padStart(2,'0')}`;
   const map=questionMap.find(x=>x.questionId===`${l.id}-${prefix}`);
   const flow=get(`${prefix}-flow`), warning=get(`${prefix}-warning`);
   flow.title=q.title+': основания решения';
   flow.kind='comparison';delete flow.visual;
   flow.columns=['Наблюдение','Действие','Подтверждение'];
   const r=reading[li][qi];
   flow.title='Проверяем вывод на другом условии';
   flow.columns=['Часть разбора','Наблюдение и вывод'];
   flow.rows=[['Условие',r.condition],['Вывод',r.result],['Граница вывода',r.limit]];
   warning.columns=['Ошибочное решение','Применимое правило'];
   warning.rows=[[q.pitfall,q.rule]];delete warning.visual;delete warning.body;
   const term=get(`${prefix}-term`);
   const notebook=get(`${prefix}-notebook`);
   const split=notebook.notebook.indexOf(' — ');
   const termName=notebook.notebook.slice(0,split);
   const definitionText=notebook.notebook.slice(split+3).slice(0,-q.rule.length).trim();
   term.body=r.clarification;
   term.definitionEntries=[{term:termName,definition:definitionText}];
   term.notebook=`${termName} — ${definitionText}`;
   const [condition,conclusion]=cases[li][qi];
   if(condition===q.example)throw Error('Самостоятельный случай повторяет пример');
   const id=`${l.id}-${prefix}-case`;
   const options=[{id:'evidence',text:conclusion},{id:'premature',text:distractors[li][qi]}];
   // Alternate positions without assigning correctness to a position.
   if((li+qi)%2)options.reverse();
   const activity={id,revision:2,lectureId:l.id,questionId:map.questionId,title:q.title,condition,
    observations:condition.split(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ])/u),
    task:'Выберите вывод, который следует из условия. Обоснуйте его конкретным наблюдением.',options,
    correct:'evidence',explanation:conclusion,rule:q.rule,
    mistake:`Выбранный вывод добавляет к условию неподтверждённое предположение. Правило проверки: ${q.rule}`};
   activities.push(activity);
   const passport={id:`${l.id}-${prefix}-passport`,kind:'example',title:q.title,kicker:`Вопрос ${qi+1} · Самостоятельный случай`,
    body:condition,bullets:['Запишите прогноз до разбора.','Сопоставьте данные и вывод, затем обоснуйте решение.'],
    supplement:{label:'Интерактивная схема',href:`?mode=case&case=${id}`},source:'Независимый учебный пример'};
   const at=l.slides.findIndex(s=>s.id===`${l.id}-${prefix}-test-1`);
   l.slides.splice(at,0,passport);
   map.slideIds.splice(map.slideIds.length-4,0,passport.id);
   // The assessment uses a separate question about a changed condition, not the same case.
   // Existing tasks and their keys remain stable to preserve valid saved attempts.
  }
 }
 // Exact worked quantities: the times and units belong to the stated educational examples.
 const set=(li,qi,visual)=>{const s=course.lectures[li].slides.find(s=>s.id.endsWith(`Q${String(qi).padStart(2,'0')}-flow`));delete s.rows;delete s.columns;s.kind='process';s.title='Сопоставляем данные и вывод';s.visual=visual;};
 set(0,4,{type:'comparison',columns:['Запись','Состояния','Критерий перехода'],rows:[['Инцидент','Новое → в работе → решено → проверено','Услуга восстановлена и проверена'],['Изменение','Оценка → согласование → внедрение → проверка','Одобрение и результат внедрения']],caption:'Два связанных потока имеют разные цели. Проверка инцидента не согласует изменение автоматически.'});
 set(1,5,{type:'comparison',columns:['Наблюдение','Назначение'],rows:[['Нужна стандартная роль','Группа доступа: проверить согласование'],['Нарушена доступная функция','Дежурный поддержки: восстановить услугу'],['Нужно изменить продукт','Владелец изменения: оценить влияние']],caption:'Маршрутизация задаётся типом работы и полномочиями; номера L1–L3 — локальная организация поддержки.'});
 set(2,4,{type:'comparison',columns:['Влияние / срочность','Высокая','Средняя','Низкая'],rows:[['Высокое','P1','P2','P2'],['Среднее','P2','P2','P3'],['Низкое','P2','P3','P3']],caption:'Полная учебная матрица этого примера: выберите строку влияния и столбец срочности. Обозначения и границы оценок задаются в соглашении.'});
 set(2,5,{type:'comparison',columns:['Отметка','Время','Значение'],rows:[['Регистрация','10:14','Начало отсчёта'],['Принятие специалистом','10:21','Подтверждённая реакция'],['Разность','7 минут','10:21 − 10:14']],caption:'Все отметки внутри одного окна обслуживания. Автоматическое письмо не заменяет принятие работы.'});
 set(2,6,{type:'comparison',columns:['Событие','Время','Вывод'],rows:[['Начало нарушения','10:14','Начало отсчёта'],['Запуск обработчиков','10:19','Компонент работает; услуга ещё не проверена'],['Успешная заявка','10:24','10 минут до подтверждения пользовательского результата']],caption:'Время восстановления услуги считается до подтверждённого результата, не до запуска процесса.'});
 set(3,3,{type:'comparison',columns:['Объект','Цель','Связь'],rows:[['Инцидент INC-074','Восстановить функцию','Может быть связан с дефектом'],['Дефект DEF-021','Исправить недостаток продукта','Исправление проверяют в конкретной версии'],['Запрос SR-118','Предоставить согласованную роль','Не требует предшествующего отказа']],caption:'Объекты различаются целью и критерием завершения, а не только префиксом номера.'});
 set(4,7,{type:'comparison',columns:['Изменённое условие','Наблюдение','Ограничение вывода'],rows:[['Без вложения','503 исчезает','Вложение существенно для этого повтора'],['Другая тема формы','503 остаётся','Тема несущественна в этой проверке'],['Возврат вложения','Контрольный повтор','Сокращённый сценарий обязан воспроизводить симптом']],caption:'Меняйте одно условие за раз при сохранении остального окружения. Это не доказывает причину всех HTTP 503.'});
 set(5,7,{type:'process',items:[{title:'Отправитель',text:'Передаёт данные и ожидаемое действие'},{title:'Получатель',text:'Подтверждает принятие либо уточняет недостающее'},{title:'Контакт с пользователем',text:'Владелец и ближайший срок остаются известны'}],caption:'Передача завершена по подтверждению принятия, а не по отправке письма.'});
 set(6,8,{type:'comparison',columns:['Показатель','Что показывает','Чего не доказывает'],rows:[['Просмотры','Интерес или потребность','Успешность применения'],['Успешные подходящие применения / все подходящие попытки','Долю успешного применения','Причину изменения без анализа состава случаев']],caption:'Для сравнения периодов сохраняйте определение подходящей попытки и учитывайте изменение условий.'});
 set(7,4,{type:'comparison',columns:['Объект возврата','Что необходимо'],rows:[['Приложение','Совместимая предыдущая версия'],['Данные','Согласованная точка и допустимая потеря'],['Конфигурация','Версия настроек и секреты из защищённого хранилища'],['Услуга','Проверенный маршрут восстановления']],caption:'Один сохранённый бинарный файл не гарантирует откат несовместимой миграции БД.'});
 set(8,5,{type:'comparison',columns:['Ось риска','Наблюдение','Решение'],rows:[['Вероятность','Насколько обоснован сценарий отказа','Проверки, история, различия среды'],['Последствия','Какой результат теряется при отказе','Охват, данные, длительность, обратимость']],caption:'Риск оценивается до внедрения; малая вероятность не отменяет тяжёлых последствий.'});
 set(9,2,{type:'comparison',columns:['Величина','Учебное условие','Проверка'],rows:[['RPO','Не более 4 часов потери','12:00 − 07:00 = 5 часов'],['Превышение','5 − 4','1 час сверх цели']],caption:'Последняя подтверждённая восстанавливаемая точка важнее времени старта задания копирования.'});
 set(9,3,{type:'comparison',columns:['Этап','Длительность'],rows:[['Решение','20 минут'],['Восстановление','95 минут'],['Проверка услуги','20 минут'],['Полный маршрут','135 минут > RTO 120 минут']],caption:'Этапы в данном учебном условии выполняются последовательно. Превышение составляет 15 минут.'});
 set(10,7,{type:'comparison',columns:['Наблюдение','Достаточность'],rows:[['Процесс запущен','Не доказывает пользовательский результат'],['Контрольная операция успешна','Подтверждает конкретную функцию'],['Метрики стабильны в заданном окне','Дополняет проверку восстановления']],caption:'Срок контрольного окна и проверяемая функция задаются регламентом, а не универсальным числом ITIL.'});
 set(11,6,{type:'comparison',columns:['Источник','Исходное время','UTC'],rows:[['Клиент','16:20 UTC+3','13:20 UTC'],['Сервер','13:20 UTC','13:20 UTC'],['Корреляция','Один requestId r-22','Отметки согласованы по времени']],caption:'Часовой пояс нормализуют до сортировки событий; совпадение времени само по себе не доказывает причинность.'});
 set(12,1,{type:'comparison',columns:['Слой','Проверка','Предел вывода'],rows:[['Рабочее место / сеть','Другой клиент; DNS, TCP, TLS','Ping не проверяет HTTP'],['Приложение / сервер','Операция, журнал, ресурсы','Статика не проверяет API'],['База данных','Запрос, блокировка, транзакция','Соединение не проверяет запись']],caption:'Это карта диагностических областей, а не обязательная очередь и не доказанная причина отказа.'});
 set(13,4,{type:'comparison',columns:['Наблюдение','Допустимый вывод','Не доказано'],rows:[['Перезапуск помог','Действие восстановило проверенную функцию','Корневая причина остановки'],['Сбой после релиза','Есть временная связь','Что именно в релизе вызвало сбой'],['Контрольный опыт повторил эффект','Гипотеза получила подтверждение в опыте','Поведение при любых иных условиях']],caption:'Причинное объяснение требует механизма и свидетельств; последовательность событий сама его не создаёт.'});
 set(14,3,{type:'comparison',columns:['Показатель','Учебное значение','Интерпретация'],rows:[['Динамика при той же нагрузке','58 → 69 °C','Рост на 11 °C'],['Вывод','Проверить триггер обслуживания','Предел аварийности здесь не задан'],['Применимость','Конкретная модель и нагрузка','Сверить пределы с документацией производителя']],caption:'Числа — учебные условия, а не нормы безопасности для произвольного оборудования.'});
 return activities;
}
