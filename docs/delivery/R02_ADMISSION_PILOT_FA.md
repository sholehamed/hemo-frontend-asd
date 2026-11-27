# R02 — پایلوت گزارش آماری پذیرش
- مبنای فرانت: c441d3f9، CI قبل از تغییر 64/64؛ بک‌اند bc4eb0f0، 119/119 و Seed هشت مسیر اختیاری.
- فقط /admission/stats به children همان AppLayout و authGuardGuard اصلی افزوده شده است؛ سایر featureها هنوز فعال نشده‌اند. منوی مستقل، guard یا login جدید ساخته نشده.
- سرویس AdmissionsService اکنون از HemoCompanyHttp استفاده می‌کند: API_BASE_URL موجود شرکت و همان HttpClient/AuthInterceptor. پاسخ blob مانند generated client (برای 400 که interceptor از FileReader استفاده می‌کند) و decode JSON؛ خطای ProblemDetails به HttpErrorResponse برگردانده می‌شود. سایر سرویس‌های HEMO هنوز تبدیل نشده‌اند.
- هفت تست جدید: قرارداد HTTP و headerهای شرکت، query، 204، 400/403؛ Guard واقعی با AuthService fixture، login/forbidden و pattern دقیق. تست‌ها شبکه خارجی ندارند. CI نتیجه جدید هنوز تأیید نشده.
- Login عادی برای نقش‌های آزمایشی غیرمدیریتی به Package/OrgLocation نیاز دارد؛ SubPath اصلی '/Hemo' است و Seed فعلی ریشه منوها را ساخته، نه درخت /Hemo. بنابراین direct route pilot به معنی آماده بودن منوی واقعی یا ورود حساب‌های آزمایشی نیست. برای آزمون واقعی پس از تکمیل ساختار بسته و نقش در محیط Development استفاده شود.
- تغییرات ظاهری و بازاستفاده فرم‌ها R03، سایر مسیرها و APIها و invalidate هنگام تغییر نقش R02؛ بدون تغییر Shared Auth، environment، pipeline، backend یا main.
