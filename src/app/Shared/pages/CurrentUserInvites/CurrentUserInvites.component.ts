
import { Component, ViewChild } from '@angular/core';
import {  ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import {  TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgIf } from '@angular/common';
import { BaseComponent, TableConfig } from '../../base/base.component';
import { UserInviteClient, UserInviteUpdateUserInviteCommand } from '../../../Services/api-client';
import { StaticFunctions } from '../../Services/StaticFunctions';
@Component({
    selector: 'CurrentUserInvites',
    imports: [BaseComponent,ButtonModule,TooltipModule,NgIf],
    providers:[UserInviteClient],
    templateUrl: './CurrentUserInvites.component.html',
    styleUrl: './CurrentUserInvites.component.scss',
    standalone:true
})
export class CurrentUserInvitesComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private UserInviteClient:UserInviteClient
        ,private ConfirmationService:ConfirmationService,private MessageService:MessageService
) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
    {Name:'organizationName',PersianName:'سازمان',FilterTypeBy:'orgLocation.organization.Name',FilterType:1},
    {Name:'orgLocationName',PersianName:'شرکت',FilterTypeBy:'orgLocation.Name',FilterType:1},
    {Name:'created',PersianName:'تاریخ ارسال',FilterTypeBy:'',FilterType:3},
    {Name:'userAccepted',PersianName:'قبول کردم',FilterTypeBy:'',FilterType:4},

            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    updateStatusUserInvite(item: any,userAccepted:boolean) {
let _UserInviteUpdateUserInviteCommand=new UserInviteUpdateUserInviteCommand();
_UserInviteUpdateUserInviteCommand.guid=item.guid;
_UserInviteUpdateUserInviteCommand.userAccepted=userAccepted;
        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.UserInviteClient.updateStatusUserInvite(_UserInviteUpdateUserInviteCommand).subscribe(Data => {
                item.userAccepted=userAccepted;
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


