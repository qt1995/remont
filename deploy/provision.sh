#!/usr/bin/env bash
# Развёртывание сайта «Ремонт под ключ» на чистой Ubuntu 24.04.
# Скрипт идемпотентный: можно запускать повторно.
set -euo pipefail

DOMAIN="pro-comfort.pro"
ROOT="/srv/pro-comfort"
APP="$ROOT/app"
REPO="$ROOT/repo.git"
USER_NAME="procomfort"
PORT=4000

echo "=== 1. Пакеты ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx ufw ca-certificates sqlite3 >/dev/null

if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
fi
echo "node $(node -v), npm $(npm -v), nginx $(nginx -v 2>&1 | sed 's|nginx version: ||')"

echo "=== 2. Пользователь и каталоги ==="
id -u "$USER_NAME" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$USER_NAME"
mkdir -p "$ROOT" "$APP" "$ROOT/data" "$ROOT/uploads" "/home/$USER_NAME/.ssh"

# Данные и загрузки лежат вне рабочей копии — деплой их не трогает
chown -R "$USER_NAME:$USER_NAME" "$ROOT" "/home/$USER_NAME/.ssh"
chmod 700 "/home/$USER_NAME/.ssh"

# Тот же ключ, которым заходим под root
if [ -f /root/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys "/home/$USER_NAME/.ssh/authorized_keys"
  chown "$USER_NAME:$USER_NAME" "/home/$USER_NAME/.ssh/authorized_keys"
  chmod 600 "/home/$USER_NAME/.ssh/authorized_keys"
fi

echo "=== 3. Переменные окружения ==="
if [ ! -f "$ROOT/env" ]; then
  JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > "$ROOT/env" <<ENVEOF
NODE_ENV=production
PORT=$PORT
JWT_SECRET=$JWT
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://qt1995.github.io
TRUST_PROXY=1
COOKIE_SECURE=1
COOKIE_SAMESITE=lax
DB_PATH=$ROOT/data/app.db
UPLOAD_DIR=$ROOT/uploads
ENVEOF
  chown "$USER_NAME:$USER_NAME" "$ROOT/env"
  chmod 600 "$ROOT/env"
  echo "создан $ROOT/env с новым JWT_SECRET"
else
  echo "$ROOT/env уже есть — не трогаем"
fi

echo "=== 4. Пустой git-репозиторий для деплоя ==="
if [ ! -d "$REPO" ]; then
  sudo -u "$USER_NAME" git init --bare -q -b main "$REPO"
fi

# Сам хук лежит в репозитории (deploy/post-receive) и ставится при первом деплое.
# До первого пуша кладём заглушку, которая подтянет настоящий хук из кода.
if [ ! -f "$REPO/hooks/post-receive" ]; then
  cat > "$REPO/hooks/post-receive" <<'BOOTEOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT="/srv/pro-comfort"
git --work-tree="$ROOT/app" --git-dir="$ROOT/repo.git" checkout -f main
install -m 755 "$ROOT/app/deploy/post-receive" "$ROOT/repo.git/hooks/post-receive"
echo "--- Хук обновлён из репозитория, повторите git push production main"
BOOTEOF
fi

chmod +x "$REPO/hooks/post-receive"
chown -R "$USER_NAME:$USER_NAME" "$REPO"

echo "=== 5. Право перезапускать сервис без пароля ==="
cat > /etc/sudoers.d/procomfort <<SUDOEOF
$USER_NAME ALL=(root) NOPASSWD: /usr/bin/systemctl restart procomfort, /usr/bin/systemctl is-active procomfort, /usr/bin/systemctl status procomfort
SUDOEOF
chmod 440 /etc/sudoers.d/procomfort

echo "=== 6. systemd ==="
cat > /etc/systemd/system/procomfort.service <<UNITEOF
[Unit]
Description=Pro Comfort — сайт и админка
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$APP/server
EnvironmentFile=$ROOT/env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# База и загрузки — единственное, что сервису нужно писать
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=$ROOT/data $ROOT/uploads

[Install]
WantedBy=multi-user.target
UNITEOF

systemctl daemon-reload
systemctl enable procomfort >/dev/null 2>&1

echo "=== 7. nginx ==="
cat > /etc/nginx/sites-available/procomfort <<'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name pro-comfort.pro www.pro-comfort.pro _;

    client_max_body_size 12m;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # Файлы из админки и собранная статика — с хешем в имени, можно кэшировать надолго
    location ~* ^/(assets|admin/assets)/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/procomfort /etc/nginx/sites-enabled/procomfort
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=== 8. Файрвол ==="
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ufw status | head -6

echo
echo "=== Сервер подготовлен ==="
echo "Пустой репозиторий для пуша: $USER_NAME@$(hostname -I | awk '{print $1}'):$REPO"
