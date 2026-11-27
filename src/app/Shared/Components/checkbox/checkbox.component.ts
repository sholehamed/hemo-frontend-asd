import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
    selector: 'app-checkbox',
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.css'],
    imports: [
        CheckboxModule,
        FormsModule
    ],
    standalone: true
})
export class CheckboxComponent implements OnInit {
  @Input() Readonly: boolean = false;
  @Input() Breake: boolean = true;
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
