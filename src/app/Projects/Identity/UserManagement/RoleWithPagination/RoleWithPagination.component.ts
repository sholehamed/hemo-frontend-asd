import { RoleAccessClient, RoleAccessCopyRoleAccessCommand } from './../../../../Services/api-client';

import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { RoleClient } from '../../../../Services/api-client';
import { TreeBaseComponent } from "../../../../Shared/tree-base/tree-base.component";
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { InputTreeSelectComponent } from "../../../../Shared/Components/input-tree-select/input-tree-select.component";
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
@Component({
    selector: 'RoleWithPagination',
    imports: [ButtonModule, Dialog, RouterLink,FormsModule, TooltipModule, TreeBaseComponent, RouterLink, InputTreeSelectComponent],
    providers: [RoleClient,RoleAccessClient],
    templateUrl: './RoleWithPagination.component.html',
    styleUrl: './RoleWithPagination.component.scss',
    standalone: true
})
export class RoleWithPaginationComponent {
    AdminPage = false;
    TableConfig: TableConfig[] = []
    visible: boolean = false;
    srcRoleName:string="";
    RoleAccessCopyRoleAccessCommand: RoleAccessCopyRoleAccessCommand = new RoleAccessCopyRoleAccessCommand();
    @ViewChild(TreeBaseComponent) TreeBaseComponent: TreeBaseComponent;
    constructor(private RoleClient: RoleClient, private ConfirmationService: ConfirmationService,
        private MessageService: MessageService, private RoleAccessClient: RoleAccessClient
    ) {
        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/Role') {
            this.AdminPage = true;
        }
        this.setTableConfig()
    }
    test(ant:any){
debugger
    }

    CopyRoleAccess() {
        this.RoleAccessClient.copyRoleAccess(this.RoleAccessCopyRoleAccessCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService)
            this.visible = false;
        });
    }
    setTableConfig() {
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 }

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.RoleClient.deleteRole(item.node.data.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.TreeBaseComponent.LoadData()
            })
        }, () => { }, `ایا از حذف (${item.node.data.name}) اطمینان دارید؟ پس از حذف تمام زیر شاخه ها نیز حذف خواهد شد.`)

    }
}


