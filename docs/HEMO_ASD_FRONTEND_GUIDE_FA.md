# HEMO-ASD Frontend — قرارداد توسعه و نگاشت دمو

**نسخه:** 0.1.0 — ST-00  
**تاریخ:** 2026-11-27  
**وضعیت واقعی repo:** در شاخه `main` مخزن `sholehamed/hemo-frontend-asd` فقط فایل `.gitignore` وجود دارد؛ Angular workspace هنوز پیاده‌سازی نشده است.

## 1. اهداف و منابع

- مقصد قطعی: `sholehamed/hemo-frontend-asd`. Backend قطعی: `sholehamed/hemo-backend-asd`.
- UI مرجع: `sholehamed/hemo-raw`، ۶۲ فایل HTML، فایل `assets/menu.js`.
- مرجع نمونه الگوهای Angular: `sholehamed/hemo-frontend`، Angular 22.2.6 standalone، Angular Material، lazy route، Reactive Forms، signals، typed API services، guard، interceptor، node smoke tests و Playwright E2E.
- تحلیل تفصیلی ۶۲ صفحه در Backend ASD: `docs/reference/HEMO_WORKFLOWS_AND_DATA_MODEL_FA.md`؛ برنامه اصلی: `docs/HEMO_ASD_DEVELOPMENT_GUIDE_FA.md`.

**مرزبندی:** استانداردهای Angular فوق از «ریپوی قبلی» استخراج شده‌اند و وضعیت قطعی مقصد نیستند. ابتدا scaffold نسخه سازگار و یک API contract واقعی ایجاد می‌شود. کپی کامل فرانت قبلی بدون تطبیق API مجاز نیست.

## 2. اصول اجرایی

1. Single Angular application با صفحات نقش‌محور و داده مشترک. UI پذیرش، پرستار، پزشک و بانک خون نباید برای یک بیمار cacheهای متناقض مستقل بسازند.
2. Standalone Components، Lazy loaded routes، `core` برای زیرساخت و API، `shared` برای کامپوننت‌های قابل استفاده مجدد، `features` برای حوزه‌های کسب‌وکار.
3. Angular Material به‌عنوان پایه کنترل‌های سازگار و Accessibility؛ تفاوت‌های ظاهری HEMO Raw در design tokens و theme بازسازی شود. Layout راست‌به‌چپ و فارسی، امکان داده‌های mixed LTR (کد کیسه/شماره) و تاریخ جلالی.
4. `HttpClient` از طریق `*.service.ts` با DTOهای typed؛ View نباید SQL، جزئیات Authorization یا URLهای پراکنده داشته باشد. endpointها از OpenAPI/قرارداد واقعی Backend ASD استخراج شوند.
5. Use Case به Use Case: هر دکمه/فرم/Modal می‌تواند عملیات جدا باشد؛ رفتار loading/validation/error/empty/success مخصوص خودش را داشته باشد.
6. Store و Signal فقط برای وضعیت presentation/session به‌اندازه نیاز؛ منبع حقیقت بیمار/درخواست/کیسه Backend و دیتابیس است. اطلاعات حساس در localStorage یا console log ذخیره نشود.
7. Guard منو و صفحه UX است؛ Backend باید role، permission و محدوده OrgLocation/Department را enforce کند.
8. خطاهای شبکه و API با TraceId نشان داده شوند، PII و stack trace فاش نشوند. عملیات حساس idempotent یا دارای کنترل ارسال مجدد باشند.
9. اصل حفظ UI: هر صفحه Raw قبل از تبدیل با checklist کنترل‌ها/فیلدها/فیلترها/دکمه‌ها/تغییر وضعیت و سناریوها مقایسه شود؛ ولی Mockهای JavaScript مستقیماً به production کپی نشوند.

## 3. ساختار پیشنهادی فایل‌ها (پس از ST-01)

```text
src/app/
  core/
    api/          # typed endpoints / DTO / interceptors / errors
    auth/         # auth state, permission, route guards
    navigation/   # backend-driven menu, route endpoint discovery
    session/      # facility and department scope
  shared/
    components/   # data table, toolbar, request-state, confirm-dialog ...
    pipes/        # persian digits, dates, formatting
    validators/   # reusable form validators
  features/
    admission/
    nursing/
    doctor/
    blood-bank/
    supervisor/
    hemovigilance/
    equipment/
    admin/
  app.config.ts
  app.routes.ts
```

> این ساختار پیشنهاد بر مبنای repo Angular قبلی است، نه ادعای وجود فعلی در repo مقصد. اگر الگوی موجود Backend/API الزام دیگری داشت در ADR ثبت شود.

## 4. نگاشت UI موجود به Featureهای جدید

| Feature | فایل‌های Raw (گروه) | اولین خروجی واقعی |
|---|---|---|
| admission | `admission-*.html` (۸ صفحه) | پذیرش جدید، فهرست و جزئیات، اعتبارسنجی |
| nursing | `nurse-*.html` (۹ صفحه شامل یک Copy) | ثبت درخواست فرآورده، فهرست درخواست‌ها و پایش |
| doctor | `doctor-*.html` (۸ صفحه) | کارتابل تأیید/رد و تاریخچه درخواست |
| blood-bank | `bloodbank-*.html` (۷ صفحه) | دریافت درخواست، کراس‌مچ، موجودی |
| supervisor | `supervisor-*.html` (۱۳ صفحه) | دریافت، تحویل، برگشت و QC |
| hemovigilance | `hemovigilance-*.html` (۸ صفحه) | ثبت و تحلیل واکنش و گزارش‌ها |
| equipment | `equipment-*.html` (۵ صفحه) | شناسنامه تجهیزات/PM/دما |
| common | `login.html` و ۳ فایل variant/artefact | ورود و navigation واحد؛ variantها پس از مقایسه ادغام |

فایل‌های `artifact (20).html`، `artifact (23).html`، `crossmatch-updated.html` و تکراری‌های `nurse-tasks - Copy.html` و `supervisor-crossmatch1.html` قبل از تبدیل تعیین تکلیف می‌شوند. وجود فایل تکراری به معنای یک route جدید نیست.

### لینک‌های شکسته در منوی دمو

`nurse-monitoring.html`, `nurse-workitems.html`, `supervisor-special.html`, `supervisor-quarterly.html`, `supervisor-quality.html`, `supervisor-staff.html`, `hv-manager-dashboard.html`, `hv-analysis.html`, `hv-committee.html`, `hv-training.html`, `hv-audit.html`, `hv-reports.html`.

این ۱۲ مقصد در tree دمو وجود ندارند. بر اساس نقش و قابلیت به صفحات موجود یا کامپوننت جدید دارای نیازمندی صریح نگاشت شوند؛ نه ایجاد صفحه خالی.

## 5. الگوی Feature Slice

**مثال `HEMO-ADM-001`:**

- Raw references: `admission-new-patient.html`, `admission-patient-list.html`.
- `admission-create.component`: Reactive Form بیمار/پذیرش، validations، disabled/pending، خطا و success؛ مسیر guard شده.
- `admissions.service`: قراردادهای typed endpoint واقعی `FindPatient`, `CreateAdmission`, `GetAdmission` (نام نهایی endpoint از Backend ASD استخراج شود).
- Context: مرکز/بخش انتخابی از session/permission، نه شناسه آزاد در فرم که بتواند از Scope مجاز خارج شود.
- Tests: فرم معتبر/نامعتبر، بیمار تکراری، مجهول‌الهویه، عدم مجوز، قطع شبکه، ارسال دوباره، خطای سرور و render RTL.
- E2E: ورود پذیرش → ثبت بیمار → ایجاد پذیرش → نمایش در فهرست → بازیابی پس از refresh.

## 6. دسترسی صفحه↔endpoint در معماری موجود ASD

Backend ASD ساختار `Role` / `RoleAccess` / `Menu` / `MenuApi` / `Api` دارد؛ از همین مدل پس از بازبینی استفاده شود.

- `route-access.interceptor` می‌تواند مسیر Angular مبدأِ **درخواست واقعاً اجراشده** را به header مورد توافق Backend اضافه کند؛ تغییر Route، تغییر نقش و navigation باید در نظر گرفته شوند.
- در حالت تست/تحلیل، هر عمل UI فعال اجرا می‌شود و mapping دقیق `route + HTTP method + normalized endpoint` تولید می‌گردد.
- ابزار export فقط فهرست کشف‌شده را می‌سازد؛ **کشف ناقص ≠ دسترسی کامل**.
- Backend ابزار import برای role/route/api با preview/diff و idempotency ارائه می‌کند؛ import به‌خودی خود اجازه استفاده را برقرار نمی‌کند مگر تصمیم مدیر مجاز.
- کنترل دسترسی واقعی هر endpoint مستقل از header ادعایی Frontend انجام می‌شود؛ header route از client قابل جعل است و نباید به‌عنوان security principal پذیرفته شود.

## 7. Definition of Done هر صفحه

- تمام کنترل‌های مرتبط با Use Case شناسایی شده باشند.
- تعامل‌ها به API واقعی متصل و قرارداد typed شده باشند.
- loading / error / success / empty / forbidden با UI مناسب پیاده شده باشد.
- سطوح دسترسی Role + OrgLocation/Department واقعاً enforce شوند.
- سناریوهای خوش‌بینانه و ناموفق در test پوشش داده شوند.
- Mock و داده جعلی runtime production جایگزین نشده باشد.
- واحدها و جلالی/ارقام فارسی، responsive/RTL و کاربری کیبورد بررسی شوند.
- `HEMO_ASD_WORKLOG.md`، commit و PR با Slice ID مشترک Backend به‌روز شوند.

## 8. گام‌های اجرایی

| Stage | کار Frontend | Gate |
|---|---|---|
| ST-00 | این سند، نگاشت ۶۲ صفحه و فهرست موانع | PR مستندات |
| ST-01 | ایجاد Angular workspace و CI/production build؛ login و shell؛ منو و API integration | build واقعی و smoke سبز |
| ST-02 | پذیرش واقعی، لیست و جزئیات | تست browser و API |
| ST-03 | پرستاری و پزشک: درخواست/تأیید | تست نقش و transition |
| ST-04 | بانک خون: Crossmatch، موجودی | تست وابستگی داده |
| ST-05 | تحویل، برگشت، تزریق و پایش | تست end-to-end |
| ST-06 | واکنش و هموویژیلانس | تست workflow و Audit |
| ST-07 | تجهیزات، گزارش‌ها، منوهای admin | تست role و فیلتر داده |
| ST-08 | تست سناریوهای کامل، رگرسیون، راهنمای کاربر | همه Gateها سبز |

**تست‌های وضعیت فعلی:** اجرا نشده‌اند؛ repo مقصد هنوز build ندارد. نتایج واقعی با تاریخ/commit در Worklog ثبت خواهند شد.
