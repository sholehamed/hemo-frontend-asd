# R02 — چرخه تغییر نقش و اعتبار داده پایلوت
مبنای فرانت 2db86c65، CI ورود 77/77؛ بک‌اند 467fab5e، 120/120.
- Hook اختیاری MENU_ROLE_CONTEXT در AppLayout این پروژه، قبل/بعد از SetUserRole موجود اجرا می‌شود؛ بدون تغییر AuthService، AuthInterceptor، Guard، Login، backend یا ساختار نقش. رفتار قدیمی AppMenu در نبود provider حفظ می‌شود. در این پروژه منو در تغییر نقش خالی می‌شود و درخواست قبلی منو لغو و پاسخ دیرهنگام کنار گذاشته می‌شود.
- HemoRoleLifecycle پیش از تغییر نقش generation را افزایش و HemoContextService را reset می‌کند؛ بعد از تغییر نقش در مسیر HEMO به ریشه موجود بازمی‌گردد. ورود مجدد به گزارش از guard شرکت می‌گذرد؛ مسیرهای غیر HEMO redirect نمی‌شوند.
- صفحه فعال /admission/stats تنها در همان role/token/generation نمایش داده می‌شود؛ پس از تغییر نقش، token یا destruction، پاسخ دیرهنگام قابل مشاهده نیست و print/export غیرفعال است. برای refresh Token فعلاً fail-closed و بازگشت به خانه نیاز است. این تصمیم محافظه‌کارانه است؛ بازبارگذاری خودکار پس از اعتبارسنجی مجدد هنوز پیاده نشده.
- شش تست جدید lifecycle، منو و report؛ fixture هستند. کلینیک و سایر صفحات HEMO هنوز به runtime اصلی وصل نشده‌اند. این تغییر اثبات لغو تمام درخواست‌های درحال اجرا در interceptor یا تست واقعی login/refresh نیست.
- CI جدید در زمان ثبت تأیید نشده است. هیچ حساب جدید یا migration وجود ندارد.
