# Зафиксированный движок

Архив olgakraven-lecture-engine-0.1.0-066443f.tgz собран командами npm ci, npm run build:engine, npm pack из OlgaKraven/2026-lecture-shablone, коммит 066443f20bec42162145d9c4c5b9e89a1099e647.

Upstream сохранил номер 0.1.0. Суффикс коммита в имени архива отличает новую сборку от предыдущей; SHA-512 закреплён package-lock.json. Код движка не изменялся.

validation/ содержит исходные model.ts, scoring.ts, session.ts этой редакции для проверок. В session-check.mjs адаптированы только относительные пути импортов исходного теста.
