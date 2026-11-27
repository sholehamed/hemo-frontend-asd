
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { UserInviteClient, CreateUserInviteCommand } from '../../../../../Services/api-client';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';

@Component({
    selector: 'CreateUserInvite',
    imports: [PanelModule,FormsModule,ButtonModule,InputStringComponent],
    providers:[UserInviteClient],
    templateUrl: './CreateUserInvite.component.html',
    styleUrl: './CreateUserInvite.component.scss',
    standalone:true
})
export class CreateUserInviteComponent {
    CreateUserInviteCommand:CreateUserInviteCommand=new CreateUserInviteCommand();
    ChangePage: boolean = false;
    constructor(private UserInviteClient:UserInviteClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('guid') || '';
                this.LoadData(guid)
            });
        }
    }
    LoadData(guid: string) {
        this.UserInviteClient.getUserInviteById(guid).subscribe(Data => {
            this.CreateUserInviteCommand = Data;
        })
    }

    Insert() {
        this.UserInviteClient.createUserInvite(this.CreateUserInviteCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.UserInviteClient.updateUserInvite(this.CreateUserInviteCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/UserManagement/UserInvite'])
    }
}


