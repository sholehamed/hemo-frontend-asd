
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuClient, CreateMenuCommand } from '../../../../../Services/api-client';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { InputNumberComponent } from '../../../../../Shared/Components/input-number/input-number.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
@Component({
    selector: 'CreateMenu',
    imports: [PanelModule,FormsModule,ButtonModule,InputStringComponent,InputNumberComponent],
    providers:[MenuClient],
    templateUrl: './CreateMenu.component.html',
    styleUrl: './CreateMenu.component.scss',
    standalone:true
})
export class CreateMenuComponent {
    CreateMenuCommand:CreateMenuCommand=new CreateMenuCommand();
    pguid:string="";
    guid:string="";
    ChangePage: boolean = false;
    constructor(private MenuClient:MenuClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {

        if (StaticFunctions.GetFormUrl() == '/Identity/SystemSetting/Menu/CreateMenu/:pguid') {

            this.ChangePage = false;
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.pguid = params.get('pguid') || '';

            });
        }

        if (StaticFunctions.GetFormUrl() == '/Identity/SystemSetting/Menu/ChangeMenu/:guid') {

            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.guid = params.get('guid') || '';
                this.LoadData(this.guid );
            });
        }

    }
    LoadData(guid: string) {
        this.MenuClient.getMenuById(guid).subscribe(Data => {
            this.CreateMenuCommand = Data;
        })
    }

    Insert() {
        if(this.pguid!='1'){
            this.CreateMenuCommand.pMenuGUID=this.pguid;
        }

        this.MenuClient.createMenu(this.CreateMenuCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.MenuClient.updateMenu(this.CreateMenuCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/SystemSetting/Menu'])
    }
}


