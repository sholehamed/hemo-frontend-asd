import { DateAdapter } from '@angular/material/core';
import jalaliMoment from 'moment-jalaali';

// تنظیمات locale فارسی
jalaliMoment.loadPersian({ dialect: 'persian-modern' });

export const PERSIAN_DATE_FORMATS = {
  parse: {
    dateInput: 'jYYYY/jMM/jDD',
  },
  display: {
    dateInput: 'jYYYY/jMM/jDD',
    monthYearLabel: 'jMMMM jYYYY',
    dateA11yLabel: 'jYYYY/jMM/jDD',
    monthYearA11yLabel: 'jMMMM jYYYY',
  },
};
export class MaterialPersianDateAdapter extends DateAdapter<jalaliMoment.Moment> {
  constructor() {
    super();
    super.setLocale('fa');
  }

  getYear(date: jalaliMoment.Moment): number {
    return date.jYear();
  }

  getMonth(date: jalaliMoment.Moment): number {
    return date.jMonth();
  }

  getDate(date: jalaliMoment.Moment): number {
    return date.jDate();
  }

  getDayOfWeek(date: jalaliMoment.Moment): number {
    return date.day();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    switch (style) {
      case 'long':
        return [
          'فروردین', 'اردیبهشت', 'خرداد',
          'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر',
          'دی', 'بهمن', 'اسفند'
        ];
      case 'short':
        return [
          'فروردین', 'اردیبهشت', 'خرداد',
          'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر',
          'دی', 'بهمن', 'اسفند'
        ];
      case 'narrow':
        return ['ف', 'ا', 'خ', 'ت', 'م', 'ش', 'م', 'آ', 'آ', 'د', 'ب', 'ا'];
    }
  }

  getDateNames(): string[] {
    return Array(31).fill(0).map((_, i) => String(i + 1));
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    switch (style) {
      case 'long':
        return ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
      case 'short':
        return ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
      case 'narrow':
        return ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
    }
  }

  getYearName(date: jalaliMoment.Moment): string {
    return date.jYear().toString();
  }

  getFirstDayOfWeek(): number {
    return 6; // شروع هفته از شنبه
  }

  getNumDaysInMonth(date: jalaliMoment.Moment): number {
    return date.daysInMonth();
  }

  clone(date: jalaliMoment.Moment): jalaliMoment.Moment {
    return date.clone().locale('fa');
  }
 createDate(year: number, month: number, date: number): jalaliMoment.Moment {
    if (month < 0 || month > 11) {
      throw new Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    // ایجاد تاریخ با تنظیم زمان به UTC و بدون در نظر گرفتن زمان محلی
    const result = jalaliMoment.utc()
      .jYear(year)
      .jMonth(month)
      .jDate(date)
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0)
      .locale('fa');

    if (!result.isValid()) {
      throw new Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result.local(); // تبدیل به زمان محلی پس از ایجاد تاریخ
  }

  today(): jalaliMoment.Moment {
    // تاریخ امروز با زمان محلی و بدون در نظر گرفتن ساعت
    return jalaliMoment().locale('fa').startOf('day');
  }

  parse(value: any, parseFormat: string | string[]): jalaliMoment.Moment | null {
    if (!value) return null;

    let date: jalaliMoment.Moment;
    
    if (typeof value === 'string') {
      // پارس کردن به صورت UTC و سپس تبدیل به زمان محلی
      date = jalaliMoment.utc(value, parseFormat, 'fa')
        .hours(0)
        .minutes(0)
        .seconds(0)
        .milliseconds(0)
        .local();
    } else if (jalaliMoment.isMoment(value)) {
      date = value.clone().startOf('day');
    } else if (value instanceof Date) {
      date = jalaliMoment(value).startOf('day');
    } else {
      return null;
    }

    return date.isValid() ? date.locale('fa') : null;
  }

  format(date: jalaliMoment.Moment, displayFormat: string): string {
    if (!this.isValid(date)) {
      throw Error('MaterialPersianDateAdapter: Cannot format invalid date.');
    }
    return date.format(displayFormat);
  }

  addCalendarYears(date: jalaliMoment.Moment, years: number): jalaliMoment.Moment {
    return date.clone().add(years, 'jYear');
  }

  addCalendarMonths(date: jalaliMoment.Moment, months: number): jalaliMoment.Moment {
    return date.clone().add(months, 'jMonth');
  }

  addCalendarDays(date: jalaliMoment.Moment, days: number): jalaliMoment.Moment {
    return date.clone().add(days, 'day');
  }

  toIso8601(date: jalaliMoment.Moment): string {
    return date.toISOString();
  }

  isDateInstance(obj: any): boolean {
    return jalaliMoment.isMoment(obj);
  }

  isValid(date: jalaliMoment.Moment): boolean {
    return date.isValid();
  }

  invalid(): jalaliMoment.Moment {
    return jalaliMoment.invalid();
  }

  override deserialize(value: any): jalaliMoment.Moment | null {
    let date;
    if (value instanceof Date) {
      date = jalaliMoment(value);
    } else if (typeof value === 'string') {
      if (!value) return null;
      date = jalaliMoment(value).locale('fa');
    }
    return date && this.isValid(date) ? date : super.deserialize(value);
  }
}