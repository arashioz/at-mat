# بستهٔ دارایی‌های دپلوی ات‌مت — ۲۰۲۶/۱۱/۰۸

این بسته مکمل سورس GitHub است. هیچ فایل env، رمز، توکن، اطلاعات کاربران، سفارش‌ها یا بکاپ دیتابیس در آن قرار ندارد.

## محتوا

- repo/assets/: manifest اصلی API و سوابق پرامپت‌ها؛ بدون ویرایش دستی manifest.
- repo/web/src/fonts/: پنج فونت Peyda، فونت Shrikhand و مجوز موجود Shrikhand. مجوز استفادهٔ Peyda باید در اختیار دریافت‌کننده باشد.
- minio/at-mat-assets/: اشیای واقعی MinIO با کلیدهای اصلی، نه اسکرین‌شات صفحات.
- content/published-articles.json: خروجی محتوای عمومی 10 مقاله برای راه‌اندازی دیتابیس تازه؛ بدون حساب‌ها و اطلاعات ورود.
- inventory.json و SHA256SUMS: فهرست و checksum فایل‌ها برای کنترل انتقال.

## بازیابی

1. سورس main را از GitHub دریافت و npm run install:all را از ریشه اجرا کنید.
2. محتوای repo/ این بسته را در ریشهٔ clone کپی کنید تا assets/ و web/src/fonts/ در مسیرهای اصلی قرار بگیرند.
3. فایل‌های env را از نمونه‌های مخزن بسازید و اطلاعات اختصاصی محیط مقصد را تنظیم کنید. مقادیر replace-with-... را تغییر دهید. کلیدهای MinIO در env ریشه و بک‌اند باید یکسان باشند. هیچ اطلاعات ورود واقعی در این زیپ نیست.
4. MongoDB و MinIO مقصد را بالا بیاورید. فایل‌های داخل minio/at-mat-assets/ را با ابزار S3-compatible به bucket مقصد برگردانید؛ کلیدها و Content-Type را حفظ کنید. با MinIO Client پس از تنظیم alias خصوصی به نام target: mc mb --ignore-existing target/at-mat-assets و سپس mc mirror minio/at-mat-assets/ target/at-mat-assets/. اطلاعات ورود را در سورس یا خروجی عمومی ذخیره نکنید.
5. ATMAT_MEDIA_URL سایت و MINIO_ENDPOINT، MINIO_BUCKET و MINIO_PUBLIC_URL بک‌اند را برای میزبان و bucket مقصد تنظیم کنید. URLهای اصلی manifest متعلق به محیط محلی مبدأ هستند؛ قبل از استفادهٔ ادمین در دامنهٔ عمومی، آدرس عمومی رسانه را با محیط مقصد هماهنگ کنید و خود manifest را دستی بازنویسی نکنید. keyهای موجود باید حفظ شوند.
6. روی دیتابیس تازه، در صورت نیاز محتوای content/published-articles.json را به backend/seeds/articles.json کپی کنید و پس از آماده‌شدن API، npm run seed:articles را اجرا کنید. روی دیتابیس موجود این seed مقاله‌های موجود را بازنویسی نمی‌کند. برای انتقال کاربران و دیگر داده‌های عملیاتی، بکاپ دیتابیس جداگانه و خصوصی لازم است.
7. npm run check:assets و npm run build را اجرا کنید؛ با npm start هر سه برنامه بالا می‌آیند. سپس npm run check:integration را اجرا کنید.

manifest باید بین API و سایت مشترک و قابل خواندن باشد؛ API نیاز به دسترسی نوشتن در assets/ دارد. فونت‌ها باید پیش از build نصب شوند. برای سرور خارجی localhost را با دامنه‌ها و hostnameهای قابل دسترس جایگزین کنید و NEXT_PUBLIC_SITE_URL را قبل از build تنظیم کنید.

## ورودی قدیمی ناموجود

- products/f7a75897-87ae-4ff1-86f4-e284e543e811.png: فایل از قبل در MinIO مبدأ وجود ندارد؛ در صفحات فعلی استفاده نمی‌شود و manifest اصلی بدون تغییر حفظ شده است.

## صحت بسته

در پوشهٔ همین فایل اجرا کنید: shasum -a 256 -c SHA256SUMS
