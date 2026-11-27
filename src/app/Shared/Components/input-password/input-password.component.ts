import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { Password, PasswordModule } from 'primeng/password';
import { NgIf } from '@angular/common';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
    selector: 'app-input-password',
    templateUrl: './input-password.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./input-password.component.css'],
    imports: [
        PasswordModule,
        FormsModule,
        NgIf
    ],
    standalone: true
})
export class InputPasswordComponent implements OnInit {
    @Input() feedback: boolean = false
  @Input() Type: any = "text"
  @Input() Direction: any = "rtl"
  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
  @Input() Label: string = ""
  @Input() Data: any
  @Output() DataValueChange = new EventEmitter();
  Name: string="";
  constructor() {

   }

  ngOnInit(): void {
      this.Name=StaticFunctions.GetUUID();
  }

  OnDataValueChange(Data: any) {
    this.DataValueChange.emit(Data);
  }

}
