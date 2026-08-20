# Выкладка: сайт, админка, база

Проект состоит из трёх частей.

| Папка | Что это | Куда едет |
|---|---|---|
| корень | публичный сайт (Vite + React) | статика: GitHub Pages, любой хостинг или сам сервер |
| `server/` | API, база SQLite, приём заявок | Node на VPS |
| `admin/` | админка (Vite + React) | собирается в `server/public/admin`, раздаётся сервером |

Сайт работает и **без сервера**: если `VITE_API_URL` пуст, он берёт контент из `src/data`,
а заявки складывает в `localStorage`. Сервер добавляет редактируемый контент, базу заявок,
уведомления в Telegram и свою статистику.

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

Логин и пароль администратора печатаются один раз при `npm run seed`. Чтобы задать свои:

```bash
ADMIN_LOGIN=admin ADMIN_PASSWORD=ваш-пароль npm run seed
```

Файл `.env.local` в корне подключает сайт к локальному API:

```
VITE_API_URL=http://localhost:4000
```

---

## Выкладка на VPS

Дальше — Ubuntu 22.04+, nginx и домен `example.ru`. Подставьте свой.

### 1. Node и код

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo mkdir -p /var/www/remont && sudo chown $USER /var/www/remont
git clone https://github.com/qt1995/remont.git /var/www/remont
```

### 2. Сервер и база

```bash
cd /var/www/remont/server
npm ci --omit=dev
cp .env.example .env
```

В `.env` обязательно задать:

```
PORT=4000
JWT_SECRET=<длинная случайная строка>
ALLOWED_ORIGINS=https://example.ru
TRUST_PROXY=1
COOKIE_SECURE=1
```

Секрет генерируется так:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Затем наполняем базу и создаём администратора:

```bash
ADMIN_LOGIN=admin ADMIN_PASSWORD='свой-пароль' npm run seed
```

### 3. Админка и сайт

```bash
cd /var/www/remont/admin && npm ci && npm run build
cd /var/www/remont && npm ci && VITE_API_URL=https://example.ru npm run build
cp -r dist ../remont/server/public/site
```

Последняя строка кладёт сайт туда, откуда его раздаёт сам сервер. Если сайт остаётся
на GitHub Pages — этот шаг пропускается, но тогда в `ALLOWED_ORIGINS` нужно добавить
`https://qt1995.github.io`, а собирать сайт командой:

```bash
VITE_API_URL=https://example.ru npm run build:pages
```

### 4. Автозапуск

```ini
# /etc/systemd/system/remont.service
[Unit]
Description=Remont API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/remont/server
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/www/remont/server/data /var/www/remont/server/uploads
sudo systemctl enable --now remont
sudo systemctl status remont
```

### 5. nginx и HTTPS

```nginx
server {
  server_name example.ru;
  client_max_body_size 10m;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d example.ru
```

`client_max_body_size` должен быть не меньше лимита загрузки файлов (8 МБ на файл).

---

## Обновление

```bash
cd /var/www/remont && git pull
cd admin && npm ci && npm run build
cd .. && npm ci && VITE_API_URL=https://example.ru npm run build && cp -r dist server/public/site
cd server && npm ci --omit=dev && sudo systemctl restart remont
```

`npm run seed` при обновлении запускать не нужно: он наполняет только пустые таблицы и не
трогает заявки. Команда `npm run reset` перезальёт контент заново — заявки, события и
пользователи при этом сохраняются.

---

## Бэкап

Вся база — один файл. Достаточно копировать его и папку загрузок:

```bash
sqlite3 /var/www/remont/server/data/app.db ".backup '/backup/app-$(date +%F).db'"
tar czf /backup/uploads-$(date +%F).tar.gz -C /var/www/remont/server uploads
```

Раз в сутки по крону:

```
0 4 * * * sqlite3 /var/www/remont/server/data/app.db ".backup '/backup/app-$(date +\%F).db'"
```

---

## Telegram и Яндекс.Метрика

Оба подключаются из админки, раздел «Настройки» — в коде ничего править не нужно.

**Telegram.** Создайте бота у `@BotFather`, скопируйте токен. Напишите боту любое сообщение,
затем узнайте ID чата у `@userinfobot` (для группы ID начинается с минуса — бота нужно
добавить в группу). Вставьте оба значения и нажмите «Отправить тест».

**Метрика.** Вставьте номер счётчика — он подключится к сайту автоматически вместе с целями
`lead`, `lead_open`, `calc_use`, `call_click`. Своя статистика в разделе «Сводка» работает
независимо от Метрики и остаётся, даже если счётчик убрать.

---

## Что где лежит

| Задача | Файл |
|---|---|
| Схема базы и настройки по умолчанию | `server/src/db.js` |
| Стартовый контент | `server/data/seed.json` (генерируется из `src/data` командой `node scripts/export-seed.mjs`) |
| Публичный API контента | `server/src/routes/content.js` |
| Приём заявок и событий | `server/src/routes/public.js` |
| Админский API | `server/src/routes/admin.js` |
| Универсальный CRUD по таблицам | `server/src/lib/crud.js` |
| Сообщения в Telegram | `server/src/lib/telegram.js` |
| Подключение сайта к API | `src/lib/content.tsx` |
| Сбор событий и Метрика | `src/lib/analytics.ts` |
