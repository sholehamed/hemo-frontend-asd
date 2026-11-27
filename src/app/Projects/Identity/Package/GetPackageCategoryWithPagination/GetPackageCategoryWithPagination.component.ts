
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { PackageCategoryClient } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
@Component({
    selector: 'GetPackageCategoryWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule],
    providers: [PackageCategoryClient],
    templateUrl: './GetPackageCategoryWithPagination.component.html',
    styleUrl: './GetPackageCategoryWithPagination.component.scss',
    standalone: true
})
export class GetPackageCategoryWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private PackageCategoryClient: PackageCategoryClient
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'icon', PersianName: 'آیکون', FilterTypeBy: '', FilterType: 1 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.PackageCategoryClient.deletePackageCategory(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


