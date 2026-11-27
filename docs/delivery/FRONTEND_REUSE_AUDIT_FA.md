# بازبینی معماری و بازاستفاده فرانت‌اند HEMO
تاریخ: 2026-11-27 — بازبینی استاتیک، بدون تغییر کد اجرایی.
مبنای ساختار شرکت: main @ efef527a69536ed50e4d2949283c99af6433491e
مبنای HEMO شامل ST09: feature/st-09-dashboards @ c4a792aaa7f6fe9c541b66ab73f32d076df71f82
مقایسه بازگرداندن فایل‌های شرکت: aa205e9c57b7c98e70c5b91fa0c72a605939d035..efef527a69536ed50e4d2949283c99af6433491e: 292 فایل (291 added, 1 modified). این تعداد، تعداد فایل‌های حذف‌شده در ST01 نیست. فهرست تغییرات PRهای 2 تا 9 شامل 41 مسیر یکتای features/**/*.component.ts است؛ تعداد کامپوننت‌های لازم برای بازنویسی نیست.

## P0: دو زیرساخت فعال/غیرفعال
- src/main.ts از src/app/app.config.ts و src/app/app.component.ts استفاده می‌کند، نه src/app.config.ts و src/app.component.ts.
- angular.json فعال فقط styles.css و assets:[] دارد؛ اسکریپت‌های global jquery/jquery-captcha/jsbarcode. package.json Angular 22.2.6، lock اصلی Angular19 Sakai؛ ST09 lock ناسازگار را به docs/legacy منتقل کرده است، هنوز lock سازگار با زیرساخت شرکت تولید نشده.
- app.config.ts شرکت PrimeNG/Aura، Persian Material adapter، API_BASE_URL، AuthInterceptor و انیمیشن‌ها دارد. حفظ آن به عنوان مبنا، نه downgrade صوری یا حذف Material که date-input موجود به آن نیاز دارد.
- مسیرهای اصلی، Login و Sakai AppLayout، Topbar، Sidebar، footer، role picker و منوی داینامیک باید همان پیاده‌سازی شرکت باشند. routeهای HEMO باید به children اضافه شوند؛ مسیری که در Menu ثبت می‌شود باید با الگوی guard یکسان باشد.

## P0: قرارداد دسترسی و نشست
- شرکت: Shared/Services/AuthService.ts، AuthInterceptor.ts، Shared/AuthGuard/auth-guard.guard.ts و Shared/layout/component/app.menu.ts. نگهداری Token/userRole/UserRole، route pattern در sessionStorage.url؛ CheckPagePermission، هدر Authorization/UserRole/Url/SystemGUID، RefreshToken و MenuClient.menuBindUserMenu(environment.SubPath).
- HEMO: core/auth/auth.service.ts و auth.guard.ts و identity.interceptor.ts. session جدا hemo-asd-session، ورود /Identity/HemoSession/Login، guard صرفاً loggedIn، interceptor فقط /Identity/ نسبی با X-Page-Route و 401 clear/redirect. این اختلاف یکپارچگی اثبات‌شده است؛ نتیجه آن در محیط واقعی هنوز تست نشده و به معنای اثبات bypass مجوز در backend نیست.
- Login موجود Shared/pages/auth/login.ts از UserClient.login و ShareCaptchaComponent استفاده می‌کند؛ CaptchaService با HttpClient دریافت HTML از /captchaendpoint انجام می‌دهد. بدون jquery. از تغییر سرویس امنیتی شرکت خودداری شود. بررسی اختلاف قرارداد OTP/forceChangePassword و رفتار refresh/logout ضروری است.
- Capabilityهای admission/request/bank/transfusion/hv/quality که UI تخصصی به آنها نیاز دارد باید به HemoContextService با وابستگی به نشست و نقش شرکت منتقل شوند، بدون Token، AuthGuard، Interceptor یا منوی عمومی دوم. هنگام تغییر نقش: پاکسازی context، عدم نمایش داده قبلی، جلوگیری از نتیجه دیرهنگام درخواست قبلی؛ در صورت فقدان hook مناسب یک extension محدود پس از بررسی.
- APIهای HEMO فعلاً URL نسبی مانند /Identity/PatientAdmission دارند؛ API client شرکت از API_BASE_URL/environment.apiUrl استفاده می‌کند. هماهنگی آدرس، قرارداد خطا، interceptor و route permissions پیش از تغییر UI.
- حذف HemoSession backend یا تغییر seed/MenuApi/RoleAccess بدون بررسی callers و مجوز مجاز نیست. این بازبینی فقط frontend است.

## P1: موجودی Shared/Components (14 خانواده)
| نام | کاربرد پیشنهادی | نکته |
|---|---|---|
| input-string | نام/شناسه/کد | Type/maxlength/DataValueChange |
| input-number | تعداد/دما/حجم | دقت، اعشار، منفی، null، min/max باید حفظ شوند؛ minlength/maxlength معادل محدوده عددی نیست |
| input-textarea | شرح و علت | Rows و Required |
| date-input | تاریخ | NgForm و DateAdapter؛ خروجی Date/null نه رشته ISO؛ timezone و تاریخ بدون ساعت باید تست شوند |
| input-time | ساعت | showSeconds؛ قرارداد دقیق value باید تست شود |
| dropdown | انتخاب‌های تخصصی | DataIdName/OptionName/Options/OptionsUrl؛ SelectFirstItem در داده بالینی نباید انتخاب ناخواسته کند |
| checkbox | چک‌لیست | Readonly/DataValueChange؛ تأیید الزامی حفظ شود |
| multi-select-input | چند گزینه | حفظ مدل شناسه‌ها |
| input-tree-select | سلسله‌مراتب | فقط نیاز واقعی |
| multi-tree-select | چندگانه درختی | فقط نیاز واقعی |
| single-file-upload | پیوست | فقط در روند دارای مجوز و نیاز؛ حفظ سیاست خصوصی فایل |
| submit-button | ثبت | بررسی FormIsValid و جلوگیری از ارسال تکراری |
| input-password | ورود | reuse Login |
| share-captcha | ورود | reuse Login، بدون jquery |

همه کنترل‌ها لزوماً معادل یک‌به‌یک ندارند. قراردادهای Data/DataValueChange و NgForm موجود با ReactiveForms فعلی متفاوت است؛ ابتدا pilot، bridge محدود در صورت نیاز و تست اعتبارسنجی، نه تغییر عمومی Shared. برای کنترل‌های تخصصی مانند بارکد/مچ‌بند، وضعیت، چک‌لیست، admission picker و کارت‌های آماری، component تخصصی حفظ شود. jsbarcode مستقل است؛ حذف jquery و jquery-captcha بعد از حذف مصرف‌کنندگان و بررسی global scripts. 
StaticFunctions.ShowError/ShowSuccess/confirm، JalaliDatePipe و MaterialPersianDateAdapter موجودند؛ مقایسه معنای تاریخ و خطا، حفظ پیام‌های ProblemDetails و جلوگیری از حذف validation مهم است.
BaseComponent (Shared/base) دارای DataUrl، Params، TableConfig، pagination، sort، filter و templateهای Header/Body/RowActions/Actions است. HEMO list DTOها مانند AdmissionFilters دارای search/status/ward و pageNumber/pageSize هستند؛ فیلتر عمومی Base را بدون adapter قرارداد یا پشتیبانی server به endpoint نفرستید. Base صرفاً برای لیست مناسب reuse شود و برای جدول تخصصی workflow الزامی نیست. TreeBase فقط در صورت نیاز.

## شواهد نمونه قالب
admission-create: 11 input, 5 select, 2 textarea + 4 mat-checkbox
request-form: 32 input, 9 select, 9 textarea
bank-receive: 8 input, 2 select, 1 textarea
transfer-detail: 16 input, 2 select, 2 textarea
hv-detail: 10 input, 9 select, 10 textarea
quality-detail: 13 input, 3 select, 5 textarea
جمع 149 تگ input/select/textarea در 6 فایل؛ نه تعداد فیلد یکتا یا تعداد جایگزینی قطعی. شمارش استاتیک، شاخه ST09.

## مراحل اصلاح پیشنهادی (هنوز اجرا نشده)
R00 حفظ نقطه بازیابی ST09 و inventory کامل؛ بررسی baseline واقعی شرکت و فایل‌های build/environment بدون تغییر secrets.
R01 بازگرداندن Angular19 + package/lock سازگار + Sakai/PrimeNG/assets/styles/zone و CI. Build خود شرکت پیش از افزودن ماژول.
R02 اتصال HEMO به AppLayout/route guard/منوی DB و AuthService اصلی؛ جداکردن capability context؛ تطبیق route/API و کنترل تغییر نقش و نشست.
R03 نمونه پذیرش: فرم + تاریخ + فهرست BaseComponent (در صورت سازگاری) + error handling؛ verify API payload/permissions.
R04 درخواست خون و بانک: جایگزینی کنترل‌ها، حفظ گردش و اطلاعات، numeric range و شناسه و انقضا.
R05 تزریق و HV: حفظ شاهد مستقل، ترتیب رویداد، timestamp، چک‌لیست و ثبت دلیل.
R06 تجهیزات، کیفیت و داشبورد: حفظ گزارش‌ها و capability؛ منو داینامیک؛ بازبینی accessibility و RTL.
R07 gate: npm ci با lock واقعی، build، unit و Playwright تمام سناریوها، real backend test DB با seed، login واقعی/captcha/refresh/403/deep link/role switch/route header، APIهای مجاز و منع درخواست غیرمجاز، رابط کاربری و UAT. هیچ migration یا بازنویسی backend عمومی بدون درخواست مستقل.

## محدودیت و وضعیت
آخرین CI ST09 frontend در run 46040710159 سبز است؛ این نتیجه فقط workspace فعلی و تست‌های mock مربوط به آن است. این شاخه audit فقط سند را تغییر می‌دهد. Build با Angular19، بررسی تک‌تک templateها، تطبیق کامل menu seed و API clients، آزمون واقعی نشست و backend انجام نشده؛ تست سبز قبلی تأیید یکپارچگی با شرکت نیست. تغییرات اجرایی و merge انجام نشده‌اند.
