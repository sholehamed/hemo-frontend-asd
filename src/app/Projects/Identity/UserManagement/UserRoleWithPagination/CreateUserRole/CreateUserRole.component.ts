import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRoleClient, CreateUserRoleCommand, OrgLocationDTO } from '../../../../../Services/api-client';
import { DateInputComponent } from '../../../../../Shared/Components/date-input/date-input.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { InputTreeSelectComponent } from "../../../../../Shared/Components/input-tree-select/input-tree-select.component";
import { InputGroup, InputGroupModule } from 'primeng/inputgroup';
import { SelectOrgLocationModalComponent } from '../../../../../Shared/SelectModal/SelectOrgLocationModal/SelectOrgLocationModal.component';
import { NgIf } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
@Component({
    selector: 'CreateUserRole',
    imports: [
        PanelModule,
        FormsModule,
        ButtonModule,
        DateInputComponent,
        InputTreeSelectComponent,
        DialogModule,
        NgIf,
        SelectOrgLocationModalComponent,
        InputGroupModule,
        InputGroup,
        InputTextModule,
        InputGroupAddonModule],
    providers: [UserRoleClient],
    templateUrl: './CreateUserRole.component.html',
    styleUrl: './CreateUserRole.component.scss',
    standalone: true
})
export class CreateUserRoleComponent {
    CreateUserRoleCommand: CreateUserRoleCommand = new CreateUserRoleCommand();
    ChangePage: boolean = false;
    UserGuid: string = '';
    constructor(private UserRoleClient: UserRoleClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,

        private Router: Router) {

        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/UserRole/ChangeUserRole/:UserGuid/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.UserGuid = params.get('UserGuid') || '';
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        }
        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/UserRole/CreateUserRole/:UserGuid') {
            this.ChangePage = false;
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.UserGuid = params.get('UserGuid') || '';
            });
        }
    }
    LoadData(guid: string) {
        this.UserRoleClient.getUserRoleById(guid).subscribe(Data => {
            this.OrgLocationName = Data.orgLocationName!;
            this.CreateUserRoleCommand = Data;

        })
    }

    Insert() {
        this.CreateUserRoleCommand.userGUID = this.UserGuid;
        this.UserRoleClient.createUserRole(this.CreateUserRoleCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.UserRoleClient.updateUserRole(this.CreateUserRoleCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate([('/Identity/UserManagement/UserRole/') + this.UserGuid])
    }

    OrgLocationName: string = "";
    OrgLocationSelectVisible = false;
    OpenOrgLocationSelectModal() {
        this.OrgLocationSelectVisible = true;
    }

    CloseModal(item: OrgLocationDTO) {
        this.OrgLocationSelectVisible = false;
        this.CreateUserRoleCommand.orgLocationGUID = item.guid;
        this.OrgLocationName = item.name!;
    }

    DeleteOrgLocation() {
        this.OrgLocationName = "";
        this.CreateUserRoleCommand.orgLocationGUID = undefined;
    }
}


