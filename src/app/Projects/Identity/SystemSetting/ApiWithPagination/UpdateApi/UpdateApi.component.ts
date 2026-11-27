
import { MessageService } from 'primeng/api';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiClient, UpdateApiCommand } from '../../../../../Services/api-client';
import { CheckboxComponent } from '../../../../../Shared/Components/checkbox/checkbox.component';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { InputNumberComponent } from '../../../../../Shared/Components/input-number/input-number.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';

@Component({
    selector: 'UpdateApi',
    imports: [PanelModule,NgIf, FormsModule, ButtonModule, CheckboxComponent, InputStringComponent, InputNumberComponent],
    providers: [ApiClient],
    templateUrl: './UpdateApi.component.html',
    styleUrl: './UpdateApi.component.scss',
    standalone: true
})
export class UpdateApiComponent {
    UpdateApiCommand: UpdateApiCommand = new UpdateApiCommand();
    @Input() GUID: string;
    @Output() OnDone = new EventEmitter();
    constructor(private ApiClient: ApiClient,
        private MessageService: MessageService) {

    }

    ngOnInit(): void {
        this.LoadData()
    }

    LoadData() {
        this.ApiClient.getApiById(this.GUID).subscribe(Data => {
            this.UpdateApiCommand = Data;
        })
    }

   
    Update() {
        this.ApiClient.updateApi(this.UpdateApiCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.OnDone.emit();
    }
}


