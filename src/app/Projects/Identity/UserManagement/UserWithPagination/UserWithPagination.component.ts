
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { UserBlockUserCommand, UserClient, UserLockUserCommand, UserWithPaginationDTO } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgIf, NgClass } from '@angular/common';
@Component({
    selector: 'UserWithPagination',
    imports: [BaseComponent, ButtonModule, RouterLink, TooltipModule, NgIf, NgClass],
    providers: [UserClient],
    templateUrl: './UserWithPagination.component.html',
    styleUrl: './UserWithPagination.component.scss',
    standalone: true
})
export class UserWithPaginationComponent {
    AdminPage = false
    TableConfig: TableConfig[] = []
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    constructor(private UserClient: UserClient, private ConfirmationService: ConfirmationService,
        private MessageService: MessageService

    ) {
        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/User') {
            this.AdminPage = true;
        }
        this.setTableConfig();
    }

    BlockUser(Item: UserWithPaginationDTO) {
        StaticFunctions.confirm(this.ConfirmationService, () => { 
            let SendData = new UserBlockUserCommand();
            SendData.blocked = !Item.blocked;
            SendData.guid = Item.guid;
            this.UserClient.userBlockUser(SendData).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => {
            
        })

    }

    LockUser(Item: UserWithPaginationDTO) {
        StaticFunctions.confirm(this.ConfirmationService, () => { 
              let SendData = new UserLockUserCommand();
            SendData.locked = !Item.locked;
            SendData.guid = Item.guid;
            this.UserClient.userLockUser(SendData).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => {
          
        })

    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'username', PersianName: 'نام کاربری', FilterTypeBy: '', FilterType: 1 },
            { Name: 'firstName', PersianName: 'نام', FilterTypeBy: '', FilterType: 1 },
            { Name: 'lastName', PersianName: 'نام خانوادگی', FilterTypeBy: '', FilterType: 1 },
            { Name: 'mobile', PersianName: 'موبایل', FilterTypeBy: '', FilterType: 1 },
            { Name: 'email', PersianName: 'ایمیل', FilterTypeBy: '', FilterType: 1 },
            { Name: 'nationalcode', PersianName: 'کد ملی', FilterTypeBy: '', FilterType: 1 },
            { Name: '', PersianName: 'مسدود می باشد', FilterTypeBy: '', FilterType: 0 },
            { Name: '', PersianName: 'قفل می باشد', FilterTypeBy: '', FilterType: 0 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))


    }
    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.UserClient.deleteUser(item.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }
}


