
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { OrgLocationClient, CreateOrgLocationCommand } from '../../../../../Services/api-client';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
@Component({
    selector: 'CreateOrgLocation',
    imports: [PanelModule,FormsModule,ButtonModule,InputStringComponent],
    providers:[OrgLocationClient],
    templateUrl: './CreateOrgLocation.component.html',
    styleUrl: './CreateOrgLocation.component.scss',
    standalone:true
})
export class CreateOrgLocationComponent {
    CreateOrgLocationCommand:CreateOrgLocationCommand=new CreateOrgLocationCommand();
    ChangePage: boolean = false;
    InsertChildPage: boolean = false;
    PGUID:string='';
    constructor(private OrgLocationClient:OrgLocationClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/Organization/OrgLocation/ChangeOrgLocation/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        }
        
        if (StaticFunctions.GetFormUrl() == '/Identity/Organization/OrgLocation/CreateChildOrgLocation/:PGUID') {
            this.InsertChildPage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.PGUID = params.get('PGUID') || '';
            });
        }
    }
    LoadData(guid: string) {
        this.OrgLocationClient.getOrgLocationById(guid).subscribe(Data => {
            this.CreateOrgLocationCommand = Data;
        })
    }

    Insert() {
        if(this.PGUID!=''){
            this.CreateOrgLocationCommand.pOrgLocationGUID=this.PGUID
        }
        this.OrgLocationClient.createOrgLocation(this.CreateOrgLocationCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.OrgLocationClient.updateOrgLocation(this.CreateOrgLocationCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/Organization/OrgLocation'])
    }
}


