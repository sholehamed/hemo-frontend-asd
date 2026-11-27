
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleAccessClient, CreateRoleAccessCommand } from '../../../../../Services/api-client';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { MultiSelectInputComponent } from "../../../../../Shared/Components/multi-select-input/multi-select-input.component";
import { InputTreeSelectComponent } from "../../../../../Shared/Components/input-tree-select/input-tree-select.component";
@Component({
    selector: 'CreateRoleAccess',
    imports: [PanelModule, FormsModule, ButtonModule, MultiSelectInputComponent, InputTreeSelectComponent],
    providers:[RoleAccessClient],
    templateUrl: './CreateRoleAccess.component.html',
    styleUrl: './CreateRoleAccess.component.scss',
    standalone:true
})
export class CreateRoleAccessComponent {
    SubSystemGUID:string='';
    RoleGUID:string;
    CreateRoleAccessCommand:any=new CreateRoleAccessCommand();
    ChangePage: boolean = false;
    constructor(private RoleAccessClient:RoleAccessClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
            this.ActivatedRoute.paramMap.subscribe(params => {
               this.RoleGUID= params.get('RoleGUID') || '';

            });
    }


    Insert() {
        this.CreateRoleAccessCommand.roleGUID=this.RoleGUID
        this.RoleAccessClient.createRoleAccess(this.CreateRoleAccessCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.RoleAccessClient.updateRoleAccess(this.CreateRoleAccessCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/UserManagement/Role/RoleAccess/'+this.RoleGUID])
    }
}


