import { AuthService } from './../../Services/AuthService';
import { Component, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MENU_ROLE_CONTEXT } from './menu-role-context';
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
export class AppMenu implements OnDestroy {
    private readonly roleContext = inject(MENU_ROLE_CONTEXT, {optional:true});
    private menuRequest?: Subscription;
    private menuGeneration = 0;
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
        if(this.roleContext && (!userrole || Number(userrole.gkey)!==this.AuthService.GetUserRole())) return;
        sessionStorage.setItem('orgLocationName',userrole?.orgLocationName??'');
    }

    SetUserRole(UserRole: number) {
        if(UserRole>0){
            if(this.roleContext) {
                const previous = this.AuthService.GetUserRole();
                if(previous!==UserRole) {
                    this.roleContext.beforeChange(previous,UserRole);
                    this.menuRequest?.unsubscribe();
                    ++this.menuGeneration;
                    this.model=[];
                    this.originalModel='[]';
                    sessionStorage.removeItem('orgLocationName');
                }
                this.AuthService.SetUserRole(UserRole);
                this.UserRole=UserRole;
                if(previous!==UserRole) this.roleContext.afterChange(previous,UserRole);
                this.loadMenu();
                return;
            }
            this.AuthService.SetUserRole(UserRole);
            this.loadMenu();
        }
   
    }

    ngOnInit() {

    }

    loadMenu() {

        if(this.roleContext) {
            this.menuRequest?.unsubscribe();
            const generation=++this.menuGeneration;
            const role=this.AuthService.GetUserRole();
            const token=this.AuthService.GetAccessToken();
            this.menuRequest=this.MenuClient.menuBindUserMenu(environment.SubPath).subscribe({next:data=>{
                if(generation!==this.menuGeneration||role!==this.AuthService.GetUserRole()||!token||token!==this.AuthService.GetAccessToken())return;
                this.originalModel=JSON.stringify(data);
                this.model=[...data];
            },error:()=>{if(generation===this.menuGeneration){this.model=[];this.originalModel='[]';}}});
            return;
        }
        this.MenuClient.menuBindUserMenu(environment.SubPath).subscribe(data => {
            this.originalModel = JSON.stringify(data);
            this.model = [...data];
        });

    }

    ngOnDestroy() {
        ++this.menuGeneration;
        this.menuRequest?.unsubscribe();
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
