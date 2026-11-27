import { DiscountClient } from './../../../../Services/api-client';

import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';

@Component({
    selector: 'GetDiscountWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule],
    providers: [DiscountClient],
    templateUrl: './GetDiscountWithPagination.component.html',
    styleUrl: './GetDiscountWithPagination.component.scss',
    standalone: true
})
export class GetDiscountWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    constructor(private DiscountClient: DiscountClient
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'code', PersianName: 'کد', FilterTypeBy: '', FilterType: 1 },


            { Name: 'maxDiscountAmount', PersianName: 'حداکثر مبلغ تخفیف', FilterTypeBy: '', FilterType: 5 },
            { Name: 'minimumOrderAmount', PersianName: 'حداقل مبلغ فاکتور', FilterTypeBy: '', FilterType: 5 },
            { Name: 'startDate', PersianName: 'از تاریخ', FilterTypeBy: '', FilterType: 3 },
            { Name: 'endDate', PersianName: 'تا تاریخ', FilterTypeBy: '', FilterType: 3 },
            { Name: 'value', PersianName: 'مقدار', FilterTypeBy: '', FilterType: 2 },
            { Name: 'percentage', PersianName: 'کد تخفیف رصدی', FilterTypeBy: '', FilterType: 4 },
            { Name: 'isActive', PersianName: 'کد تخفیف فعال می باشد', FilterTypeBy: '', FilterType: 4 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }



}


