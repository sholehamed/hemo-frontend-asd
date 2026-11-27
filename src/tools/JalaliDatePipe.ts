import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-jalaali';

@Pipe({
  name: 'PersianDate',
  standalone: true
})
export class GregorianToJalaliPipe implements PipeTransform {
  transform(value: string | Date, format: string = 'jYYYY/jMM/jDD HH:mm:ss'): string {
    if (!value) return '';
    
    let tehranTime = moment(value).format(format);
    tehranTime=tehranTime.replace('00:00:00','')
    return tehranTime;
  }
}
