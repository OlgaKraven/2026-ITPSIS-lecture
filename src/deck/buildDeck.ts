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
  's07-01-support-lifecycle': { questionIndex: 2, visual: { type: 'hierarchy', title: 'Ответственность участников сопровождения', root: 'Информационная система', branches: [{ label: 'Пользователь', detail: 'Сообщает наблюдаемый симптом' }, { label: 'L1', detail: 'Регистрирует обращение' }, { label: 'L2', detail: 'Проводит диагностику' }, { label: 'Владелец услуги', detail: 'Принимает результат изменения' }] } },
  's07-02-support-levels': { questionIndex: 3, visual: { type: 'hierarchy', title: 'Распределение задач между уровнями поддержки', root: 'Служба поддержки', branches: [{ label: 'L1', detail: 'Приём и типовые решения' }, { label: 'L2', detail: 'Конфигурация и журналы' }, { label: 'L3', detail: 'Исправление продукта и выпуск релиза' }] } },
  's07-03-sla': { questionIndex: 4, visual: { type: 'process', title: 'Как измеряется время реакции', steps: [{ label: 'Регистрация', detail: 'Зафиксировано начало отсчёта' }, { label: 'Принятие в работу', detail: 'Специалист подтвердил обращение' }, { label: 'Расчёт', detail: 'Интервал сравнивается с целью SLA' }] } },
  's07-04-ticket-flow': { questionIndex: 4, visual: { type: 'table', title: 'Различие типов записей', columns: ['Запись', 'Наблюдение', 'Цель'], rows: [['INC-074', 'HTTP 503', 'Восстановить услугу'], ['SR-118', 'Нужна роль', 'Выполнить запрос'], ['DEF-021', 'Workers не стартуют', 'Исправить продукт']] } },
  's07-05-reproduction': { questionIndex: 6, visual: { type: 'process', title: 'Минимизация сценария воспроизведения', steps: [{ label: 'Условие', detail: 'Зафиксировать среду и тестовые данные' }, { label: 'Один элемент', detail: 'Удалить или изменить только его' }, { label: 'Повтор', detail: 'Снова выполнить исходные шаги' }, { label: 'Вывод', detail: 'Оставить только существенные условия' }] } },
  's07-06-escalation': { questionIndex: 4, visual: { type: 'process', title: 'Передача обращения без потери контекста', steps: [{ label: 'Основание', detail: 'Названа граница полномочий' }, { label: 'Сведения', detail: 'Собраны влияние, среда и проверки' }, { label: 'Адресат', detail: 'Определена компетентная роль' }, { label: 'Принятие', detail: 'Подтверждены владелец и срок' }] } },
  's07-07-knowledge-base': { questionIndex: 7, visual: { type: 'cycle', title: 'Жизненный цикл статьи базы знаний', steps: [{ label: 'Создание', detail: 'Решение проверено' }, { label: 'Рецензирование', detail: 'Другой специалист повторил шаги' }, { label: 'Публикация', detail: 'Область применения указана' }, { label: 'Пересмотр', detail: 'Версия и результат снова проверены' }] } },
  's07-08-update-regulation': { questionIndex: 6, visual: { type: 'process', title: 'Переход от обновления к откату', steps: [{ label: 'Контрольная точка', detail: 'Проверяется состояние услуги' }, { label: 'Критерий не выполнен', detail: 'Продолжение останавливается' }, { label: 'Откат', detail: 'Возвращается устойчивая версия' }, { label: 'Проверка', detail: 'Повторяется пользовательский сценарий' }] } },
  's07-09-change-management': { questionIndex: 4, visual: { type: 'cycle', title: 'Управление рисками изменения', steps: [{ label: 'Выявить', detail: 'Назвать нежелательное событие' }, { label: 'Оценить', detail: 'Сопоставить вероятность и влияние' }, { label: 'Подготовить меру', detail: 'Задать предупреждение и реакцию' }, { label: 'Проверить', detail: 'Зафиксировать результат после внедрения' }] } },
  's07-10-backup-restore': { questionIndex: 2, visual: { type: 'process', title: 'Из чего складывается время восстановления', steps: [{ label: 'Решение', detail: 'Выбрать точку возврата' }, { label: 'Подготовка', detail: 'Развернуть среду' }, { label: 'Восстановление', detail: 'Вернуть данные и конфигурацию' }, { label: 'Проверка', detail: 'Подтвердить пользовательскую функцию' }] } },
  's08-01-failure-response': { questionIndex: 1, visual: { type: 'process', title: 'Последовательность реагирования на отказ', steps: [{ label: 'Подтвердить', detail: 'Зафиксировать симптом и влияние' }, { label: 'Классифицировать', detail: 'Назначить приоритет' }, { label: 'Стабилизировать', detail: 'Ограничить последствия' }, { label: 'Восстановить', detail: 'Проверить услугу' }] } },
  's08-02-error-collection': { questionIndex: 4, visual: { type: 'hierarchy', title: 'Источники сведений об ошибке', root: 'Наблюдаемое событие', branches: [{ label: 'Обращения', detail: 'Контекст и влияние для пользователя' }, { label: 'Сообщение интерфейса', detail: 'Код и идентификатор запроса' }, { label: 'Журналы', detail: 'События компонентов' }, { label: 'Метрики', detail: 'Изменение состояния во времени' }] } },
  's08-03-layer-localization': { questionIndex: 5, visual: { type: 'process', title: 'Проверка слоёв от клиента к данным', steps: [{ label: 'Рабочее место' }, { label: 'Сеть' }, { label: 'Приложение' }, { label: 'Сервер' }, { label: 'База данных' }], caption: 'Следующий шаг выбирается по результату предыдущей проверки.' } },
  's08-04-postmortem': { questionIndex: 5, visual: { type: 'process', title: 'От события к предупреждающему действию', steps: [{ label: 'Свидетельства', detail: 'Собрана хронология' }, { label: 'Причина', detail: 'Объяснён механизм отказа' }, { label: 'Условия', detail: 'Найдены пробелы процесса' }, { label: 'Действия', detail: 'Назначены владелец и проверка' }] } },
  's08-05-hardware-maintenance': { questionIndex: 2, visual: { type: 'cycle', title: 'Контроль состояния оборудования', steps: [{ label: 'Измерение', detail: 'Сохранить текущее значение' }, { label: 'Сравнение', detail: 'Сопоставить с базовой линией и порогом' }, { label: 'Решение', detail: 'Назначить наблюдение или обслуживание' }, { label: 'Повторная проверка', detail: 'Подтвердить результат работы' }] } },
}
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
const practiceChecks = [
  'Проверьте, совпадает ли формулировка с исходной темой и границами задачи.',
  'Убедитесь, что для каждой роли указаны действие и ответственность.',
  'Повторите измерение по тем же исходным условиям и сравните результат.',
  'Сверьте выбранный тип или маршрут с определением из теоретической части.',
  'Передайте фрагмент другому участнику и проверьте воспроизводимость.',
  'Убедитесь, что адресат понимает ожидаемое действие без дополнительных пояснений.',
  'Проверьте применимость результата на исходном и граничном сценариях.',
  'Сопоставьте итоговый фрагмент с целью занятия и критерием завершения.',
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

const topicMapVisual = (topic: LectureTopic): SlideVisual => ({
  type: 'process',
  title: 'Последовательность подвопросов',
  steps: topic.questions.map((question, index) => ({ label: `${index + 1}. ${question.title}` })),
  caption: 'Каждый следующий подвопрос опирается на результат предыдущего.',
})

export const buildDeck = (topic: LectureTopic, course: CourseConfig): Slide[] => {
  const semesterTopics = topics.filter((item) => item.semester === topic.semester)
  const topicNumber = semesterTopics.findIndex((item) => item.id === topic.id) + 1
  const semesterLabs = laboratories.filter((lab) => lab.topicId.startsWith(`s${topic.semester}`))
  const semesterLabSourceIds = semesterLabs.map((lab) => `lab-s${topic.semester}-${String(lab.number).padStart(2, '0')}`)
  const sourceIds = Array.from(new Set(['rpd-itpsis-text', ...topic.sourceIds]))
  const titleSecondBullet = `Семестр ${topic.semester} · тема ${topicNumber} из ${semesterTopics.length}`
  const slides: Omit<Slide, 'number'>[] = [
    { kind: 'title', kicker: `${course.discipline} · ${topic.semester}-й семестр`, title: topic.displayTitle, body: `Результат занятия: ${topic.projectArtifact}.`, bullets: [titleSecondBullet, 'Теория, пример, решение и проверка результата'], sourceIds: ['rpd-itpsis-text', 'okfks-rhino', 'synergy-logo'] },
    { kind: 'service', kicker: `${topic.semester}-й семестр`, title: course.semesterThemes[topic.semester], body: 'Темы курса.', bullets: topic.sourceContent, sourceIds },
    { kind: 'service', kicker: 'Литература курса', title: 'Основная литература', bullets: mainLiterature.map((item) => item.label), links: mainLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })), qrCodes: mainLiterature.map((item) => ({ label: item.shortLabel, url: item.url, assetPath: item.assetPath })), sourceIds: ['lit-main-01', 'lit-main-02'] },
    { kind: 'service', kicker: 'Практика семестра', title: 'Лабораторный маршрут и самостоятельная работа', body: selfStudy[topic.semester], bullets: semesterLabs.map((lab) => `Лабораторная работа № ${lab.number}. ${lab.title}`), sourceIds: ['rpd-itpsis-text', ...semesterLabSourceIds] },
    { kind: 'service', kicker: 'Материалы к занятиям', title: 'Папка курса', body: 'QR-код ведёт на папку с материалами.', links: [{ label: course.materialsUrl, url: course.materialsUrl }], sourceIds: ['itpsis-materials', 'synergy-logo'] },
    { kind: 'intro', kicker: 'Введение', title: 'Теория перед практическим кейсом', body: topic.introduction, transition: 'Сначала выстроим понятия и правила, затем последовательно применим их к ситуации CampusHelp.', sourceIds },
    { kind: 'intro', kicker: 'Цель занятия', title: topic.objective, body: `Результат: ${topic.projectArtifact}.`, sourceIds },
    { kind: 'example', kicker: 'Учебный кейс', title: 'CampusHelp: исходная ситуация', body: topic.caseBrief, bullets: [`Роль группы: ${topic.caseRole}.`, 'В кейсе используются обезличенные учебные записи; пароли, ключи, токены и персональные данные не применяются.', `Практический результат: ${topic.projectArtifact}.`], sourceIds },
    { kind: 'intro', kicker: 'Последовательность изучения', title: `${topic.displayTitle}: восемь подвопросов`, visual: topicMapVisual(topic), sourceIds },
    { kind: 'concept', kicker: topic.codeLabel, title: 'Факты до интерпретации', body: 'Этот фрагмент задаёт исходное состояние кейса. Возвращайтесь к нему, когда нужно отделить наблюдение от гипотезы и проверить итоговый вывод.', code: topic.codeSample, codeLabel: topic.codeLabel, sourceIds },
    { kind: 'intro', kicker: 'Результаты обучения', title: 'Что войдёт в итоговый артефакт', bullets: [`точные определения без подмены близких понятий;`, `решение для кейса: ${topic.projectArtifact};`, 'позитивная, граничная и негативная проверка;', 'разделение факта, гипотезы, действия и подтверждённого вывода.'], sourceIds },
    { kind: 'check', kicker: 'Входная диагностика', title: topic.diagnostic, body: 'Сформулируй первоначальный ответ. В конце занятия сравни его с итоговой памяткой.', sourceIds },
  ]

  topic.questions.forEach((question, index) => {
    const number = index + 1
    const visual = visualPlans[topic.id]?.questionIndex === index ? visualPlans[topic.id].visual : undefined
    slides.push(
      { kind: 'divider', kicker: `ВОПРОС ${number}`, title: question.title, body: bridges[index], sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · под запись`, title: `${question.title}: определение`, note: question.focus, sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · правило`, title: `${question.title}: порядок работы`, body: question.rule, transition: `${theoryTransitions[index]} Фокус: «${question.title}».`, sourceIds, questionNumber: number },
      { kind: 'example', kicker: `Вопрос ${number} · пример`, title: `${question.title}: ситуация CampusHelp`, body: question.example, visual, sourceIds, questionNumber: number },
      { kind: 'decision', kicker: `Вопрос ${number} · действие`, title: `${question.title}: решение команды`, body: question.decision, transition: decisionTransitions[index], sourceIds, questionNumber: number },
      { kind: 'warning', kicker: `Вопрос ${number} · ошибка`, title: `${question.title}: ошибочный подход`, body: question.pitfall, transition: warningTransitions[index], sourceIds, questionNumber: number },
      { kind: 'check', kicker: `Вопрос ${number} · проверка`, title: `${question.title}: критерий результата`, body: question.check, sourceIds, questionNumber: number },
    )
  })

  topic.questions.forEach((question, index) => {
    slides.push({
      kind: 'practice', kicker: `Практическая работа · этап ${index + 1} из 8`, title: `${question.title}: часть итоговой работы`,
      body: `Примените вывод по подвопросу «${question.title}» к результату «${topic.projectArtifact}».`,
      bullets: [reportLines[index], `Обоснуйте связь выбранного действия с подвопросом «${question.title}».`, 'Отделите исходное условие от выполненного действия и полученного свидетельства.', practiceChecks[index]],
      sourceIds, questionNumber: index + 1,
    })
  })

  makeTests(topic).forEach((test, index) => slides.push({ kind: 'test', kicker: `Итоговое задание ${index + 1} из 6`, title: testTitles[index], sourceIds, test }))

  slides.push(
    { kind: 'summary', kicker: 'Итоговая памятка', title: `Итоги темы «${topic.displayTitle}»`, body: 'Сравните ваш первоначальный ответ с итогами занятия: что изменилось в терминах, аргументах и способе проверки?', bullets: topic.questions.map((question) => `${question.title}: ${question.decision}`), sourceIds },
    { kind: 'summary', kicker: 'Результат и следующий шаг', title: topic.projectArtifact, body: `Следующий шаг: ${topic.nextStep}.`, bullets: ['Вывод опирается на исходные условия и наблюдаемое свидетельство.', 'Ограничения результата и открытые вопросы зафиксированы.', 'Артефакт передаётся вместе с критериями приёмки и ответственными.'], sourceIds },
    { kind: 'questions', kicker: 'Обсуждение', title: `Вопросы по теме «${topic.displayTitle}»`, body: 'Сформулируй вопрос через исходные условия, наблюдение, ожидаемый результат и способ проверки.', bullets: ['Какой термин требует уточнения?', 'Какое свидетельство стоит разобрать ещё раз?', 'Как проверить вывод безопасно и воспроизводимо?'], sourceIds: ['rpd-itpsis-text', 'okfks-rhino', 'synergy-logo'] },
  )

  const numbered = slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  if (numbered.length !== 85) throw new Error(`Deck invariant failed for ${topic.id}: expected 85 slides, got ${numbered.length}`)
  return numbered
}

export const countServiceSlides = (slides: Slide[]) => slides.filter((slide) => [2, 3, 4, 5, 85].includes(slide.number)).length
