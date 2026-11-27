
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { UserClient, CreateUserCommand } from '../../../../../Services/api-client';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
@Component({
    selector: 'CreateUser',
    imports: [PanelModule,FormsModule,ButtonModule,InputStringComponent,NgIf],
    providers:[UserClient],
    templateUrl: './CreateUser.component.html',
    styleUrl: './CreateUser.component.scss',
    standalone:true
})
export class CreateUserComponent {
    CreateUserCommand:CreateUserCommand|any=new CreateUserCommand();
    ChangePage: boolean = false;
    constructor(private UserClient:UserClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/UserManagement/User/ChangeUser/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        }
    }
    LoadData(guid: string) {
        this.UserClient.getUserById(guid).subscribe(Data => {
            this.CreateUserCommand = Data;
        })
    }

    Insert() {
        this.UserClient.createUser(this.CreateUserCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.UserClient.updateUser(this.CreateUserCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/UserManagement/User'])
    }
}


