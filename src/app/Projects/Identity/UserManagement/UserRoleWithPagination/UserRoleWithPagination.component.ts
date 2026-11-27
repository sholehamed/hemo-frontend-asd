
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { UserRoleClient } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
@Component({
    selector: 'UserRoleWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule,NgIf],
    providers: [UserRoleClient],
    templateUrl: './UserRoleWithPagination.component.html',
    styleUrl: './UserRoleWithPagination.component.scss',
    standalone: true
})
export class UserRoleWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    UserGuid:string;
    AdminPage=false;
    constructor(private UserRoleClient: UserRoleClient,private ActivatedRoute:ActivatedRoute,
         private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {
        this.setTableConfig();

        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/UserRole/:UserGuid') {
          this.AdminPage=true;
        }

        this.ActivatedRoute.paramMap.subscribe(params => {
            this.UserGuid = params.get('UserGuid') || '';

        });
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'roleName', PersianName: 'نقش', FilterTypeBy: '', FilterType: 0 },
            { Name: 'expireDate', PersianName: 'تاریخ انقضا', FilterTypeBy: '', FilterType: 3 },
            { Name: 'orgLocationName', PersianName: 'شرکت', FilterTypeBy: '', FilterType: 0 },
            { Name: 'organizationName', PersianName: 'سازمان', FilterTypeBy: '', FilterType: 0 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.UserRoleClient.deleteUserRole(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


