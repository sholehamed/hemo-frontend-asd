# R02 — راهنمای یکپارچه کاربران و پذیرش تحویل
نسخه مبنا: Integration a4d10b4b و backend main f2f1e3d0. این سند نتیجه CI جدید یا UAT را پیشاپیش تأیید نمی‌کند.
## شروع
در محیط آزمایشی شرکت از Login و انتخاب نقش/مرکز موجود استفاده کنید. در منوی هموویژیلانس، فقط صفحات دارای مجوز نمایش داده می‌شوند. صفحه اصلی شرکت / تغییر نکرده؛ داشبورد HEMO /hemo/dashboard و تنظیمات مرکز /hemo/quality/facility است. حساب‌های آموزشی توسط مدیر محیط آزمایشی با رمزهای مجزا ایجاد می‌شوند.
## مسیرهای تمرین (داده کاملاً مصنوعی)
| مرحله | حساب / نقش | عملیات و نتیجه قابل انتظار |
|---|---|---|
| ۱ | hemo.admission | پذیرش، تکمیل هویت و سوابق، دریافت مچ‌بند؛ آمادگی ترخیص پیش از تکمیل گردش خون مجاز نیست |
| ۲ | hemo.nurse | انتخاب پذیرش و ثبت/ارسال درخواست پرستاری |
| ۳ | hemo.doctor | بررسی و تأیید یا بازگشت مستند درخواست |
| ۴ | hemo.equipment.tech / hemo.equipment.reviewer | ثبت و سرویس تجهیز، آزادسازی مستقل، کنترل دما |
| ۵ | hemo.bloodbank / hemo.bank.supervisor | دریافت واحد، بازرسی مستقل، آزمایش سازگاری، رزرو و آماده‌سازی؛ صدور حواله |
| ۶ | hemo.nurse / hemo.nurse.witness | دریافت، تطبیق اولیه، شاهد مستقل، ثبت پایش و گردش تزریق |
| ۷ | hemo.doctor / hemo.bloodbank | بررسی مستند واکنش یا برگشت و تعیین تکلیف مجاز |
| ۸ | hemo.hv.officer / hemo.hv.reviewer | RCA، CAPA، بررسی مستقل و گزارش دوره‌ای؛ مسئول مصوبه یا اقدام تنها در محدوده مجاز |
| ۹ | hemo.quality.officer / hemo.quality.reviewer | QC، کمیته، ممیزی، آموزش، مشخصات مرکز و بازبینی مستقل |
| ۱۰ | hemo.dashboard.manager | آمار هفت حوزه و مقایسه دو هفته؛ عدم دسترسی به جزئیات بیمار یا ثبت |
| ۱۱ | hemo.admission | بررسی آمادگی اداری ترخیص پس از تکمیل گردش |
در مرورگر واقعی، مسیرهای شکست را نیز آزمایش کنید: نقش اشتباه، تغییر نشست حین درخواست، نسخه قدیمی، نقص فیلد، منع تأیید توسط سازنده، منع آزادسازی تجهیز فاقد شرایط، و عدم تکرار ثبت پس از پاسخ نامشخص.
## راهنماهای تفصیلی
- [ورود شرکت](R02_COMPANY_LOGIN_FA.md)، [نقش و نشست](R02_ROLE_LIFECYCLE_FA.md)
- [پذیرش](R02_ADMISSION_CREATE_DETAIL_FA.md)، [بازبینی](R02_ADMISSION_REVIEWS_FA.md)، [مچ‌بند](R02_WRISTBAND_FA.md)
- [درخواست](R02_BLOOD_REQUEST_FORMS_FA.md)، [جزئیات](R02_BLOOD_REQUEST_DETAIL_FA.md)
- [بانک](R02_BANK_COMPLETE_PAGES_FA.md)، [عملیات واحد](R02_BANK_UNIT_OPERATIONS_FA.md)
- [تحویل و تزریق](R02_TRANSFER_OPERATIONS_FA.md)، [واکنش](R02_HV_OPERATIONS_FA.md)، [گزارش](R02_HV_REPORTS_FA.md)
- [تجهیزات](R02_EQUIPMENT_OPERATIONS_FA.md)، [کیفیت](R02_QUALITY_OPERATIONS_FA.md)، [مدیریت](R02_MANAGEMENT_DASHBOARD_FA.md)
## کنترل فنی تحویل
قرارداد ۶۲ مسیر در r02-active-route-contract.json با Router جاری و Seed سمت سرور تطبیق داده شده است؛ r02-route-inventory.json صرفاً فهرست تاریخی قبل از R02 است. تست‌های Angular/Karma از HTTP fixture استفاده می‌کنند؛ تست SQL واقعی Backend از handler و claim آزمایشی استفاده می‌کند، نه Login/HTTP واقعی. UAT مرورگر در محیط شرکت، اتصال امن DB، چاپ واقعی، تأیید قرارداد HIS/SMS/خدمات بیرونی و سیاست تعیین تکلیف کسری درخواست هنوز الزامی هستند. تست موفق نرم‌افزار مجوز استفاده بالینی نیست.
