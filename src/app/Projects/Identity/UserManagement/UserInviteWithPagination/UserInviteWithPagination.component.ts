
import { Component, ViewChild } from '@angular/core';
import {  ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import {  TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { UserInviteClient } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';


@Component({
    selector: 'UserInviteWithPagination',
    imports: [BaseComponent,ButtonModule,RouterLink,TooltipModule],
    providers:[UserInviteClient],
    templateUrl: './UserInviteWithPagination.component.html',
    styleUrl: './UserInviteWithPagination.component.scss',
    standalone:true
})
export class UserInviteWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private UserInviteClient:UserInviteClient
        ,private ConfirmationService:ConfirmationService,private MessageService:MessageService
) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
    {Name:'orgLocationName',PersianName:'شرکت',FilterTypeBy:'orgLocation.Name',FilterType:0},
    {Name:'userInfo',PersianName:'کاربر',FilterTypeBy:'',FilterType:1},
    {Name:'userAcceptedStatus',PersianName:'وضعیت تایید کاربر',FilterTypeBy:'',FilterType:0},


            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.UserInviteClient.deleteUserInvite(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


