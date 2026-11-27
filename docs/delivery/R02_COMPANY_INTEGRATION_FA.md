# R02 — اتصال HEMO به زیرساخت اصلی
وضعیت: شروع شده، اتصال runtime هنوز انجام نشده.
مبنا: R01 merge df1f954a331f80daa4d970e928b8499cb25b5de8؛ CI 46046824289، 59/59 و build سبز.

## یافته‌های قطعی
- Guard شرکت الگوی کامل route را در sessionStorage.url ثبت می‌کند و برای مسیر غیر از '/'، CheckPagePermission را فراخوانی می‌کند. AuthInterceptor شرکت Authorization/UserRole/Url/SystemGUID و RefreshToken را مدیریت می‌کند.
- HemoDemoSeed در backend شاخه ST09 فقط شش مسیر اصلی /admission، /hemo/requests، /hemo/bank، /hemo/transfusion، /hemo/hv، /hemo/quality را برای Menu/RoleAccess ثبت می‌کند. 61 مسیر guarded در UI موجودند؛ 54 مسیر زیرمجموعه (غیر از شش ریشه و home) باید جداگانه بررسی شوند. اضافه کردن همه endpointها به همه مسیرها یا همه نقش‌ها مجاز نیست.
- Login اصلی UserClient.login را استفاده می‌کند؛ HemoSessionEndpoints مسیر اختصاصی HEMO دارد که UserLoginCommand.ForHemo و HemoLoginContext.IssueAsync را فراخوانی می‌کند. باید صدور Token و فهرست نقش‌ها، SystemGUID و حالت OTP/ForceChangePassword با مسیر اصلی در محیط تست تطبیق داده شوند؛ حذف endpoint یا تغییر مسیر login بدون این بررسی انجام نشود.
- inventory فایل r02-route-inventory.json فقط فهرست مسیر و الگوی Guard و گروه فعلی Seed است؛ هیچ grant جدیدی نیست. home به عنوان root پیشنهادی شرکت مشخص شده، هنوز route فعال نشده.
- HemoContextService جدید صرفاً قابلیت‌های تخصصی شش ماژول را از API موجود با AuthService/HttpClient شرکت دریافت می‌کند؛ بدون login، storage، interceptor، role picker یا منوی دوم. در فقدان token/role هیچ درخواست ارسال نمی‌شود. پاسخ دیرهنگام نقش قبلی کنار گذاشته می‌شود و خطای یک module به معنی grant نیست. تست‌ها با HTTP fixture اجرا می‌شوند؛ هنوز به runtime و تغییر نقش/refresh متصل نشده است.
- تست coverage مسیرها و چهار تست Context اضافه شده‌اند. R01 Build/CI مستقل حفظ شده است. 

## گام‌های بعدی R02
1. بررسی Token اصلی شرکت با حساب‌های HEMO seed و تطبیق AppMenu/SubPath و UserRole؛ عدم بازنویسی Identity.
2. تهیه ماتریس دقیق route → method/path از API client و templateهای واقعی، تعیین menu نمایان و detail route پنهان، تکمیل Seed صرفاً HEMO با RoleAccess موجود و تست عدم افزایش مجوز؛ بررسی اینکه capability endpoints و عملیات مرتبط با نقش از طریق pipeline شرکت قابل دسترس‌اند.
3. انتقال HEMO routes به AppLayout و Guard اصلی، هماهنگی API base و ProblemDetails، استفاده از Context جدید و حذف تدریجی auth/shell/login موازی از مسیر اجرا؛ hook محدود invalidation در تغییر نقش/خروج.
4. Build همه featureها با Angular19، بازیابی وابستگی‌های ضروری barcode و browser runner در lockfile، E2E و تست واقعی login/captcha/role/menu/refresh/403/deep link. هیچ تست بالینی یا داده اصلی تغییر نکند.
5. تا تکمیل R02–R07 و CI/UAT، main و production دست نخورده بمانند.
