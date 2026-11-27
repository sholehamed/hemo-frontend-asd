import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { Calendar, CalendarModule } from 'primeng/calendar';
import { NgIf } from '@angular/common';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
  selector: 'app-input-time',
  templateUrl: './input-time.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  styleUrl: './input-time.component.css',
  imports: [
    CalendarModule,
    FormsModule,
    NgIf
  ],
  standalone: true
})
export class InputTimeComponent {
  @Input() Placeholder: string = ""
  @Input() Direction: any = "rtl"
  @Input() Submitted: boolean = false
  @Input() ReadOnly: boolean = false
  @Input() Required: boolean = false
  @Input() showSeconds: boolean = true;
  @Input() Label: string = ""
  @Input() Data: any
  @Output() DataValueChange = new EventEmitter();
  Name: string = "";


  TimeData: string | null;
  ngOnInit(): void {
    this.Name = StaticFunctions.GetUUID();
  }

  Clear() {
      this.Data=null;
      this.TimeData=null;
    this.DataValueChange.emit(null)
  }


  OnDataValueChange(Data: Date) {


    let hour = new Date(Data).getHours().toString();
    let min = new Date(Data).getMinutes().toString();

    if (hour.length == 1) {
      hour = "0" + hour;
    }
    if (min.length == 1) {
      min = "0" + min;
    }

    if (this.showSeconds) {
      let Sec = new Date(Data).getSeconds().toString();
      if (Sec.length == 1) {
        Sec = "0" + Sec;
      }
      this.Data = `${hour}:${min}:${Sec}`;
    } else {
      this.Data = `${hour}:${min}`;
    }
    this.DataValueChange.emit(this.Data)

  }

  ngOnChanges(changes: any) {
    if (this.TimeData == null && changes.Data != null && changes.Data != '') {
      this.TimeData = this.Data;
    }
  }

}
