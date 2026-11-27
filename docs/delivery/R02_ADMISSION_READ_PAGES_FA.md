# R02 — صفحات خواندنی پذیرش
مبنای فرانت 395c1b7b: PR14 merge، 83/83 تست، CI پایه با lock ثبت‌شده 11/11 Playwright snapshot. بک‌اند 467fab5e: 120/120.
- دو مسیر /admission/list و /admission/his به AppLayout و authGuardGuard اصلی اضافه شدند؛ /admission/stats همچنان فعال است. Guard الگوی دقیق URL موجود در Seed را بررسی می‌کند. منوی /Hemo بک‌اند فعلاً فقط گزارش آماری را نشان می‌دهد؛ این دو مسیر تا تأیید CI و انتقال منوی مربوطه، با deep link و مجوز واقعی قابل بررسی‌اند.
- HemoPageScope در هر نمونه component ایجاد می‌شود؛ تغییر نقش، token، generation یا destroy، درخواست‌های بعدی را رد و پاسخ دیرهنگام را قبل از مصرف نامعتبر می‌کند. scope اختیاری HemoCompanyHttp در instanceهای محلی فعال است؛ client ورود و سایر مصرف‌کنندگان root تغییر قرارداد ندارند.
- فهرست، CSV و HIS با همان DTO/API موجود کار می‌کنند. فیلتر بخش از stats فقط پس از capability صریح خوانده می‌شود. لینک‌های clinical هنوز متصل نشده موقتاً در این صفحات نمایش داده نمی‌شوند؛ هیچ عملیات بیزینسی حذف نشده. HIS همچنان داده داخلی نشان می‌دهد و اتصال بیرونی ادعا نمی‌کند.
- تست‌ها: سه قرارداد scope/HTTP و دو آزمون رندر واقعی کامپوننت‌ها (mock HTTP)، به‌علاوه تطبیق مسیر Guard. CI در زمان ثبت هنوز تأیید نشده. تست واقعی backend و role switching مرورگر باقی است.
- صفحات create/detail/review/dashboard هنوز فعال نیستند. علت مهم wristband: JsBarcode سراسری در Angular22 قبلی وجود داشت ولی Angular19 فعلی ندارد؛ باید وابستگی با lock معتبر و آزمون چاپ/خوانایی بازگردد. لینک‌های عملیاتی بعد از فعال شدن مقصد بازگردانده شوند. اتصال سایر ماژول‌ها، Package/SSO و پایان R02 همچنان باقی است.
- هیچ حساب یا migration جدید، تغییر AuthService/AuthInterceptor یا backend و هیچ ادغام main frontend انجام نشده است.

## اصلاح CI 46060341794
Build و Node موفق، Karma: 50 موفق و 2 ناموفق. هر دو assertion رندر قبل از پایان decode Blob اجرا شده بودند (DOM هنوز loading). تست‌های واقعی کامپوننت با spy callThrough، Promise همان load و loadWards را صریح await می‌کنند و سپس DOM و busy را بررسی می‌کنند. هیچ assertion قبلی، HTTP fixture، تست امنیتی یا کد تولید تغییر/حذف نشده است. نتیجه اجرای اصلاح‌شده هنوز باید تأیید شود.
