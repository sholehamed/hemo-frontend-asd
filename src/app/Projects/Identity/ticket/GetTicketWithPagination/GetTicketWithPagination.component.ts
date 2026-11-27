
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
import { TicketClient } from '../../../../Services/api-client';
@Component({
    selector: 'GetTicketWithPagination',
    imports: [BaseComponent, ButtonModule, NgIf, RouterLink, TooltipModule],
    providers: [TicketClient],
    templateUrl: './GetTicketWithPagination.component.html',
    styleUrl: './GetTicketWithPagination.component.scss',
    standalone: true
})
export class GetTicketWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    Pramas: any;
    constructor(private TicketClient: TicketClient
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        let Url = StaticFunctions.GetFormUrl();

        switch (Url) {
            case '/Identity/Ticket/Tickets': {
                this.Pramas = { TicketStatusGkey: 0 }
                break;
            }
            case '/Identity/Ticket/Tickets1': {
                this.Pramas = { TicketStatusGkey: 1 }
                break;
            }
            case '/Identity/Ticket/Tickets2': {
                this.Pramas = { TicketStatusGkey: 2 }
                break;
            }
            case '/Identity/Ticket/Tickets3': {
                this.Pramas = { TicketStatusGkey: 3 }
                break;
            }

        }


        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'title', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'ticketStatusName', PersianName: 'وضعیت', FilterTypeBy: 'TicketStatus.Name', FilterType: 1 },
            { Name: 'departmentName', PersianName: 'دپارتمان', FilterTypeBy: 'Department.Name', FilterType: 1 },
            { Name: 'priorityName', PersianName: 'اولویت', FilterTypeBy: 'Priority.Name', FilterType: 1 },
            { Name: 'ticketNumber', PersianName: 'شماره تیکت', FilterTypeBy: '', FilterType: 2 },
            { Name: 'userName', PersianName: 'کاربر', FilterTypeBy: '', FilterType: 0 },
            { Name: 'userMobile', PersianName: 'همراه', FilterTypeBy: '', FilterType: 0 },

            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.TicketClient.deleteTicket(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


