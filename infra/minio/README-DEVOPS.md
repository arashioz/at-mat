# بستهٔ افزایشی دارایی‌های ات‌مت · ۲۰۲۶/۱۱/۱۳

کامیت متناظر در `SOURCE-COMMIT.txt` آمده است. این بسته روی بستهٔ پایهٔ `at-mat-deploy-assets-2026-11-08.zip` نصب می‌شود. در محیطی که بستهٔ پایه بازیابی شده، همین بستهٔ افزایشی کافی است.

- ۹ تصویر شامل عکس و پوستر ساحل، تصویرسازی شش طعم و پترن بسته‌بندی، به‌همراه ویدیوی MP4.
- `inventory.json` شامل مسیر داخل MinIO، مسیر درخواست از سایت، نوع فایل، اندازه و SHA-256 هر دارایی است.
- `repo/assets/image-manifest.json` نسخهٔ ثبت‌شدهٔ manifest مبدأ است. اسکریپت فقط رکوردهای مربوط به تصاویر این بسته را به manifest فعلی مقصد اضافه می‌کند.
- `content/published-articles.json` محتوای عمومی ۱۳ مقاله برای seed است. سه مقالهٔ اضافه‌شده بعد از بستهٔ پایه در inventory مشخص شده‌اند. ۳۰ رسپی پایه در سورس قرار دارند.
- فایل‌های env، حساب‌ها، گفتگوها و بکاپ MongoDB جزو بسته نیستند. فونت‌ها در بستهٔ پایه‌اند.

## بررسی فایل‌ها

پس از استخراج ZIP در `/home/deploy`:

```sh
cd /home/deploy/at-mat-assets-update
sha256sum -c SHA256SUMS
cd /srv/at-mat
ATMAT_ASSET_BUNDLE=/home/deploy/at-mat-assets-update node scripts/restore-assets.mjs --verify-only
```

برای نصب تازه، ابتدا بستهٔ پایه را طبق `DEPLOYMENT.md` کپی و بازیابی کنید. برای به‌روزرسانی سرور فعال، پیش از شروع از manifest زنده و اشیای MinIO بکاپ بگیرید و هنگام وارد کردن بسته، نویسنده‌های manifest را متوقف کنید. نمونهٔ تک‌سرور در بخش «به‌روزرسانی و بکاپ» راهنمای استقرار آمده است.

## واردکردن دارایی‌ها

این دستور از ریشهٔ ریپو، با کد همین کامیت و MinIO فعال اجرا می‌شود. اتصال MinIO از `backend/.env` خوانده می‌شود.

```sh
ATMAT_ASSET_BUNDLE=/home/deploy/at-mat-assets-update npm run assets:restore
```

اسکریپت وجود دارایی‌های پایه را بررسی می‌کند. فایل‌های تازه با کلید و Content-Type اصلی در bucket مقصد ثبت می‌شوند. فایل موجود با محتوای متفاوت خطا می‌دهد. اجرای مجدد پس از موفقیت فایل و رکورد تکراری نمی‌سازد. فایل manifest داخل زیپ را روی manifest زنده کپی نکنید.

بعد از build و بالا آمدن API، اگر مقاله‌های جدید هنوز در مقصد نیستند:

```sh
ATMAT_ARTICLE_SEED_FILE=/home/deploy/at-mat-assets-update/content/published-articles.json npm run seed:articles
npm run check:integration
```

seed براساس slug، مقاله‌های موجود را رد می‌کند. در نصب تازه ۱۳ مقاله را وارد می‌کند.

## آدرس‌ها و منبع ویدیو

ویدیو در MinIO با کلید `branding/atmat-home-coast.mp4` و نوع `video/mp4` ثبت می‌شود و از `/media/branding/atmat-home-coast.mp4` روی دامنهٔ سایت پخش می‌شود. مسیر سایر فایل‌ها در `inventory.json` آمده است.

منبع ویدیوی ساحل در مستند سورس پروژه [Mixkit](https://mixkit.co/free-stock-video/waves-coming-to-the-beach-5016/) ثبت شده است.

یک ورودی قدیمی manifest با کلید `products/f7a75897-87ae-4ff1-86f4-e284e543e811.png` از زمان بستهٔ پایه در مخزن فایل ندارد. در بررسی اتصال، صفحه‌های فعلی به آن ارجاع نمی‌دادند.
