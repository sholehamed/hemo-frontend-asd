import { MessageService } from 'primeng/api';

import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { ApiClient, ApiUpateApiListCommand} from '../../../../Services/api-client';
import { NgClass, NgIf } from '@angular/common';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { Dialog } from "primeng/dialog";
import { UpdateApiComponent } from "./UpdateApi/UpdateApi.component";
@Component({
    selector: 'ApiWithPagination',
    imports: [BaseComponent,NgIf, ButtonModule, TooltipModule, Dialog, NgClass, UpdateApiComponent],
    providers: [ApiClient],
    templateUrl: './ApiWithPagination.component.html',
    styleUrl: './ApiWithPagination.component.scss',
    standalone: true
})
export class ApiWithPaginationComponent {
    TableConfig: TableConfig[] = [];
    Visible: boolean = false;
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    constructor(private ApiClient: ApiClient, private MessageService: MessageService) {
        this.setTableConfig();
    }

    UpateApiList() {
        let SendData: ApiUpateApiListCommand = new ApiUpateApiListCommand();
        this.ApiClient.upateApiList(SendData).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.setTableConfig();
        })

    }

    SelectedItem: any;
    OpenModal(SelectedItem: any) {
        debugger
        this.SelectedItem = SelectedItem;
        this.Visible = true;
    }

    Refresh(){
            this.BaseComponent.LoadData();
            this.Visible=false;
    }
 
    setTableConfig() {
        this.TableConfig = [
            { Name: 'subSystemName', PersianName: 'زیر سیستم', FilterTypeBy: 'SubSystem.Name', FilterType: 1 },
            { Name: 'title', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'upstreamPathTemplate', PersianName: 'آدرس', FilterTypeBy: '', FilterType: 1 },
            { Name: 'apiTypeName', PersianName: 'متد درخواست', FilterTypeBy: '', FilterType: 1 },
             { Name: 'isPublic', PersianName: 'سرویس عمومی', FilterTypeBy: '', FilterType: 4, ShowInRow: false },
            { Name: '', PersianName: 'ویرایش سرویس', FilterTypeBy: '', FilterType: 0 },
            
   

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

}


