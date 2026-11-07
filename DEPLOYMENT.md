# دپلوی یکپارچه ات‌مت روی Ubuntu

این راهنما برای یک سرور تازهٔ Ubuntu 24.04، کاربر `deploy` با دسترسی sudo و اجرای هر سه برنامه روی همان سرور است. سورس مبنا آخرین نسخهٔ `main` شامل `compose.server.yml` و `infra/minio/Dockerfile` است. بستهٔ دارایی‌ها همان `at-mat-deploy-assets-2026-11-08.zip` است و همچنان با این نسخه سازگار است. اصلاح‌های آدرس تصاویر، ساخت MinIO و bind داخلی API در سورس اعمال شده‌اند؛ روی سرور فقط تنظیمات محیط و دامنه‌ها را انجام می‌دهید. اجرای نهایی روی سرور مقصد به DNS و TLS همان محیط وابسته است. راه‌اندازی روی چند کانتینر برنامه یا چند ماشین به تنظیمات دیگری نیاز دارد.

نام‌های نمونه را قبل از اجرا با مقادیر واقعی جایگزین کنید:

- `example.com`: سایت اصلی.
- `admin.example.com`: پنل ادمین و پراکسی API آن.
- `media.example.com`: دسترسی خواندنی به تصاویر.
- `SERVER_IP`: IP عمومی سرور.
- مسیر پروژه: `/srv/at-mat`.
- مسیر بستهٔ استخراج‌شده: `/home/deploy/at-mat-deploy-assets`.

API روی `127.0.0.1:3010`، ادمین روی `127.0.0.1:3001` و سایت روی `127.0.0.1:3002` اجرا می‌شوند. MongoDB و MinIO در Docker هستند و فقط پورت‌های loopback دارند. Nginx درخواست‌های عمومی را به سرویس مناسب می‌فرستد. سایت از API داخلی می‌خواند و پنل با `/api` به همان API متصل می‌شود.

## ۱. پیش‌نیازهای سرور و DNS

با کاربر `deploy` وارد SSH شوید. این کاربر باید وجود داشته باشد، sudo داشته باشد و مالک فایل‌های پروژه باشد؛ برنامه‌ها را با root اجرا نکنید.

```sh
sudo apt update
sudo apt install -y git unzip curl ca-certificates openssl python3 nginx
```

Node.js **نسخهٔ 22** و npm را نصب کنید؛ `web/package.json` نسخهٔ `>=22 <23` می‌خواهد. از [دریافت رسمی Node.js](https://nodejs.org/en/download) نسخهٔ 22 مناسب معماری سرور را انتخاب کنید. Node 24 یا 26 را جایگزین نکنید مگر اینکه ابتدا سازگاری پروژه بررسی شود.

Docker Engine و Compose plugin را طبق [راهنمای رسمی Ubuntu](https://docs.docker.com/engine/install/ubuntu/) نصب و فعال کنید:

```sh
sudo systemctl enable --now docker nginx
node --version
npm --version
sudo docker compose version
```

در DNS برای `example.com`، `admin.example.com` و `media.example.com` رکورد A به `SERVER_IP` بسازید. رکورد AAAA را فقط اگر IPv6 سرور واقعاً تنظیم است قرار دهید. در فایروال ارائه‌دهنده، پورت‌های 80 و 443 و پورت SSH خودتان را مجاز کنید. پورت‌های داخلی برنامه، MongoDB و MinIO نباید عمومی باشند.

## ۲. انتقال زیپ و دریافت سورس

این دستور فقط روی مک مبدأ اجرا می‌شود:

```sh
scp ~/Desktop/at-mat-deploy-assets-2026-11-08.zip deploy@SERVER_IP:/home/deploy/
```

بقیهٔ دستورها روی سرور و با کاربر `deploy` اجرا می‌شوند مگر جایی که sudo آمده است:

```sh
sudo install -d -o deploy -g deploy /srv/at-mat
git clone --branch main https://github.com/arashioz/at-mat.git /srv/at-mat
cd /srv/at-mat
git rev-parse --short HEAD
unzip /home/deploy/at-mat-deploy-assets-2026-11-08.zip -d /home/deploy/
cd /home/deploy/at-mat-deploy-assets
sha256sum -c SHA256SUMS
```

فایل SOURCE-COMMIT داخل زیپ نسخهٔ اولیهٔ بسته را ثبت کرده است؛ دارایی‌ها با آخرین `main` سازگارند. بعد از clone باید فایل‌های `compose.server.yml`، `infra/minio/Dockerfile` و `scripts/restore-assets.mjs` موجود باشند. اگر مخزن خصوصی است، از deploy key فقط‌خواندنی یا روش امن ورود GitHub استفاده کنید؛ توکن را داخل URL ننویسید.

تمام checksumها باید `OK` باشند. سپس:

```sh
cd /srv/at-mat
cp -a /home/deploy/at-mat-deploy-assets/repo/. .
npm run install:all
npm run check:assets
```

این کپی فقط دارایی‌ها و فونت‌ها را برمی‌گرداند و فایل env واقعی ندارد. فایل‌ها باید تحت مالکیت `deploy` باقی بمانند. پوشهٔ `assets/` باید برای API قابل نوشتن و برای سایت قابل خواندن باشد.

## ۳. تنظیم فایل‌های env

روی نصب تازه:

```sh
umask 077
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp admin-web/.env.example admin-web/.env.local
```

در `.env` ریشه، این دو مقدار را با اطلاعات اختصاصی همین سرور پر کنید:

```dotenv
MINIO_ROOT_USER=YOUR_STORAGE_ACCESS_KEY
MINIO_ROOT_PASSWORD=YOUR_STRONG_STORAGE_SECRET
```

در `backend/.env`:

```dotenv
PORT=3010
HOST=127.0.0.1
MONGO_URI=mongodb://127.0.0.1:27018/at_mat_db
JWT_SECRET=YOUR_RANDOM_JWT_SECRET
JWT_EXPIRES_IN=1d
ADMIN_FULL_NAME=AtMat Admin
ADMIN_EMAIL=YOUR_ADMIN_EMAIL
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_PUBLIC_URL=https://media.example.com
MINIO_REGION=us-east-1
MINIO_BUCKET=at-mat-assets
MINIO_ACCESS_KEY=YOUR_STORAGE_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_STRONG_STORAGE_SECRET
```

مقادیر storage در هر دو فایل باید دقیقاً یکسان باشند. `JWT_SECRET` را با مقدار تصادفی، مثلاً خروجی `openssl rand -hex 32` جایگزین کنید. مقادیر نمونه، `YOUR_...` و `replace-with-...` را باقی نگذارید. رمزها را در ویرایشگر خصوصی وارد کنید؛ فایل‌های env را به GitHub یا بستهٔ عمومی نفرستید.

در `web/.env.local`:

```dotenv
ATMAT_API_URL=http://127.0.0.1:3010/api
ATMAT_MEDIA_URL=http://127.0.0.1:9000/at-mat-assets
NEXT_PUBLIC_SITE_URL=https://example.com
```

در `admin-web/.env.local`:

```dotenv
ATMAT_API_URL=http://127.0.0.1:3010/api
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://example.com
```

```sh
chmod 600 .env backend/.env web/.env.local admin-web/.env.local
```

متغیرهای `NEXT_PUBLIC_` وارد خروجی build می‌شوند؛ دامنه‌ها را قبل از build تنظیم کنید. تغییر این مقادیر بعداً به build مجدد نیاز دارد. [مرجع Next.js](https://nextjs.org/docs/app/guides/self-hosting)

## ۴. تنظیمات آماده در سورس

نیازی به تغییر دستی فایل TypeScript، Dockerfile یا Compose روی سرور نیست:

- API آدرس تصاویر قدیمی و جدید را از `MINIO_PUBLIC_URL` و bucket فعلی تولید می‌کند؛ کلیدها و manifest اصلی حفظ می‌شوند.
- API به‌صورت پیش‌فرض روی `127.0.0.1` گوش می‌دهد. `HOST` فقط اگر معماری استقرار واقعاً نیاز دارد قابل تغییر است؛ در این راهنما همان loopback باقی می‌ماند.
- MinIO با revision ثابت `7aac2a2c5b7c882e68c1ce017d8256be2feea27f` از سورس ساخته می‌شود. context ساخت فقط `infra/minio/` است؛ envها و دارایی‌های برنامه وارد context نمی‌شوند.
- `compose.server.yml` پورت‌های MongoDB و MinIO را فقط روی loopback منتشر می‌کند و healthcheck دارد.

آزمون رگرسیون آدرس تصاویر را می‌توانید با `npm run check:storage` اجرا کنید. این آزمون از manifest موقت استفاده می‌کند و هیچ تصویر یا metadata واقعی را تغییر نمی‌دهد.

## ۵. اجرای MongoDB و MinIO

MinIO Community به‌صورت source-only توزیع می‌شود؛ Compose پروژه به دریافت `minio/minio:latest` تکیه نمی‌کند. [منبع رسمی MinIO](https://github.com/minio/minio)

از فایل آمادهٔ مخزن استفاده کنید:

```sh
cd /srv/at-mat
sudo docker compose -p atmat -f compose.server.yml config --quiet
sudo docker compose -p atmat -f compose.server.yml up -d --build --wait
sudo docker compose -p atmat -f compose.server.yml ps
```

build نخست MinIO از سورس می‌تواند زمان و حافظهٔ قابل‌توجهی مصرف کند. فایل `infra/minio/Dockerfile` نسخهٔ Go را هم ثابت می‌کند و از کش BuildKit و حداکثر دو کامپایل هم‌زمان استفاده می‌کند. در صورت خطای پراکسی اصلی Go، mirror عمومی `goproxy.cn` و سپس دریافت مستقیم از مخزن اصلی امتحان می‌شوند؛ بررسی checksum وابستگی‌ها فعال می‌ماند. این fallback برای نسخه‌های عمومی قدیمی که مخزن بالادستی‌شان دیگر در دسترس نیست هم کاربرد دارد. [رفتار رسمی GOPROXY](https://go.dev/ref/mod#goproxy-protocol) فایل‌های Compose و Dockerfile بخشی از سورس هستند و نباید روی سرور بازنویسی یا از گیت خارج شوند.

روی این سرور **همیشه** از `-p atmat -f compose.server.yml` استفاده کنید. دستور `npm run db:up` برای محیط توسعه است؛ نام پروژه و volumeهای محیط توسعه با این روش فرق دارد. نام پروژهٔ Compose را بعداً تغییر ندهید؛ نام volumeها به آن وابسته است. MongoDB این پیکربندی auth ندارد و عمداً فقط روی loopback منتشر شده است؛ برای دسترسی از ماشین‌های دیگر این تنظیم کافی نیست.

## ۶. بازیابی تصاویر از زیپ با کلیدهای اصلی

این مرحله بازیابی بکاپ اشیایی است که قبلاً از API آپلود شده‌اند؛ آن‌ها را مجدداً با نام تصادفی آپلود نکنید، چون مقاله‌ها و manifest به کلیدهای اصلی ارجاع دارند.

اسکریپت آمادهٔ مخزن، ابتدا checksum تمام تصاویر را بررسی می‌کند و سپس آن‌ها را با کلید اصلی و Content-Type ثبت‌شده بازیابی می‌کند. رمزها از env بک‌اند خوانده می‌شوند:

```sh
cd /srv/at-mat
ATMAT_ASSET_BUNDLE=/home/deploy/at-mat-deploy-assets npm run assets:restore
```

در اجرای اولیهٔ این بسته، باید ۱۱۵ تصویر بازیابی شود. این دستور برای بازیابی اولیه است و اشیای دارای همان کلید را در مقصد بازنویسی می‌کند؛ آن را بدون قصد بازیابی روی محیط فعال تکرار نکنید. یک ورودی قدیمی و بدون استفاده در manifest در مبدأ هم فایل ندارد؛ جزئیات در README داخل زیپ ثبت شده است. manifest را برای حذف این مورد دستی تغییر ندهید.

## ۷. Build هر سه بخش

```sh
cd /srv/at-mat
npm run check:assets
npm run build
```

انتظار: build بک‌اند، ادمین و سایت همگی بدون خطا تمام شوند. نصب وابستگی‌ها را با `--omit=dev` قبل از build انجام ندهید؛ TypeScript و ابزارهای build لازم‌اند. فونت‌ها هم باید قبل از build در مسیرهای اصلی باشند.

## ۸. اجرای دائمی با systemd

برای هر برنامه یک سرویس جدا می‌سازیم تا با reboot و خطای پردازش دوباره بالا بیاید. `WorkingDirectory` باید دقیق باشد، چون API و سایت manifest مشترک را با مسیر نسبی می‌خوانند. [مستند systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)

با کاربر `deploy`:

```sh
cd /srv/at-mat
ATMAT_NODE=$(command -v node)

atmat_service() {
  local unit="$1"
  local directory="$2"
  shift 2
  sudo tee "/etc/systemd/system/${unit}.service" >/dev/null <<EOF
[Unit]
Description=AtMat ${unit}
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/srv/at-mat/${directory}
Environment=NODE_ENV=production
ExecStart=${ATMAT_NODE} $*
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
UMask=0077

[Install]
WantedBy=multi-user.target
EOF
}

atmat_service atmat-backend backend dist/main.js
atmat_service atmat-admin admin-web node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001
atmat_service atmat-web web node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3002

sudo systemctl daemon-reload
sudo systemctl enable --now atmat-backend
```

مقدار `ATMAT_NODE` مسیر واقعی Node نصب‌شده را در unit ثبت می‌کند. اگر مسیر یا نسخهٔ Node را بعداً عوض کردید، unitها را هم به‌روز کنید. در این روش فایل env بک‌اند توسط Nest و فایل env هر فرانت توسط Next از WorkingDirectory خودش خوانده می‌شود.

چند ثانیه صبر کنید و API را بررسی کنید:

```sh
curl --fail http://127.0.0.1:3010/api/health
sudo journalctl -u atmat-backend -n 80 --no-pager
```

اگر API آماده نیست، قبل از ادامه خطا را برطرف کنید. بک‌اند در startup ادمین اولیه و سیاست خواندن bucket را تنظیم می‌کند؛ فقط وقتی این مرحله موفق است ادامه دهید.

## ۹. واردکردن مقالات و اجرای فرانت‌ها

برای دیتابیس خالی، نسخهٔ محتوای عمومی داخل زیپ را برای seed قرار دهید:

```sh
cd /srv/at-mat
ATMAT_ARTICLE_SEED_FILE=/home/deploy/at-mat-deploy-assets/content/published-articles.json npm run seed:articles
sudo systemctl enable --now atmat-admin atmat-web
npm run check:integration
```

این فرمان snapshot عمومی داخل زیپ را می‌خواند و فایل seed یا هیچ فایل سورس دیگری را روی سرور تغییر نمی‌دهد. انتظار: ۱۰ مقاله وارد و منتشر شوند و بررسی اتصال موفق شود. seed موارد موجود را بر اساس slug رد می‌کند و روی دیتابیس موجود ویرایش‌ها را جایگزین نمی‌کند. اگر اجرای اولیه نیمه‌کاره ماند، وضعیت draft/published را از پنل بررسی کنید؛ اجرای دوباره، draftهای موجود را خودکار منتشر نمی‌کند.

اطلاعات کاربران و CRM در این زیپ نیست. برای شروع تازه، ادمین از `ADMIN_EMAIL` و `ADMIN_PASSWORD` ساخته می‌شود؛ انتقال کاربران و داده‌های عملیاتی موجود به بکاپ خصوصی MongoDB نیاز دارد. تغییر رمز env، رمز ادمینی را که قبلاً در دیتابیس ساخته شده تغییر نمی‌دهد.

## ۱۰. Nginx و دامنه‌ها

Nginx جلوی هر دو Next.js قرار می‌گیرد؛ buffering را برای پاسخ‌های streaming غیرفعال می‌کنیم. [مستند self-hosting Next.js](https://nextjs.org/docs/app/guides/self-hosting)، [مستند reverse proxy Nginx](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

```sh
sudo tee /etc/nginx/snippets/atmat-proxy.conf >/dev/null <<'NGINX'
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_buffering off;
NGINX
```

فایل سایت‌ها را با دامنه‌های واقعی بسازید:

```sh
sudo tee /etc/nginx/sites-available/atmat >/dev/null <<'NGINX'
server {
    listen 80;
    server_name example.com;
    client_max_body_size 10m;
    location / {
        include snippets/atmat-proxy.conf;
        proxy_pass http://127.0.0.1:3002;
    }
}

server {
    listen 80;
    server_name admin.example.com;
    client_max_body_size 10m;
    location / {
        include snippets/atmat-proxy.conf;
        proxy_pass http://127.0.0.1:3001;
    }
}

server {
    listen 80;
    server_name media.example.com;
    location ^~ /at-mat-assets/ {
        limit_except GET { deny all; }
        include snippets/atmat-proxy.conf;
        proxy_pass http://127.0.0.1:9000;
    }
    location / { return 404; }
}
NGINX

sudo ln -s /etc/nginx/sites-available/atmat /etc/nginx/sites-enabled/atmat
sudo nginx -t
sudo systemctl reload nginx
```

این `ln` برای ایجاد اولیه است؛ اگر لینک از قبل وجود دارد، تکرارش نکنید. در این روش `/api` دامنهٔ ادمین توسط Next به بک‌اند پراکسی می‌شود و به دامنهٔ عمومی جدا برای API نیاز ندارید. فقط خواندن تصاویر روی دامنهٔ media عمومی است و کنسول MinIO عمومی نمی‌شود. مجازکردن GET در Nginx به‌صورت ضمنی HEAD را هم مجاز می‌کند. [مرجع Nginx](https://nginx.org/en/docs/http/ngx_http_core_module.html#limit_except)

برای بررسی HTTP:

```sh
curl --fail --head http://example.com/
curl --fail http://admin.example.com/api/health
```

## ۱۱. HTTPS

طبق [دستورالعمل رسمی Certbot برای Nginx](https://certbot.eff.org/instructions?ws=nginx&os=snap)، Certbot را روی سرور نصب کنید. اگر از روش snap استفاده می‌کنید:

```sh
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx --redirect -d example.com -d admin.example.com -d media.example.com
sudo certbot renew --dry-run
```

این فرمان‌ها نصب تازهٔ snap و نبود لینک قبلی را فرض می‌کنند؛ Certbot موجود را با نصب دوم مخلوط نکنید. پورت 80 و DNS هر سه دامنه باید قبل از صدور گواهی کار کنند. بعد از آن با HTTPS وارد پنل شوید.

## ۱۲. بررسی نهایی

```sh
cd /srv/at-mat
sudo systemctl is-active atmat-backend atmat-admin atmat-web
npm run check:integration
curl --fail --head https://example.com/
curl --fail https://admin.example.com/api/health
```

یک تصویر موجود از inventory را روی دامنهٔ واقعی هم کنترل کنید:

```sh
ATMAT_IMAGE_KEY=$(node -p "JSON.parse(require('fs').readFileSync('/home/deploy/at-mat-deploy-assets/inventory.json','utf8')).objects[0].key")
curl --fail --head "https://media.example.com/at-mat-assets/${ATMAT_IMAGE_KEY}"
```

با ایمیل و رمز تنظیم‌شده وارد `https://admin.example.com` شوید. لیست مقالات، نمایش تصاویر قدیمی و آپلود تصویر جدید را بررسی کنید. سپس یک مقاله را در سایت عمومی باز کنید و صفحات رسپی و طعم‌ها را هم ببینید. تست خودکار داخلی به‌تنهایی صدور TLS، DNS و نمایش تصویر در مرورگر خارجی را اثبات نمی‌کند.

## خطاهای متداول

- **502:** وضعیت و log سرویس upstream را با `systemctl status` و `journalctl -u ...` ببینید؛ WorkingDirectory و مسیر Node را کنترل کنید.
- **تصاویر در سایت سالم‌اند ولی در پنل خراب‌اند:** جدیدبودن نسخهٔ `main`، مقدار `MINIO_PUBLIC_URL`، DNS و HTTPS دامنهٔ media را کنترل کنید؛ پس از تغییر env بک‌اند، سرویس API را restart کنید.
- **مقاله‌ها خالی هستند:** seed را بعد از آماده‌شدن API اجرا کنید؛ تصاویر و manifest باید قبل از seed بازیابی شده باشند.
- **آپلود انجام نمی‌شود:** دسترسی نوشتن کاربر deploy به `assets/`، اطلاعات MinIO، نقش ادمین و سقف ۵ مگابایت API را بررسی کنید.
- **خطای font هنگام build:** پنج فایل Peyda باید قبل از build در `web/src/fonts/peyda/` باشند.
- **AccessDenied در تصاویر:** startup API و تنظیم bucket policy را بررسی کنید. `onModuleInit` خطای MinIO را فقط log می‌کند؛ سالم‌بودن health API به‌تنهایی دسترسی تصاویر را تضمین نمی‌کند.

## به‌روزرسانی و بکاپ

قبل از تغییر نسخه، MongoDB، اشیای MinIO، manifest زنده و envها را به‌صورت خصوصی بکاپ بگیرید. از زیپ اولیه برای بازنویسی manifest زندهٔ سایتی که آپلود جدید داشته استفاده نکنید. تصاویر و manifest باید به‌صورت یک مجموعه نگهداری شوند.

برای به‌روزرسانی، پس از بکاپ و کنترل تغییرات نسخه:

```sh
cd /srv/at-mat
sudo systemctl stop atmat-web atmat-admin atmat-backend
git pull --ff-only origin main
npm run install:all
npm run build
sudo docker compose -p atmat -f compose.server.yml up -d --build --wait
sudo systemctl start atmat-backend atmat-admin atmat-web
npm run check:integration
```

این روش روی همان مسیر فعال و دارای downtime است. اگر هر دستور شکست خورد، قبل از ادامه خطا را برطرف کنید یا نسخهٔ قبلی را بازیابی کنید. seed و کپی دارایی‌های اولیه را هنگام هر به‌روزرسانی تکرار نکنید. برای استقرار بدون downtime باید از مسیرهای release جدا و manifest مشترک استفاده شود.

هیچ‌وقت برای به‌روزرسانی معمول `docker compose down -v` اجرا نکنید؛ `-v` volumeهای داده را حذف می‌کند. دستورهای Docker این راهنما باید همواره با پروژهٔ ثابت `atmat` و فایل `compose.server.yml` اجرا شوند.
