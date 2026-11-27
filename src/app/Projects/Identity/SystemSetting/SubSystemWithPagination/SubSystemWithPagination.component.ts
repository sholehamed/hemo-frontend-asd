import { MessageService, ConfirmationService } from 'primeng/api';

import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { SubSystemClient, SubSystemUpdateSubSystemIsActiveCommand } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { NgClass } from '@angular/common';
@Component({
    selector: 'SubSystemWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, NgClass, TooltipModule],
    providers: [SubSystemClient],
    templateUrl: './SubSystemWithPagination.component.html',
    styleUrl: './SubSystemWithPagination.component.scss',
    standalone: true
})
export class SubSystemWithPaginationComponent {
    TableConfig: TableConfig[] = []
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    constructor(private SubSystemClient: SubSystemClient, private MessageService: MessageService, private ConfirmationService: ConfirmationService) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'host', PersianName: 'آدرس سرویس', FilterTypeBy: '', FilterType: 1 },
            { Name: 'port', PersianName: 'پورت سرویس', FilterTypeBy: '', FilterType: 2 },
            { Name: 'active', PersianName: 'فعال', FilterTypeBy: '', FilterType: 4, ShowInRow: false },
            { Name: '', PersianName: 'ویرایش', FilterTypeBy: '', FilterType: 0 },
            { Name: '', PersianName: 'حذف', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }
    updateIsActive(Data: any) {
        let SendData: SubSystemUpdateSubSystemIsActiveCommand = new SubSystemUpdateSubSystemIsActiveCommand();
        SendData.guid = Data.guid;
        SendData.active = !Data.active;
        this.SubSystemClient.updateSubSystemIsActive(SendData).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.BaseComponent.LoadData();
        })

    }
    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.SubSystemClient.deleteSubSystem(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }
}


