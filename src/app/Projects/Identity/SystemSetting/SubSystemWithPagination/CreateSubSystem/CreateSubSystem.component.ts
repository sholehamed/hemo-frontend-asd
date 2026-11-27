
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { SubSystemClient, CreateSubSystemCommand } from '../../../../../Services/api-client';
import { InputNumberComponent } from '../../../../../Shared/Components/input-number/input-number.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { InputTimeComponent } from "../../../../../Shared/Components/input-time/input-time.component";
import { CheckboxComponent } from "../../../../../Shared/Components/checkbox/checkbox.component";
@Component({
    selector: 'CreateSubSystem',
    imports: [PanelModule, FormsModule, ButtonModule, InputStringComponent, InputNumberComponent, InputTimeComponent, CheckboxComponent],
    providers: [SubSystemClient],
    templateUrl: './CreateSubSystem.component.html',
    styleUrl: './CreateSubSystem.component.scss',
    standalone: true
})
export class CreateSubSystemComponent {
    CreateSubSystemCommand: CreateSubSystemCommand = new CreateSubSystemCommand();
    ChangePage: boolean = false;
    constructor(private SubSystemClient: SubSystemClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/SystemSetting/SubSystem/ChangeSubSystem/:guid') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('guid') || '';
                this.LoadData(guid)
            });
        }
    }
    LoadData(guid: string) {
        this.SubSystemClient.getSubSystemById(guid).subscribe(Data => {
            this.CreateSubSystemCommand = Data;
        })
    }

    Insert() {
        this.SubSystemClient.createSubSystem(this.CreateSubSystemCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.SubSystemClient.updateSubSystem(this.CreateSubSystemCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/SystemSetting/SubSystem'])
    }
}


