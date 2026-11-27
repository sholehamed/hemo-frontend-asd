
import { Component, ViewChild } from '@angular/core';
import {  ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {  TooltipModule } from 'primeng/tooltip';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { RoleAccessClient } from '../../../../Services/api-client';
import { NgIf } from '@angular/common';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ConfirmationService, MessageService } from 'primeng/api';
@Component({
    selector: 'RoleAccessWithPagination',
    imports: [BaseComponent,ButtonModule,RouterLink,TooltipModule,NgIf],
    providers:[RoleAccessClient],
    templateUrl: './RoleAccessWithPagination.component.html',
    styleUrl: './RoleAccessWithPagination.component.scss',
    standalone:true
})
export class RoleAccessWithPaginationComponent {
    TableConfig: TableConfig[] = [];
    RoleGUID="";
      @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    constructor(private RoleAccessClient:RoleAccessClient,
        private ConfirmationService:ConfirmationService,
private MessageService:MessageService,
        private ActivatedRoute: ActivatedRoute) {
        this.setTableConfig();
        this.ActivatedRoute.paramMap.subscribe(params => {
            
            this.RoleGUID = params.get('RoleGUID') || '';

        });
    }

    setTableConfig() {
        this.TableConfig = [
    {Name:'menuName',PersianName:'منو',FilterTypeBy:'',FilterType:1},
    {Name:'roleName',PersianName:'نقش',FilterTypeBy:'',FilterType:1},
    {Name:'apiName',PersianName:'سرویس',FilterTypeBy:'',FilterType:1},
    {Name:'apiAddress',PersianName:'ادرس سرویس',FilterTypeBy:'',FilterType:1},
    {Name:'apiMethod',PersianName:'متد سرویس',FilterTypeBy:'',FilterType:1},
            { Name: '', PersianName: 'حذف', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

      Delete(item: any) {

            StaticFunctions.confirm(this.ConfirmationService, () => {
                this.RoleAccessClient.deleteRoleAccess(item.guid).subscribe(Data => {
                    StaticFunctions.ShowSuccess(this.MessageService)
                    this.BaseComponent.LoadData()
                })
            }, () => { },`آیا از حذف دسترسی (${item.apiName}) اطمینان دارید؟ با حذف این دسترسی تمامی دسترسی های وابسته نیز حذف می گردد.`)

        }
}


