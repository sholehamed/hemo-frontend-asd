# R01 — بازگرداندن مبنای فرانت‌اند شرکت
- شاخه مستقل feature/r01-company-foundation از ST09 سبز c4a792aaa7f6fe9c541b66ab73f32d076df71f82؛ main و backend دست نخورده.
- مبنای اصلی شرکت commit e386c80227a83f9b666734328ad1fed0ea8a7c66 است. angular.json، tsconfig.json، tsconfig.app.json، src/main.ts، src/index.html و package-lock.json عین blobهای اولیه بازگردانده شدند. package.json از همان manifest اصلی با افزودن scripts test:hemo/test:smoke/check (بدون تغییر dependencies) استفاده می‌کند. npm test همان Karma اصلی است.
- Lock اصلی: Angular core 19.0.5، CLI 19.0.6، PrimeNG 19.0.9، TypeScript 5.6.3، Zone.js 0.15.0. نه upgrade، نه --force، نه --legacy-peer-deps.
- Bootstrap اصلی شرکت با Sakai/PrimeNG و AuthInterceptor، DateAdapter، assets/styles اصلی و zone.js فعال است. jQuery/jQuery-captcha در bundle فعال یا manifest وجود ندارد. Login/Shared/Identity routes و محیط شرکت بدون تغییر.
- کدهای HEMO ST01–09، فایل‌های تست browser، API clients و مدل‌ها حذف نشده‌اند؛ هنوز به layout اصلی متصل نشده‌اند و app مستقل HEMO فعال نیست. jsbarcode و Playwright برای R02+ باید به lock واقعی به صورت دقیق اضافه شوند؛ نه حذف از تاریخچه و نه ادعای اجرای browser regression. 
- CI مستقل PR به ST09: npm ci، npm ls، HEMO unit/model/static tests، build شرکت؛ job مستقل Karma شرکت. دو تست جدید قرارداد bootstrap/lock/scripts/assets. وضعیت نتیجه CI هنگام ثبت: pending.
- R02: افزودن lazy routes HEMO به layout شرکت، HemoContextService به جای AuthService دوم، قرارداد نقش/Url/SystemGUID/menu و API host، سازگاری خطاها، تست واقعی و browser. تا R07 merge به main یا انتشار ممنوع.
- محدودیت: هیچ آزمون اتصال واقعی به API شرکت در R01 انجام نشده. تنظیمات محیط یا امنیتی تغییر داده نشده؛ اصلاح مشکلات احتمالی baseline فقط با مستندات و محدوده روشن.
