import { NgForm, ControlContainer, FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';
import { NgIf } from '@angular/common';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
    selector: 'app-input-number',
    templateUrl: './input-number.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./input-number.component.css'],
    imports: [
        InputNumberModule,
        FormsModule,
        NgIf
    ],
    standalone: true
})
export class InputNumberComponent implements OnInit {
  @Input() Direction: any = "rtl"
  @Input() Placeholder: string = ""
  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
  @Input() Label: string = ""
  @Input() Data: any=""
  @Output() DataValueChange = new EventEmitter();
 Name: string="";
  @Input() maxlength: number;
  @Input() minlength: number ;
  @Input() ReadOnly: boolean = false;
    @Input()  useGrouping: boolean = false;
  constructor() {

   }

  ngOnInit(): void {
      this.Name=StaticFunctions.GetUUID();

  }


  OnDataValueChange(Data: any) {
    this.DataValueChange.emit(Data);
  }

}
