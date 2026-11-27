
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { OrgLocationTypeClient } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
@Component({
    selector: 'GetOrgLocationTypeWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule],
    providers: [OrgLocationTypeClient],
    templateUrl: './GetOrgLocationTypeWithPagination.component.html',
    styleUrl: './GetOrgLocationTypeWithPagination.component.scss',
    standalone: true
})
export class GetOrgLocationTypeWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private OrgLocationTypeClient: OrgLocationTypeClient
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },

            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.OrgLocationTypeClient.deleteOrgLocationType(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


