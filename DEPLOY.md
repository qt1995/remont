# Выкладка

Проект состоит из трёх частей.

| Папка | Что это | Где работает |
|---|---|---|
| корень | публичный сайт (Vite + React) | раздаётся сервером; отдельная сборка живёт на GitHub Pages |
| `server/` | API, база SQLite, приём заявок | Node на VPS, порт 4000 за nginx |
| `admin/` | админка (Vite + React) | собирается в `server/public/admin`, открывается по `/admin` |

Сайт работает и **без сервера**: если `VITE_API_URL` пуст, он берёт контент из `src/data`,
а заявки складывает в `localStorage`. Именно так собран вариант для GitHub Pages.

---

## Боевой сервер

| | |
|---|---|
| Адрес | `188.225.33.9` (Timeweb Cloud), Ubuntu 24.04 |
| Домен | `pro-comfort.pro` |
| Каталог | `/srv/pro-comfort` |
| Сервис | `procomfort` (systemd), пользователь `procomfort` |
| База | `/srv/pro-comfort/data/app.db` |
| Загрузки | `/srv/pro-comfort/uploads` |
| Настройки | `/srv/pro-comfort/env` |

База и загрузки лежат **вне рабочей копии** — деплой их не трогает.

### Доступ

В `~/.ssh/config` заведены два алиаса:

```bash
ssh pro-comfort        # пользователь procomfort, под ним идёт деплой
ssh pro-comfort-root   # root, для обслуживания
```

Оба ходят по ключу `~/.ssh/pro-comfort`.

---

## Деплой одной командой

```bash
git push production main
```

Что происходит на сервере: код раскладывается в `/srv/pro-comfort/app`, ставятся
зависимости, собираются админка и сайт, наполняются пустые таблицы базы, сервис
перезапускается. Весь вывод сборки виден прямо в терминале, откуда пушите.

Хук деплоя лежит в репозитории — `deploy/post-receive` — и обновляет сам себя при
каждом пуше. Правки в нём применяются со **следующего** пуша: запущенный bash
дочитывает старую версию.

Если пуш прошёл, а сайт не отвечает:

```bash
ssh pro-comfort-root 'journalctl -u procomfort -n 50 --no-pager'
```

---

## Подготовка сервера с нуля

`deploy/provision.sh` поднимает чистую Ubuntu 24.04 целиком: node 20, nginx, certbot,
ufw, системный пользователь, systemd-юнит, пустой репозиторий для пуша и права на
перезапуск сервиса. Скрипт идемпотентный — повторный запуск ничего не сломает и
не перезапишет `/srv/pro-comfort/env`.

```bash
scp deploy/provision.sh pro-comfort-root:/root/
ssh pro-comfort-root 'bash /root/provision.sh'
```

Затем с локальной машины:

```bash
git remote add production pro-comfort:/srv/pro-comfort/repo.git
git push production main
```

Первый пуш подтянет настоящий хук и попросит повторить команду — так и задумано.

### Логин в админку

Пароль администратора печатается один раз при первом наполнении базы. Сменить:

```bash
ssh pro-comfort "cd /srv/pro-comfort/app/server && DB_PATH=/srv/pro-comfort/data/app.db node -e \"
import('bcryptjs').then(async (m) => {
  const { db } = await import('./src/db.js');
  db.prepare('UPDATE users SET password_hash = ? WHERE login = ?').run(m.default.hashSync('НОВЫЙ-ПАРОЛЬ', 10), 'admin');
  console.log('готово');
});\""
```

Штатно пароль меняется в самой админке, раздел «Настройки».

---

## HTTPS

Включён: сертификат Let's Encrypt на `pro-comfort.pro` и `www.pro-comfort.pro`,
HTTP редиректит на HTTPS, продление автоматическое (таймер certbot).

Если понадобится переполучить сертификат — например, после смены домена:

```bash
ssh pro-comfort-root 'bash /root/enable-https.sh'
```

Скрипт сверяет A-запись у **авторитетного** сервера зоны, а не у локального резолвера:
публичные кэши держат старый адрес до истечения TTL, и проверка по ним врёт.

Помните: админка работает только по HTTPS — сессионная кука помечена `Secure`,
по обычному HTTP браузер её не сохранит.

---

## Обслуживание

```bash
# статус и логи
ssh pro-comfort-root 'systemctl status procomfort --no-pager'
ssh pro-comfort-root 'journalctl -u procomfort -f'

# бэкап базы и загрузок
ssh pro-comfort-root 'sqlite3 /srv/pro-comfort/data/app.db ".backup /root/app-$(date +%F).db"'
ssh pro-comfort-root 'tar czf /root/uploads-$(date +%F).tar.gz -C /srv/pro-comfort uploads'
```

Ежедневный бэкап базы по крону:

```
0 4 * * * sqlite3 /srv/pro-comfort/data/app.db ".backup '/root/backup/app-$(date +\%F).db'"
```

Вся база — один файл, копируется целиком.

---

## Локальный запуск

Три терминала:

```bash
cd server && npm install && npm run seed && npm run dev
```

```bash
cd admin && npm install && npm run dev
```

```bash
npm install && npm run dev
```

- сайт — http://localhost:5180
- админка — http://localhost:5181/admin/
- API — http://localhost:4000

Адрес API для разработки кладётся в `.env.development.local`:

```
VITE_API_URL=http://localhost:4000
```

**Не в `.env.local`** — его Vite читает и при продовой сборке, и localhost уедет
на боевой сайт.

Значение `VITE_API_URL=same-origin` включает API без абсолютного адреса — так собирается
версия, которую раздаёт сам сервер.

---

## Telegram и Яндекс.Метрика

Подключаются из админки, раздел «Настройки» — в коде ничего править не нужно.

**Telegram.** Бот заводится у `@BotFather`, ID чата берётся у `@userinfobot` (для группы
он начинается с минуса, бота нужно добавить в группу). После сохранения — кнопка
«Отправить тест».

**Метрика.** Номер счётчика подключается к сайту автоматически вместе с целями
`lead`, `lead_open`, `calc_use`, `call_click`. Своя статистика в разделе «Сводка»
работает независимо и остаётся, даже если счётчик убрать.

---

## Что где лежит

| Задача | Файл |
|---|---|
| Подготовка сервера | `deploy/provision.sh` |
| Хук деплоя | `deploy/post-receive` |
| Схема базы и настройки по умолчанию | `server/src/db.js` |
| Стартовый контент | `server/data/seed.json` (генерируется из `src/data`: `node scripts/export-seed.mjs`) |
| Публичный API контента | `server/src/routes/content.js` |
| Приём заявок и событий | `server/src/routes/public.js` |
| Админский API | `server/src/routes/admin.js` |
| Сообщения в Telegram | `server/src/lib/telegram.js` |
| Подключение сайта к API | `src/lib/content.tsx` |
| Сбор событий и Метрика | `src/lib/analytics.ts` |
