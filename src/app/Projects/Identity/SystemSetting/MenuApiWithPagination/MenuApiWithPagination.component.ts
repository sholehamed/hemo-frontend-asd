
import { Component, ViewChild } from '@angular/core';
import {  ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import {  TooltipModule } from 'primeng/tooltip';
import { MenuApiClient } from '../../../../Services/api-client';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TreeBaseComponent } from '../../../../Shared/tree-base/tree-base.component';

@Component({
    selector: 'MenuApiWithPagination',
    imports: [BaseComponent, ButtonModule, TooltipModule],
    providers:[MenuApiClient],
    templateUrl: './MenuApiWithPagination.component.html',
    styleUrl: './MenuApiWithPagination.component.scss',
    standalone:true
})
export class MenuApiWithPaginationComponent {
    TableConfig: TableConfig[] = [];
     @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    constructor(private MenuApiClient:MenuApiClient,private ConfirmationService:ConfirmationService,private MessageService:MessageService) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
    {Name:'menuName',PersianName:'منو',FilterTypeBy:'menu.label',FilterType:1},
    {Name:'apiName',PersianName:'سرویس',FilterTypeBy:'api.title',FilterType:1},
    {Name:'apiAddress',PersianName:'آدرس سرویس',FilterTypeBy:'api.UpstreamPathTemplate',FilterType:1},
    {Name:'apiMethod',PersianName:'متد',FilterTypeBy:'api.APITypeName',FilterType:1},
            { Name: '', PersianName: 'حذف', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

           Delete(item: any) {

                    StaticFunctions.confirm(this.ConfirmationService, () => {
                        this.MenuApiClient.deleteMenuApi(item.guid).subscribe(Data => {
                            
                            StaticFunctions.ShowSuccess(this.MessageService)
                            this.BaseComponent.LoadData()
                        })
                    }, () => { },`ایا از حذف (${item.apiName}) اطمینان دارید؟ .`)

                }
}


