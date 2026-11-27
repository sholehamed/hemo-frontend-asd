
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PackageClient } from '../../../../Services/api-client';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
@Component({
    selector: 'GetPackageWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule],
    providers: [PackageClient],
    templateUrl: './GetPackageWithPagination.component.html',
    styleUrl: './GetPackageWithPagination.component.scss',
    standalone: true
})
export class GetPackageWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    PackageCategoryGUID: string = "";
    Title: string = "";
    Params={};
    constructor(private PackageClient: PackageClient, private ActivatedRoute: ActivatedRoute,
        private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {

        this.ActivatedRoute.paramMap.subscribe(params => {
            this.PackageCategoryGUID = params.get('PackageCategoryGUID') || '';
            this.Title = params.get('Title') || '';
            this.setTableConfig();
        });


    }

    setTableConfig() {
        this.Params={PackageCategoryGUID:this.PackageCategoryGUID}
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'description', PersianName: 'توضیحات', FilterTypeBy: '', FilterType: 1 },
            { Name: 'price', PersianName: 'مبلغ (ریال)', FilterTypeBy: '', FilterType: 2 },
            { Name: 'link', PersianName: 'لینک', FilterTypeBy: '', FilterType: 1 },
            { Name: 'roleName', PersianName: 'سطح دسترسی', FilterTypeBy: 'role.Name', FilterType: 1 },
            { Name: 'icon', PersianName: 'آیکون', FilterTypeBy: '', FilterType: 1 },
            { Name: 'expireDays', PersianName: 'تعداد روز اعتبار', FilterTypeBy: '', FilterType: 1 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.PackageClient.deletePackage(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


