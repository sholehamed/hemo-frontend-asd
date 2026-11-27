import { AuthService } from './../../Services/AuthService';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { FormsModule } from '@angular/forms';
import { MenuBindUserMenuDTO, MenuClient } from './../../../Services/api-client';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownComponent } from "../../Components/dropdown/dropdown.component";
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-menu',
    standalone: true,
    providers: [MenuClient],
    imports: [CommonModule, AppMenuitem, RouterModule, FormsModule, InputTextModule, DropdownComponent, FormsModule],
    template: `
       <form #Form="ngForm">
       <app-dropdown [Label]="'دسترسی'" [ReadOnly]="false" [Required]="false" [Options]="[]"
                    [OptionsUrl]="'Identity/UserRole/GetCurrentUserRoles'" [SelectFirstItem]="true"
                    (DataValueChange)="SetUserRole($event)" [DataIdName]="'gkey'" [Data]="((UserRole>0)?UserRole:'')"
                    (DataChange)="DataChange($event)"
                    [OptionName]="'name'" [Submitted]="false"></app-dropdown>
       </form>
       
       <br>
        
        <div class="search-container">
            <input pInputText type="text" [(ngModel)]="searchQuery" placeholder="جستجو..." (ngModelChange)="onSearchChange()" />
        </div>
        <br>
        <ul class="layout-menu">
            <ng-container *ngFor="let item of filteredModel; let i = index">
                <li app-menuitem  *ngIf="!item.separator" [item]="item" [index]="i" [root]="true" [expanded]="expanded"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu {
    expanded: boolean = false;
    searchQuery: string = '';
    model: MenuItem[] = [];
    originalModel: string = "[]";


    get filteredModel() {

        return this.filterMenuItems(this.model, this.searchQuery);
    }

    UserRole: number;
    constructor(private MenuClient: MenuClient, private AuthService: AuthService) {
        this.UserRole = AuthService.GetUserRole();
        this.SetUserRole(this.UserRole);
    }
    DataChange(userrole:any){
        sessionStorage.setItem('orgLocationName',userrole.orgLocationName);
    }

    SetUserRole(UserRole: number) {
        if(UserRole>0){
            this.AuthService.SetUserRole(UserRole);
            this.loadMenu();
        }
   
    }

    ngOnInit() {

    }

    loadMenu() {

        this.MenuClient.menuBindUserMenu(environment.SubPath).subscribe(data => {
            this.originalModel = JSON.stringify(data);
            this.model = [...data];
        });

    }

    filterMenuItems(items: MenuItem[], query: string): MenuItem[] {
        if (!query) {
            return items;
        }

        return items
            .map(item => {
                const matches = item.label?.toLowerCase().includes(query.toLowerCase());
                if (item.items && item.items.length > 0) {
                    item.items = this.filterMenuItems(item.items, query);
                }
                if (matches || (item.items && item.items.length > 0)) {
                    return item;
                }

                return null;
            })
            .filter(item => item !== null);
    }

    onSearchChange() {
        this.model = JSON.parse(this.originalModel);
        if (!this.searchQuery) {
            this.expanded = false;

        } else {
            this.expanded = true;
        }
    }
}
