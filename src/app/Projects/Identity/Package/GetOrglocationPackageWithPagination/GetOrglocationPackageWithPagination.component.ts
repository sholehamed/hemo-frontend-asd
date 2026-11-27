
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { OrglocationPackageClient, OrglocationPackageUpdateExpireDateCommand } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { DateInputComponent } from "../../../../Shared/Components/date-input/date-input.component";
@Component({
    selector: 'GetOrglocationPackageWithPagination',
    imports: [BaseComponent, DialogModule, FormsModule, NgIf, ButtonModule, TooltipModule, DateInputComponent],
    providers: [OrglocationPackageClient],
    templateUrl: './GetOrglocationPackageWithPagination.component.html',
    styleUrl: './GetOrglocationPackageWithPagination.component.scss',
    standalone: true
})
export class GetOrglocationPackageWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    Visible: boolean = false;
    constructor(private OrglocationPackageClient: OrglocationPackageClient
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'orgLocationName', PersianName: 'شرکت', FilterTypeBy: 'OrgLocation.Name', FilterType: 1 },
            { Name: 'packageName', PersianName: 'پکیج', FilterTypeBy: 'Package.Name', FilterType: 1 },
            { Name: 'expiryDate', PersianName: 'اعتبار', FilterTypeBy: '', FilterType: 3 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.OrglocationPackageClient.deleteOrglocationPackage(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }


    SelectedData: any;
    expiryDate: any;
    OpenModal(Data: any) {
        this.expiryDate = Data.expiryDate;
        this.SelectedData = Data;
        this.Visible = true;
    }

    UpdateDate() {
        let SendData = new OrglocationPackageUpdateExpireDateCommand();
        SendData.expiryDate = this.expiryDate;
        SendData.guid = this.SelectedData.guid;;
        this.OrglocationPackageClient.orglocationPackageUpdateExpireDate(SendData).subscribe(Data => {
            this.expiryDate = null;
            this.SelectedData = null;
            this.Visible = false;
            StaticFunctions.ShowSuccess(this.MessageService)
            this.BaseComponent.LoadData()
        })
    }

}


