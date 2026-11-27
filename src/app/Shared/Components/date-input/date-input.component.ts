
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  styleUrls: ['./date-input.component.css'],
  imports: [
    NgIf,
    MatDatepickerModule,
    FormsModule,
    InputTextModule
  ],
  standalone: true
})
export class DateInputComponent implements OnInit {


  @Input() ReadOnly: boolean = false
  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
  @Input() Disabled: boolean = false
  @Input() ShowLable: boolean = true
  @Input() Label: string = ""
  @Input() Data: any;
  @Input() MaxDate: any
  @Input() MinDate: any
  PersianData: any
  @Output() DataValueChange = new EventEmitter();
  Name: string = "";
  @Input() placeholder = "جهت انتخاب تاریخ کلیک نمایید.";
  constructor() {

  }
  ngAfterViewInit() {

    try {

    } catch (error) {

    }
  }

  ngOnInit(): void {
    this.Name = StaticFunctions.GetUUID();
  }

  OnDataValueChange(Data: Date) {
    if (Data) {
      this.DataValueChange.emit(Data);
    } else {
      this.DataValueChange.emit(null);
    }
  }

}
