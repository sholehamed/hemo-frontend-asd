import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { NgIf } from '@angular/common';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { Textarea, TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-input-textarea',
    templateUrl: './input-textarea.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./input-textarea.component.css'],
    imports: [
        FormsModule,
        NgIf,
        TextareaModule
    ],
    standalone: true
})
export class InputTextareaComponent implements OnInit {
  @Input() Rows: Number =1
  @Input() Direction: any = "rtl"
  @Input() Submitted: boolean = false
  @Input() ReadOnly: boolean = false
  @Input() Required: boolean = false
  @Input() Label: string = ""
  @Input() Data: any
  @Output() DataValueChange = new EventEmitter();
   Name: string="";
  constructor() {
      this.Name=StaticFunctions.GetUUID();
   }

  ngOnInit(): void {
  }

  OnDataValueChange(Data: any) {
    this.DataValueChange.emit(Data);
  }

}
