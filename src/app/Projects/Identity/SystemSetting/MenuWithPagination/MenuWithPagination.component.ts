import { DragDropItem, TreeBaseComponent } from './../../../../Shared/tree-base/tree-base.component';

import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { MenuClient, MenuUpdateMenuIsPublicCommand, MenuUpdateTreeCommand, MenuUpdateVisibilityCommand } from '../../../../Services/api-client';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgClass } from '@angular/common';
@Component({
    selector: 'MenuWithPagination',
    imports: [TreeBaseComponent, ButtonModule, TooltipModule, TreeBaseComponent, RouterLink],
    providers: [MenuClient],
    templateUrl: './MenuWithPagination.component.html',
    styleUrl: './MenuWithPagination.component.scss',
    standalone: true
})
export class MenuWithPaginationComponent {
    TableConfig: TableConfig[] = [];
    @ViewChild(TreeBaseComponent) TreeBaseComponent: TreeBaseComponent;
    constructor(private MenuClient: MenuClient
        , private MessageService: MessageService,
        private ConfirmationService: ConfirmationService) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'label', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: 'routerLink', PersianName: 'آدرس', FilterTypeBy: '', FilterType: 1 },

            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 }

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    Delete(item: any) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            this.MenuClient.deleteMenu(item.node.data.guid).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.TreeBaseComponent.LoadData()
            })
        }, () => { }, `ایا از حذف (${item.node.data.label}) اطمینان دارید؟ پس از حذف تمام زیر شاخه ها نیز حذف خواهد شد.`)

    }
    updateVisibility(item: any) {

        let updateVisibility: MenuUpdateVisibilityCommand = new MenuUpdateVisibilityCommand();
        updateVisibility.guid = item.node.data.guid;
        this.MenuClient.updateVisibility(updateVisibility).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService)

        })
        item.node.data.showInMenu = !item.node.data.showInMenu

    }
    updateMenuIsPublic(item: any) {

        let _MenuUpdateMenuIsPublicCommand: MenuUpdateMenuIsPublicCommand = new MenuUpdateMenuIsPublicCommand();
        _MenuUpdateMenuIsPublicCommand.guid = item.node.data.guid;
        this.MenuClient.updateMenuIsPublic(_MenuUpdateMenuIsPublicCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService)

        })
        item.node.data.isPublic = !item.node.data.isPublic

    }
    OnDragDrop(Data: DragDropItem) {

        let menuUpdateTreeCommand: MenuUpdateTreeCommand = new MenuUpdateTreeCommand();
        menuUpdateTreeCommand.sourceGUID = Data.Drag.node.data.guid;
        menuUpdateTreeCommand.destGUID = Data.Drop.node.data.guid;
        this.MenuClient.menuUpdateTree(menuUpdateTreeCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService)
            this.TreeBaseComponent.LoadData();

        })

    }
}


