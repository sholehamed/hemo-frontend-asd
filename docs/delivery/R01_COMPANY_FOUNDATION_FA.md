# R01 — بازگرداندن مبنای فرانت‌اند شرکت
- شاخه مستقل feature/r01-company-foundation از ST09 سبز c4a792aaa7f6fe9c541b66ab73f32d076df71f82؛ main و backend دست نخورده.
- مبنای اصلی شرکت commit e386c80227a83f9b666734328ad1fed0ea8a7c66 است. angular.json، tsconfig.json، tsconfig.app.json، src/main.ts، src/index.html و package-lock.json عین blobهای اولیه بازگردانده شدند. package.json از همان manifest اصلی با افزودن scripts test:hemo/test:smoke/check (بدون تغییر dependencies) استفاده می‌کند. npm test همان Karma اصلی است.
- Lock اصلی: Angular core 19.0.5، CLI 19.0.6، PrimeNG 19.0.9، TypeScript 5.6.3، Zone.js 0.15.0. نه upgrade، نه --force، نه --legacy-peer-deps.
- Bootstrap اصلی شرکت با Sakai/PrimeNG و AuthInterceptor، DateAdapter، assets/styles اصلی و zone.js فعال است. jQuery/jQuery-captcha در bundle فعال یا manifest وجود ندارد. Login/Shared/Identity routes و محیط شرکت بدون تغییر.
- کدهای HEMO ST01–09، فایل‌های تست browser، API clients و مدل‌ها حذف نشده‌اند؛ هنوز به layout اصلی متصل نشده‌اند و app مستقل HEMO فعال نیست. jsbarcode و Playwright برای R02+ باید به lock واقعی به صورت دقیق اضافه شوند؛ نه حذف از تاریخچه و نه ادعای اجرای browser regression. 
- CI مستقل PR به ST09: npm ci، npm ls، HEMO unit/model/static tests، build شرکت؛ job مستقل Karma شرکت. دو تست جدید قرارداد bootstrap/lock/scripts/assets. وضعیت نتیجه CI هنگام ثبت: pending.
- R02: افزودن lazy routes HEMO به layout شرکت، HemoContextService به جای AuthService دوم، قرارداد نقش/Url/SystemGUID/menu و API host، سازگاری خطاها، تست واقعی و browser. تا R07 merge به main یا انتشار ممنوع.
- محدودیت: هیچ آزمون اتصال واقعی به API شرکت در R01 انجام نشده. تنظیمات محیط یا امنیتی تغییر داده نشده؛ اصلاح مشکلات احتمالی baseline فقط با مستندات و محدوده روشن.

## نتیجه بازبینی تست‌های قدیمی شرکت
- CI 46044951398: Build و 35 تست HEMO/R01 موفق؛ Karma در Typeهای Jasmine شکست خورد. اصلاح فقط tsconfig.spec.json.
- CI 46045110119: Karma اجرا شد؛ 18 شکست از 22 مورد به علت Standalone declarations و Providerهای غایب. تست‌ها در Host واقعی NgForm و با HttpTestingController و وابستگی‌های آزمایشی اصلاح شدند؛ هیچ تست حذف یا skip نشد.
- CI 46046102901: Build موفق؛ 20/22 تست Karma موفق. دو خطای واقعی در Dropdown (تغییر ViewInit بعد از بررسی View، NG0100) و MultiTreeSelect (imports غایب، NG0301) باقی ماندند.
- اصلاح محدود در دو کامپوننت موجود: انتقال ViewInit به ngOnInit بدون تغییر interface، افزودن FormsModule/NgIf/TreeSelectModule، حذف binding تکراری در قالب MultiTreeSelect. دو تست قرارداد انتخاب و بررسی render اضافه شد. تغییر به Shared صرفاً رفع خطای اثبات‌شده است؛ Auth/Menu/Identity/Backend تغییر نکرده. CI جدید هنوز تایید نشده است.

## اصلاح CI پس از Merge R01
- اجرای 46046824289 در head 94500378: Build و 35 تست مدل/استاتیک HEMO و 24 تست Karma موفق (59/59). R01 در df1f954a به شاخه توسعه ST09 ادغام شد، نه main.
- اجرای 46047844611 پس از merge در دستور npm test قدیمی گیر کرد، زیرا manifest اصلی شرکت آن را به ng test (watch پیش‌فرض) برگردانده است. Playwright نیز در manifest فعلی R01 نصب نیست و routeهای HEMO هنوز فعال نیستند.
- Workflow قدیمی اکنون برای کد جاری از npm ci، test:hemo، Karma در ChromeHeadless با watch=false و build استفاده می‌کند. Timeout و concurrency اضافه شدند. Browser regression قبلی ST09 در job مستقل روی commit ثابت c4a792aaa7f6fe9c541b66ab73f32d076df71f82 اجرا می‌شود، نه روی کد جدید. هیچ تست E2E حذف نشده است، اما این job جایگزین اعتبارسنجی یکپارچگی نسخه جدید نیست.
- R02/R07 باید E2E روی Angular19 و Layout/Auth واقعی را بازگردانند؛ قبل از آن این شاخه آماده تحویل یا merge به main نیست. اجرای گیرکرده قبلی ممکن است نیاز به Cancel دستی داشته باشد؛ concurrency برای اجراهای جدید اعمال می‌شود.
