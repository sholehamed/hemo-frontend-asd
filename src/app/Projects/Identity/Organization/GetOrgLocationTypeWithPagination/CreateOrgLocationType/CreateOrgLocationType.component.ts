
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { OrgLocationTypeClient, CreateOrgLocationTypeCommand } from '../../../../../Services/api-client';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
@Component({
    selector: 'CreateOrgLocationType',
    imports: [PanelModule,FormsModule,ButtonModule,InputStringComponent],
    providers:[OrgLocationTypeClient],
    templateUrl: './CreateOrgLocationType.component.html',
    styleUrl: './CreateOrgLocationType.component.scss',
    standalone:true
})
export class CreateOrgLocationTypeComponent {
    CreateOrgLocationTypeCommand:CreateOrgLocationTypeCommand=new CreateOrgLocationTypeCommand();
    ChangePage: boolean = false;
    constructor(private OrgLocationTypeClient:OrgLocationTypeClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/Organization/OrgLocationType/ChangeOrgLocationType/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        }
    }
    LoadData(guid: string) {
        this.OrgLocationTypeClient.getOrgLocationTypeById(guid).subscribe(Data => {
            this.CreateOrgLocationTypeCommand = Data;
        })
    }

    Insert() {
        this.OrgLocationTypeClient.createOrgLocationType(this.CreateOrgLocationTypeCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.OrgLocationTypeClient.updateOrgLocationType(this.CreateOrgLocationTypeCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/Organization/OrgLocationType'])
    }
}


