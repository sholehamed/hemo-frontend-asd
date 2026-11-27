import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { InputText } from 'primeng/inputtext';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-input-string',
    templateUrl: './input-string.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./input-string.component.css'],
    imports: [
        FormsModule,
        InputText,
        NgIf
    ],
    standalone: true
})
export class InputStringComponent implements OnInit {

  @Input() Placeholder: string = ""
  @Input() Type: any = "text"
  @Input() Direction: any = "rtl"
  @Input() Submitted: boolean = false
  @Input() ReadOnly: boolean = false
  @Input() Required: boolean = false
  @Input() filterInput: boolean = false
  @Input() Label: string = ""
  @Input() Data: any
  @Output() DataValueChange = new EventEmitter();
 Name: string="";
  @Input() maxlength: number|null =256;
  @Input() minlength: number|null ;
  constructor(private MessageService:MessageService) {

   }

  ngOnInit(): void {
      this.Name=StaticFunctions.GetUUID();
  }

  OnDataValueChange(Data: any) {
    this.DataValueChange.emit(Data);
  }

  _filterInput(event: KeyboardEvent): boolean {
    if(this.filterInput==false){
      return true;
    }
    const regex = /^[a-zA-Z0-9]*$/;
    const inputCharacter = String.fromCharCode(event.keyCode);

    if (!regex.test(inputCharacter)) {
      event.preventDefault();
      StaticFunctions.ShowError(this.MessageService,'کاراکتر وارد شده معتبر نمی باشد')
      return false;
    }

    return true;
  }
}
