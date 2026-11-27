
import { Component, ViewChild } from '@angular/core';
import {  ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import {  TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrgLocationClient } from '../../../../Services/api-client';
import { TableConfig } from '../../../../Shared/base/base.component';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { TreeBaseComponent } from '../../../../Shared/tree-base/tree-base.component';
@Component({
    selector: 'OrgLocationWithPagination',
    imports: [TreeBaseComponent,ButtonModule,RouterLink,TooltipModule],
    providers:[OrgLocationClient],
    templateUrl: './OrgLocationWithPagination.component.html',
    styleUrl: './OrgLocationWithPagination.component.scss',
    standalone:true
})
export class OrgLocationWithPaginationComponent {
    @ViewChild(TreeBaseComponent) TreeBaseComponent: TreeBaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private OrgLocationClient:OrgLocationClient
        ,private ConfirmationService:ConfirmationService,private MessageService:MessageService
) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
    {Name:'name',PersianName:'عنوان',FilterTypeBy:'',FilterType:1},
     {Name:'address',PersianName:'آدرس',FilterTypeBy:'',FilterType:1},
    {Name:'tell',PersianName:'تلفن',FilterTypeBy:'',FilterType:1},
    {Name:'fax',PersianName:'فکس',FilterTypeBy:'',FilterType:1},
    {Name:'email',PersianName:'ایمیل',FilterTypeBy:'',FilterType:1},
    {Name:'url',PersianName:'آدرس وبسایت',FilterTypeBy:'',FilterType:1},

            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.OrgLocationClient.deleteOrgLocation(item.node.data.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.TreeBaseComponent.LoadData()
            })
        }, () => { })

    }

}


