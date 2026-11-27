# HEMO-ASD Frontend — Worklog

**تاریخ ایجاد:** 2026-11-27  
**مقصد:** `sholehamed/hemo-frontend-asd`  
**مبنای مشترک:** Backend ASD `docs/HEMO_ASD_DEVELOPMENT_GUIDE_FA.md`

| ID | اقدام | وضعیت | شواهد |
|---|---|---|---|
| FE-ST00-001 | بررسی tree مخزن Frontend ASD | DONE | `main@7a168d786920749c699d6b72cc270b506547657f`؛ صرفاً `.gitignore` |
| FE-ST00-002 | بررسی مرجع Angular قبلی | DONE (static review) | `sholehamed/hemo-frontend`؛ Angular 22.2.6، standalone و Material |
| FE-ST00-003 | فهرست صفحات Raw / شکست لینک‌های منو | DONE (inventory) | ۶۲ HTML، ۷ حوزه، ۱۲ مسیر غایب |
| FE-ST00-004 | سند الگوهای Angular، UI و Slice | DONE | `docs/HEMO_ASD_FRONTEND_GUIDE_FA.md` |
| FE-ST00-005 | PR مستندات | DONE (OPEN PR) | [Frontend #1](https://github.com/sholehamed/hemo-frontend-asd/pull/1)؛ merge نشده |
| FE-ST01-001 | ایجاد workspace واقعی Angular | TODO | هنوز code/scaffold ایجاد نشده |
| FE-ST01-002 | Auth/layout/menu و قرارداد API با Backend ASD | TODO | هنوز اتصال واقعی برقرار نشده |
| FE-ST02-001 | `HEMO-ADM-001`: UI پذیرش متصل به Backend | TODO | بعد از Gate ST-01 |

**Tracker اصلی:** [HEMO-ASD #2](https://github.com/sholehamed/hemo-backend-asd/issues/2). **Backend docs PR:** [#1](https://github.com/sholehamed/hemo-backend-asd/pull/1).

## تصمیم‌های Frontend

- **ADR-FE-001:** ریپوی مقصد خالی است؛ استاندارد Angular فقط با ارجاع به repo قبلی و نه با ادعای کد موجود در مقصد تعیین می‌شود.
- **ADR-FE-002:** Angular 22 standalone + Material + ReactiveForms/Signals نقطه شروع پیشنهادی است؛ API contracts با Backend ASD بازنویسی می‌شود.
- **ADR-FE-003:** HTML Raw مرجع UX/سناریوست و logic Mock آن وارد production نمی‌شود.
- **ADR-FE-004:** Interceptor route-to-endpoint فقط discovery/logging است و **هرگز منبع مجوز قابل اعتماد** نیست.

## وضعیت تست

| Test | Status | علت |
|---|---|---|
| Angular build | NOT RUN | Workspace در مقصد وجود ندارد |
| Unit tests | NOT RUN | Source وجود ندارد |
| Playwright E2E | NOT RUN | Source و Backend متصل وجود ندارند |
| Access-control E2E | NOT RUN | API و Seed نیاز به آماده‌سازی دارند |

### قالب ثبت توسعه آتی

```text
Date:
Stage / Slice ID:
Raw page / target route:
UI operations and states:
API contract & backend PR:
Changed components / services / guards:
Tests run (command + PASS/FAIL/NOT RUN):
Commit / PR:
Open gaps:
```

هر مرحله باید همراه با commit و نتیجه واقعی تست ثبت شود؛ صرف ظاهر صفحه «تکمیل» محسوب نمی‌شود.

## ST-01 | Angular scaffold

- مالک پروژه: زیرساخت Backend شرکت تغییر نمی‌کند. Angular workspace از الگوی مخزن قبلی، theme با رنگ‌های Raw، login با captcha موجود (`NftCaptchaStyle`)، interceptor با Bearer/UserRole، guard، role picker و shell ریسپانسیو ایجاد شدند. RequestStateComponent، jalali-date.ts و error model قبلی مستقیماً بازاستفاده شدند.
- BotDetect با plugin jQuery برای جلوگیری از وابستگی ماژول قدیمی Angular استفاده شد؛ سازگاری runtime باید روی Backend واقعی آزمون شود. Session token در sessionStorage همان تب، بدون داده بیمار؛ endpoint stats واقعی برای کنترل نمایش منوی پذیرش.
- Build/Tests: NOT RUN. هنوز مرحله ST-02 رابط کاربری در این commit کامل نشده است.
