import { MessageService } from 'primeng/api';

import { Component, Input, OnInit } from '@angular/core';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-submit-button',
    templateUrl: './submit-button.component.html',
    styleUrls: ['./submit-button.component.css'],
    imports: [NgIf, ButtonModule],
    standalone: true
})
export class SubmitButtonComponent implements OnInit {

    @Input() Label: string = "ثبت";
    @Input() Style: string = "p-button-success p-button-sm";
    @Input() dirClass: string = "text-center";
    @Input() Breake: boolean = false;

    @Input() FormIsValid: any;
    constructor(private MessageService: MessageService) { }

    ngOnInit(): void {
    }

    OnSubmit() {
        if (this.FormIsValid == false) {
            StaticFunctions.ShowError(this.MessageService, 'لطفا فیلد های نامعتبر موجود در فرم را اصلاح نمایید.');
        }
    }
}
