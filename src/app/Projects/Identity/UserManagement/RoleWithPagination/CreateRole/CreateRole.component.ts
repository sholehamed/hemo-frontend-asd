
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleClient, CreateRoleCommand } from '../../../../../Services/api-client';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
@Component({
    selector: 'CreateRole',
    imports: [PanelModule, FormsModule, ButtonModule, InputStringComponent],
    providers:[RoleClient],
    templateUrl: './CreateRole.component.html',
    styleUrl: './CreateRole.component.scss',
    standalone:true
})
export class CreateRoleComponent {
    AdminPage:boolean=true;
    CreateRoleCommand:CreateRoleCommand=new CreateRoleCommand();
    pguid:string="";
    guid:string="";
    ChangePage: boolean = false;
    constructor(private RoleClient:RoleClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
            this.AdminPage=!StaticFunctions.GetFormUrl()!.includes('/OrglocationRole/')
            if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/Role/CreateRole/:pguid'||StaticFunctions.GetFormUrl() == '/Identity/UserManagement/OrglocationRole/CreateOrglocationRole/:pguid') {
                this.ChangePage = false;
                this.ActivatedRoute.paramMap.subscribe(params => {
                    this.pguid = params.get('pguid') || '';

                });
            }

            if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/Role/ChangeRole/:guid'||StaticFunctions.GetFormUrl() == '/Identity/UserManagement/OrglocationRole/ChangeOrglocationRole/:guid') {
                this.ChangePage = true;
                this.ActivatedRoute.paramMap.subscribe(params => {
                    this.guid = params.get('guid') || '';
                    this.LoadData(this.guid );
                });
            }
    }
    LoadData(guid: string) {
        this.RoleClient.getRoleById(guid).subscribe(Data => {
            this.CreateRoleCommand = Data;
        })
    }

    Insert() {
        if(this.pguid!='1'){
            this.CreateRoleCommand.pRoleGUID=this.pguid;
        }
        this.RoleClient.createRole(this.CreateRoleCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        
        this.RoleClient.updateRole(this.CreateRoleCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        if(this.AdminPage){
            this.Router.navigate(['/Identity/UserManagement/Role'])
        }else{
            this.Router.navigate(['/Identity/UserManagement/OrglocationRole'])
        }

    }
}


