import { laboratories, selfStudy, topics } from '../data/courseData'
import type { CourseConfig, LectureTopic, Slide, SlideVisual, TestTask } from '../types'

const mainLiterature = [
  {
    label: 'Алексахин, А. Н. Программное обеспечение управления проектами : учебник / А. Н. Алексахин, И. Ю. Владыко, Е. В. Сибирская ; под редакцией Е. В. Сибирской. — Москва : Университет «Синергия», 2025. — 144 с. — ISBN 978-5-4257-0670-6. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156717/details',
    shortLabel: 'Программное обеспечение управления проектами',
    url: 'https://www.iprbookshop.ru/books/156717/details',
    assetPath: 'qr/lit-main-01.png',
  },
  {
    label: 'Архитектура вычислительных систем и компьютерных сетей : учебник / А. Н. Алексахин, Н. М. Вершинина, А. В. Джебилов [и др.] ; под редакцией А. М. Нечаева, Н. М. Вершининой, Е. В. Устинова. — Москва : Университет «Синергия», 2025. — 436 с. — ISBN 978-5-4257-0681-2. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156708/details',
    shortLabel: 'Архитектура вычислительных систем и компьютерных сетей',
    url: 'https://www.iprbookshop.ru/books/156708/details',
    assetPath: 'qr/lit-main-02.png',
  },
]

const visualPlans: Record<string, { questionIndex: number; visual: SlideVisual }> = {
  's07-01-support-lifecycle': { questionIndex: 2, visual: { type: 'table', title: 'Кто принимает результат', columns: ['Роль', 'Действие', 'Ответственность'], rows: [['Пользователь', 'Сообщает симптом', 'Точность исходных данных'], ['L1', 'Регистрирует', 'Полнота карточки'], ['L2', 'Диагностирует', 'Проверяемая причина'], ['Владелец услуги', 'Согласует изменение', 'Пользовательский результат']] } },
  's07-02-support-levels': { questionIndex: 3, visual: { type: 'table', title: 'Маршрут по линиям поддержки', columns: ['Линия', 'Решает', 'Передаёт, если'], rows: [['L1', 'Приём и типовые решения', 'Нужна диагностика'], ['L2', 'Конфигурация и журналы', 'Нужно изменение продукта'], ['L3', 'Код и релиз', 'Нужно решение владельца']] } },
  's07-03-sla': { questionIndex: 4, visual: { type: 'bar', title: 'Реакция на INC-074', items: [{ label: 'Факт', value: 7, max: 15, displayValue: '7 мин' }, { label: 'Предел P1', value: 15, max: 15, displayValue: '15 мин' }], caption: 'Отсчёт: от регистрации до подтверждённого принятия в работу.' } },
  's07-04-ticket-flow': { questionIndex: 4, visual: { type: 'table', title: 'Инцидент, запрос и дефект', columns: ['Запись', 'Наблюдение', 'Цель'], rows: [['INC-074', 'HTTP 503', 'Восстановить услугу'], ['SR-118', 'Нужна роль', 'Выполнить запрос'], ['DEF-021', 'Workers не стартуют', 'Исправить продукт']] } },
  's07-05-reproduction': { questionIndex: 6, visual: { type: 'table', title: 'Что осталось в минимальном сценарии', columns: ['Элемент', 'Проверка', 'Вывод'], rows: [['Вложение 12 МБ', 'Удалить файл', '503 исчезает'], ['Тема формы', 'Сменить тему', 'Не влияет'], ['Роль куратора', 'Сменить роль', 'Нужен контрольный прогон']] } },
  's07-06-escalation': { questionIndex: 4, visual: { type: 'table', title: 'Пакет передачи INC-074', columns: ['Часть', 'Значение', 'Зачем'], rows: [['Влияние', '126 из 180', 'Приоритет'], ['Среда', 'Клиент 6.4.1', 'Повторение'], ['Свидетельство', 'requestId 8f31', 'Поиск в журнале']] } },
  's07-07-knowledge-base': { questionIndex: 7, visual: { type: 'bar', title: 'Результаты применения KB-042', items: [{ label: 'Успешно', value: 14, max: 16, displayValue: '14' }, { label: 'Возврат на уточнение', value: 2, max: 16, displayValue: '2' }], caption: 'Возвраты показывают, какой шаг статьи требует пересмотра.' } },
  's07-08-update-regulation': { questionIndex: 6, visual: { type: 'table', title: 'Контрольные точки релиза 6.4.2', columns: ['Время', 'Действие', 'Критерий'], rows: [['18:50', 'Снимок', 'Хэш совпал'], ['19:15', 'Сквозной тест', 'Заявка создана'], ['При двух 5xx', 'Откат', '6.4.1 отвечает']] } },
  's07-09-change-management': { questionIndex: 4, visual: { type: 'table', title: 'Риски CHG-012', columns: ['Риск', 'Сигнал', 'Реакция'], rows: [['Workers=0', 'Метрика процесса', 'Откат'], ['Миграция дольше окна', 'Таймер 19:15', 'Остановить шаг'], ['Рост 5xx', 'Два события подряд', 'Вернуть 6.4.1']] } },
  's07-10-backup-restore': { questionIndex: 2, visual: { type: 'bar', title: 'Бюджет RTO: 120 минут', items: [{ label: 'Решение', value: 20, max: 120, displayValue: '20 мин' }, { label: 'Восстановление', value: 70, max: 120, displayValue: '70 мин' }, { label: 'Проверка', value: 20, max: 120, displayValue: '20 мин' }, { label: 'Резерв', value: 10, max: 120, displayValue: '10 мин' }] } },
  's08-01-failure-response': { questionIndex: 1, visual: { type: 'table', title: 'Первые минуты отказа', columns: ['Время', 'Факт', 'Решение'], rows: [['10:14', 'HTTP 503', 'Подтвердить'], ['10:16', '126 пользователей', 'Объявить P1'], ['10:19', 'Координатор назначен', 'Разделить потоки'], ['10:24', 'Сквозной тест успешен', 'Наблюдать']] } },
  's08-02-error-collection': { questionIndex: 4, visual: { type: 'bar', title: 'Очередь и обработчики', items: [{ label: 'Очередь до события', value: 14, max: 980, displayValue: '14' }, { label: 'Очередь при отказе', value: 980, max: 980, displayValue: '980' }, { label: 'Активные workers', value: 0, max: 4, displayValue: '0 из 4' }], caption: 'Совместное изменение сигналов сильнее одиночной записи.' } },
  's08-03-layer-localization': { questionIndex: 5, visual: { type: 'table', title: 'Результаты проверки слоёв', columns: ['Слой', 'Свидетельство', 'Статус'], rows: [['Клиент', 'Два устройства', 'Исключён'], ['Сеть', 'DNS и TLS работают', 'Исключена'], ['Приложение', 'workers=0', 'Подозрение'], ['Сервер', 'Ресурсы в норме', 'Исключён'], ['БД', '18 мс, health=ok', 'Исключена']] } },
  's08-04-postmortem': { questionIndex: 5, visual: { type: 'bar', title: 'Фактическое влияние INC-074', items: [{ label: 'Затронутые пользователи', value: 126, max: 180, displayValue: '126 из 180' }, { label: 'Неуспешные попытки', value: 37, max: 180, displayValue: '37' }, { label: 'Потерянные записи', value: 0, max: 180, displayValue: '0' }], caption: 'Период оценки: 10:14–10:24.' } },
  's08-05-hardware-maintenance': { questionIndex: 2, visual: { type: 'bar', title: 'Температура SRV-APP-02', items: [{ label: 'Базовый уровень', value: 61, max: 80, displayValue: '61 °C' }, { label: 'Текущее значение', value: 74, max: 80, displayValue: '74 °C' }, { label: 'Порог действия', value: 80, max: 80, displayValue: '80 °C' }], caption: 'Тренд создаёт основание для планового окна до аварии.' } },
}

const definitionOpeners = ['Сначала уточним', 'Зафиксируем границу', 'Разведём понятия', 'Соберём основу', 'Назовём точно', 'Определим рабочий смысл', 'Установим критерий', 'Закрепим вывод']
const theoryOpeners = ['Как устроено', 'На чём держится', 'Как связаны элементы', 'Правило для команды', 'Логика решения', 'Последовательность работы', 'Граница применимости', 'Как поддерживать результат']
const caseOpeners = ['Первый эпизод', 'Наблюдение на стенде', 'Следующий факт CampusHelp', 'Проверка на живых значениях', 'Поворот кейса', 'Данные для решения', 'Контрольный эксперимент', 'Финальный эпизод']
const decisionOpeners = ['Первое решение', 'Команда распределяет действия', 'Выбираем проверяемый ход', 'Фиксируем рабочий маршрут', 'Сужаем область решения', 'Передаём результат дальше', 'Укрепляем процесс', 'Собираем итог']
const riskOpeners = ['Ложная уверенность', 'Где теряется контекст', 'Ошибка в исходных условиях', 'Подмена факта предположением', 'Риск поспешного действия', 'Слабое место передачи', 'Что разрушает воспроизводимость', 'Последняя проверка на прочность']
const checkOpeners = ['Признак первого результата', 'Проверка ответственности', 'Измеримый рубеж', 'Сверка классификации', 'Повтор независимым участником', 'Приёмка без уточнений', 'Контроль устойчивости', 'Доказательство завершения']
const bridges = [
  'Откроем тему с базового различия, которое задаёт весь дальнейший маршрут.',
  'Следующий шаг добавляет роли и условия к уже определённому объекту.',
  'Теперь превратим общее правило в измеримое решение.',
  'После измерения нужно правильно назвать ситуацию и выбрать процесс.',
  'Классификация ведёт к проверке на конкретных данных CampusHelp.',
  'Полученный результат должен перейти следующему участнику без потери смысла.',
  'Сохраним решение так, чтобы им могла воспользоваться другая смена.',
  'Завершим цепочку контрольным результатом и подготовим итоговый артефакт.',
]
const theoryTransitions = [
  'Смысл понятия задан; теперь найдём его наблюдаемое проявление в CampusHelp.',
  'Связь элементов понятна — перенесём её на следующий эпизод общей истории.',
  'Полученное правило можно измерить; для этого возьмём конкретные значения кейса.',
  'Теоретическая граница установлена, поэтому классифицируем фактическую ситуацию.',
  'Перейдём от формулировки к воспроизводимому действию на учебном стенде.',
  'Следующий эпизод покажет, сохранится ли смысл при передаче между участниками.',
  'Теперь проверим, можно ли повторно использовать решение без устных пояснений.',
  'Финальное правило применим к контрольной точке и соберём завершённый результат.',
]
const decisionTransitions = [
  'Первое решение задаёт направление; проверим, где оно может дать ложную уверенность.',
  'Роли распределены, но контекст ещё может потеряться на границе ответственности.',
  'Число получено; теперь исключим ошибку в исходных условиях и способе расчёта.',
  'Процесс выбран, однако неподтверждённый диагноз способен исказить следующий шаг.',
  'Действие воспроизводимо; осталось проверить риск поспешного вмешательства.',
  'Передача подготовлена — оценим, достаточно ли сведений получателю.',
  'Решение сохранено; убедимся, что другой специалист сможет применить его правильно.',
  'Итог почти готов; последняя проверка должна подтвердить устойчивость результата.',
]
const warningTransitions = [
  'Исправляем исходную неточность и принимаем результат по первому критерию.',
  'Возвращаем владельца и контрольный срок, затем сверяем ответственность.',
  'Уточняем границы измерения и повторяем расчёт по тем же отметкам.',
  'Отделяем факт от предположения и проверяем выбранную классификацию.',
  'Откатываем лишнее действие и передаём сценарий независимому участнику.',
  'Дополняем пакет, после чего получатель начинает работу без нового опроса.',
  'Уточняем статью и проводим контрольный прогон другой сменой.',
  'Срабатывает заключительный критерий, который подтверждает завершение цепочки.',
]
const reportLines = [
  'Зафиксируйте исходную границу темы и первый наблюдаемый результат.',
  'Добавьте распределение ролей и точку передачи ответственности.',
  'Внесите значение, правило расчёта и источник временных отметок.',
  'Запишите выбранный тип, обоснование и ожидаемый маршрут записи.',
  'Приложите условия эксперимента и результат независимого повтора.',
  'Сохраните состав пакета и подтверждение его принятия адресатом.',
  'Оформите инструкцию так, чтобы её можно было выполнить без пояснений.',
  'Завершите документ итоговым критерием, ограничениями и следующим действием.',
]

const makeTests = (topic: LectureTopic): TestTask[] => {
  const [q1, q2, q3, q4, q5, q6] = topic.questions
  return [
    { id: `${topic.id}-single`, mode: 'single', prompt: `Какое решение следует принять в ситуации «${q1.title}»?`, options: [q1.decision, q1.pitfall, 'Скрыть исходные условия', 'Сделать вывод без критерия'], correctIndexes: [0], correctAnswer: q1.decision, explanation: `Решение следует из правила: ${q1.rule}`, hint: 'Выберите действие с наблюдаемым результатом.', criteria: 'Действие связано с условием и способом проверки.' },
    { id: `${topic.id}-multiple`, mode: 'multiple', prompt: `Какие два элемента делают вывод по вопросу «${q2.title}» проверяемым?`, options: [q2.rule, q2.check, q2.pitfall, 'Непроверяемая оценка'], correctIndexes: [0, 1], correctAnswer: `${q2.rule}; ${q2.check}`, explanation: 'Правило задаёт действие, а критерий показывает, какой результат можно принять.', hint: 'Нужны правило и проверка.', criteria: 'Отмечены оба подтверждаемых элемента без типичной ошибки.' },
    { id: `${topic.id}-boolean`, mode: 'boolean', prompt: `Верно ли утверждение: «${q3.pitfall}»?`, options: ['Верно', 'Неверно'], correctIndexes: [1], correctAnswer: 'Неверно', explanation: `Рабочее правило: ${q3.rule}`, hint: 'Проверьте, сохраняются ли исходные условия и доказательства.', criteria: 'Ответ «Неверно» обоснован риском из темы.' },
    { id: `${topic.id}-classification`, mode: 'classification', prompt: `Выберите обоснованное продолжение ситуации «${q4.example}».`, options: [q4.decision, q4.pitfall, 'Скрыть отклонение', 'Признать любой результат успешным'], correctIndexes: [0], correctAnswer: q4.decision, explanation: 'Решение связано с исходным условием и допускает проверку.', hint: 'Ищите действие без подмены факта предположением.', criteria: 'Выбрано действие, ведущее к проверяемому результату.' },
    { id: `${topic.id}-order`, mode: 'order', prompt: `Восстановите порядок работы с задачей «${q5.title}».`, options: ['1. Зафиксировать исходные условия', '2. Применить согласованное правило', '3. Получить и сохранить результат', '4. Выполнить контрольную проверку'], correctIndexes: [0, 1, 2, 3], correctAnswer: `1 → 2 → 3 → 4; решение: ${q5.decision}`, explanation: 'Критерий задаётся заранее, а контроль выполняется после получения результата.', hint: 'Начните с условий, закончите проверкой.', criteria: 'Все четыре шага образуют воспроизводимый порядок.' },
    { id: `${topic.id}-short`, mode: 'short', prompt: `Коротко объясните, как проверить задачу «${q6.title}» в учебном кейсе.`, correctAnswer: q6.check, explanation: `Ориентир: ${q6.decision}`, hint: 'Назовите условие, действие, свидетельство и критерий.', criteria: 'В ответе есть условие, действие, наблюдаемое свидетельство и критерий.' },
  ]
}

const testTitles = ['Выбери действие по исходному факту', 'Собери доказательный критерий', 'Найди опасное утверждение', 'Продолжи разбор CampusHelp', 'Восстанови порядок работы', 'Сформулируй проверяемый ответ']

export const buildDeck = (topic: LectureTopic, course: CourseConfig): Slide[] => {
  const semesterTopics = topics.filter((item) => item.semester === topic.semester)
  const topicNumber = semesterTopics.findIndex((item) => item.id === topic.id) + 1
  const semesterLabs = laboratories.filter((lab) => lab.topicId.startsWith(`s${topic.semester}`))
  const semesterLabSourceIds = semesterLabs.map((lab) => `lab-s${topic.semester}-${String(lab.number).padStart(2, '0')}`)
  const sourceIds = Array.from(new Set(['rpd-itpsis-text', ...topic.sourceIds]))
  const titleSecondBullet = `Семестр ${topic.semester} · тема ${topicNumber} из ${semesterTopics.length}`
  const slides: Omit<Slide, 'number'>[] = [
    { kind: 'title', kicker: `${course.discipline} · ${topic.semester}-й семестр`, title: topic.displayTitle, body: `Практическая задача: ${topic.projectArtifact}.`, bullets: [titleSecondBullet, 'От теории — к кейсу, проверке и практическому результату'], sourceIds: ['rpd-itpsis-text', 'okfks-rhino', 'synergy-logo'] },
    { kind: 'service', kicker: `${topic.semester}-й семестр`, title: course.semesterThemes[topic.semester], body: 'Темы курса.', bullets: topic.sourceContent, sourceIds },
    { kind: 'service', kicker: 'Учебная навигация', title: 'Основная литература', bullets: mainLiterature.map((item) => item.label), links: mainLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })), qrCodes: mainLiterature.map((item) => ({ label: item.shortLabel, url: item.url, assetPath: item.assetPath })), sourceIds: ['lit-main-01', 'lit-main-02'] },
    { kind: 'service', kicker: 'Практика семестра', title: 'Лабораторный маршрут и самостоятельная работа', body: selfStudy[topic.semester], bullets: semesterLabs.map((lab) => `Лабораторная работа № ${lab.number}. ${lab.title}`), sourceIds: ['rpd-itpsis-text', ...semesterLabSourceIds] },
    { kind: 'service', kicker: 'Материалы к занятиям', title: 'Папка курса', body: 'QR-код ведёт на папку с материалами.', links: [{ label: course.materialsUrl, url: course.materialsUrl }], sourceIds: ['itpsis-materials', 'synergy-logo'] },
    { kind: 'intro', kicker: 'Введение', title: 'Теория перед практическим кейсом', body: topic.introduction, transition: 'Сначала выстроим понятия и правила, затем последовательно применим их к ситуации CampusHelp.', sourceIds },
    { kind: 'intro', kicker: 'Цель занятия', title: topic.objective, body: `К завершению будет подготовлен артефакт: ${topic.projectArtifact}.`, sourceIds },
    { kind: 'example', kicker: 'Учебный кейс', title: 'CampusHelp: точка входа в тему', body: topic.caseBrief, bullets: [`Роль группы: ${topic.caseRole}.`, 'Все значения синтетические; персональные данные, действующие пароли, ключи и токены не используются.', `Практический результат: ${topic.projectArtifact}.`], sourceIds },
    { kind: 'intro', kicker: 'Логика презентации', title: 'Восемь шагов одной истории', bullets: topic.questions.map((question, index) => `${index + 1}. ${question.title}`), sourceIds },
    { kind: 'concept', kicker: topic.codeLabel, title: 'Факты до интерпретации', body: 'Этот фрагмент задаёт исходное состояние кейса. Возвращайтесь к нему, когда нужно отделить наблюдение от гипотезы и проверить итоговый вывод.', code: topic.codeSample, codeLabel: topic.codeLabel, sourceIds },
    { kind: 'intro', kicker: 'Результаты обучения', title: 'Что войдёт в итоговый артефакт', bullets: [`точные определения без подмены близких понятий;`, `решение для кейса: ${topic.projectArtifact};`, 'позитивная, граничная и негативная проверка;', 'разделение факта, гипотезы, действия и подтверждённого вывода.'], sourceIds },
    { kind: 'check', kicker: 'Входная диагностика', title: topic.diagnostic, body: 'Сформулируй первоначальный ответ. На экране 83 сравни его с итоговой памяткой.', sourceIds },
  ]

  topic.questions.forEach((question, index) => {
    const number = index + 1
    const visual = visualPlans[topic.id]?.questionIndex === index ? visualPlans[topic.id].visual : undefined
    slides.push(
      { kind: 'divider', kicker: `ВОПРОС ${number}`, title: question.title, body: bridges[index], sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · под запись`, title: `${definitionOpeners[index]}: ${question.title}`, note: question.focus, sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · теория`, title: `${theoryOpeners[index]}: ${question.title}`, body: question.rule, transition: `${theoryTransitions[index]} Фокус: «${question.title}».`, sourceIds, questionNumber: number },
      { kind: 'example', kicker: `Вопрос ${number} · данные кейса`, title: `${caseOpeners[index]}: ${question.title}`, body: question.example, visual, sourceIds, questionNumber: number },
      { kind: 'decision', kicker: `Вопрос ${number} · решение команды`, title: `${decisionOpeners[index]}: ${question.title}`, body: question.decision, transition: decisionTransitions[index], sourceIds, questionNumber: number },
      { kind: 'warning', kicker: `Вопрос ${number} · граница решения`, title: `${riskOpeners[index]}: ${question.title}`, body: question.pitfall, transition: warningTransitions[index], sourceIds, questionNumber: number },
      { kind: 'check', kicker: `Вопрос ${number} · приёмка`, title: `${checkOpeners[index]}: ${question.title}`, body: question.check, sourceIds, questionNumber: number },
    )
  })

  topic.questions.forEach((question, index) => {
    slides.push({
      kind: 'practice', kicker: `Практикум по теме · этап ${index + 1} из 8`, title: `Практический шаг ${index + 1}: ${question.title}`,
      body: `Эпизод «${question.title}» добавляет следующий доказанный фрагмент в артефакт «${topic.projectArtifact}».`,
      bullets: [`Исходная ситуация: ${question.example}`, `Действие команды: ${question.decision}`, reportLines[index], `Критерий приёмки: ${question.check}`, `Ограничение: ${question.pitfall}`],
      sourceIds, questionNumber: index + 1,
    })
  })

  makeTests(topic).forEach((test, index) => slides.push({ kind: 'test', kicker: `Итоговое задание ${index + 1} из 6`, title: testTitles[index], sourceIds, test }))

  slides.push(
    { kind: 'summary', kicker: 'Итоговая памятка', title: `Собираем тему «${topic.displayTitle}» в единый маршрут`, body: 'Сравните ваш первоначальный ответ с итогами занятия: что изменилось в терминах, аргументах и способе проверки?', bullets: topic.questions.map((question) => `${question.title}: ${question.decision}`), sourceIds },
    { kind: 'summary', kicker: 'Результат и следующий шаг', title: topic.projectArtifact, body: `Следующий шаг: ${topic.nextStep}.`, bullets: ['Вывод опирается на исходные условия и наблюдаемое свидетельство.', 'Ограничения результата и открытые вопросы зафиксированы.', 'Артефакт передаётся вместе с критериями приёмки и ответственными.'], sourceIds },
    { kind: 'questions', kicker: 'Финал занятия', title: `Обсуждаем решения по теме «${topic.displayTitle}»`, body: 'Сформулируй вопрос через исходные условия, наблюдение, ожидаемый результат и способ проверки.', bullets: ['Какой термин требует уточнения?', 'Какое свидетельство стоит разобрать ещё раз?', 'Как проверить вывод безопасно и воспроизводимо?'], sourceIds: ['rpd-itpsis-text', 'okfks-rhino', 'synergy-logo'] },
  )

  const numbered = slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  if (numbered.length !== 85) throw new Error(`Deck invariant failed for ${topic.id}: expected 85 slides, got ${numbered.length}`)
  return numbered
}

export const countServiceSlides = (slides: Slide[]) => slides.filter((slide) => [2, 3, 4, 5, 85].includes(slide.number)).length
