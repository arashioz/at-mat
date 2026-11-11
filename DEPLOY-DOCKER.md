# دپلوی ات‌مت با Docker Compose و Git

این روش کل استک (API، پنل ادمین، سایت، MongoDB، MinIO) را در کانتینر اجرا می‌کند و Nginx روی میزبان درخواست‌ها را به آن‌ها می‌فرستد. تفاوت اصلی با [DEPLOYMENT.md](DEPLOYMENT.md): آنجا سه برنامه Node با systemd روی میزبان اجرا می‌شدند؛ اینجا همه در Docker هستند. `DEPLOYMENT.md` برای جزئیات MinIO source-build، بازیابی دارایی‌ها و بکاپ همچنان مرجع است.

نام‌های نمونه را با مقادیر واقعی عوض کنید: `example.com` (سایت)، `admin.example.com` (پنل)، `media.example.com` (تصاویر)، `SERVER_IP` و مسیر `/srv/at-mat`.

## ۱. پیش‌نیاز سرور

```sh
sudo apt update
sudo apt install -y git unzip curl ca-certificates openssl nginx
sudo systemctl enable --now docker nginx
node --version   # باید 22 باشد
sudo docker compose version
```

DNS: رکورد A برای سه دامنه به `SERVER_IP`. فایروال: فقط 80، 443 و SSH باز باشد.

## ۲. دریافت سورس و دارایی‌ها

```sh
sudo install -d -o deploy -g deploy /srv/at-mat
git clone --branch main https://github.com/arashioz/at-mat.git /srv/at-mat
cd /srv/at-mat
```

دارایی‌ها در گیت نیستند و **قبل از build** باید سر جایشان باشند (فونت‌ها برای build سایت و manifest برای هر سه ایمیج لازم است):

```sh
unzip /home/deploy/at-mat-deploy-assets-2026-11-08.zip -d /home/deploy/
cd /home/deploy/at-mat-deploy-assets && sha256sum -c SHA256SUMS
cd /srv/at-mat && cp -a /home/deploy/at-mat-deploy-assets/repo/. .
npm run check:assets   # باید ۵ فونت و ورودی‌های manifest را تأیید کند
```

پوشه `assets/` باید مالک `deploy` و قابل نوشتن باشد؛ API همان‌جا manifest را به‌روز می‌کند.

## ۳. فایل‌های env

فقط دو فایل برای Docker لازم است: `.env` ریشه (متغیرهای Compose) و `backend/.env` (متغیرهای API).

```sh
cd /srv/at-mat
umask 077
cp .env.example .env
cp backend/.env.example backend/.env
chmod 600 .env backend/.env
```

در `.env` ریشه:

```dotenv
MINIO_ROOT_USER=YOUR_STORAGE_ACCESS_KEY
MINIO_ROOT_PASSWORD=YOUR_STRONG_STORAGE_SECRET
NEXT_PUBLIC_SITE_URL=https://example.com
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

`MONGO_URI` و `MINIO_ENDPOINT` روی `127.0.0.1` می‌مانند: `compose.apps.yml` آن‌ها را داخل کانتینر به `mongo:27017` و `minio:9000` بازنویسی می‌کند. `JWT_SECRET` را با `openssl rand -hex 32` بسازید. مقادیر MinIO در دو فایل باید یکسان باشند.

## ۴. بالا آوردن استک

```sh
cd /srv/at-mat
docker compose -p atmat -f compose.server.yml -f compose.apps.yml config --quiet
npm run docker:up
npm run docker:ps
```

یا با `npm run docker:up`. build اول چند دقیقه طول می‌کشد (ساخت MinIO از سورس و build سه برنامه). نام پروژه همیشه `atmat` باشد؛ نام volumeها به آن وابسته است.

بررسی:

```sh
curl --fail http://127.0.0.1:3010/api/health
docker compose -p atmat -f compose.server.yml -f compose.apps.yml logs -f backend
```

## ۵. بازیابی تصاویر و مقالات

```sh
cd /srv/at-mat
ATMAT_ASSET_BUNDLE=/home/deploy/at-mat-deploy-assets npm run assets:restore
ATMAT_ARTICLE_SEED_FILE=/home/deploy/at-mat-deploy-assets/content/published-articles.json npm run seed:articles
```

انتظار: ۱۱۵ تصویر بازیابی و ۱۰ مقاله منتشر شود.

## ۶. Nginx

```sh
sudo cp /srv/at-mat/deploy/nginx/atmat-proxy.conf /etc/nginx/snippets/atmat-proxy.conf
sudo cp /srv/at-mat/deploy/nginx/atmat.conf /etc/nginx/sites-available/atmat
sudo sed -i 's/example\.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/atmat
sudo ln -s /etc/nginx/sites-available/atmat /etc/nginx/sites-enabled/atmat
sudo nginx -t && sudo systemctl reload nginx
```

`YOUR_DOMAIN` همان دامنه اصلی است؛ سه دامنه باید در DNS به سرور اشاره کنند.

## ۷. HTTPS

```sh
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx --redirect -d example.com -d admin.example.com -d media.example.com
```

## ۸. بررسی نهایی

```sh
cd /srv/at-mat
npm run check:integration
curl --fail --head https://example.com/
```

سپس در مرورگر وارد `https://admin.example.com` شوید، یک مقاله و آپلود تصویر را بررسی کنید.

## به‌روزرسانی با Git

```sh
cd /srv/at-mat
docker compose -p atmat -f compose.server.yml -f compose.apps.yml down
git pull --ff-only origin main
npm run docker:up
```

اگر `assets/` یا فونت‌ها تغییر کرده باشند، بسته دارایی جدید را قبل از build کپی کنید. برای تغییر دامنه یا `NEXT_PUBLIC_*` باید ایمیج‌های `web` و `admin` دوباره build شوند، چون Next.js آن‌ها را در زمان build ثابت می‌کند:

```sh
NEXT_PUBLIC_SITE_URL=https://example.com docker compose -p atmat -f compose.server.yml -f compose.apps.yml build web admin
```

## نکات

- هرگز `down -v` نزنید؛ volumeهای MongoDB و MinIO پاک می‌شوند.
- فایل‌های env در گیت نیستند و داخل ایمیج کپی نمی‌شوند (`.dockerignore`).
- پورت‌های 3001، 3002، 3010، 27018، 9000 و 9001 فقط روی loopback منتشر شده‌اند؛ ورودی عمومی Nginx است.
- بکاپ: `docker run --rm -v atmat_mongo-data:/data -v $(pwd):/backup alpine tar czf /backup/mongo.tgz /data` و به همین شکل برای `atmat_minio-data`.
