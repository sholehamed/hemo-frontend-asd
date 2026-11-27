
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateOrglocationPackageCommand, OrglocationPackageClient, TimeClient } from '../../../../../Services/api-client';
import { DropdownComponent } from '../../../../../Shared/Components/dropdown/dropdown.component';
import { DateInputComponent } from '../../../../../Shared/Components/date-input/date-input.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
@Component({
    selector: 'CreateOrglocationPackage',
    imports: [PanelModule, FormsModule, ButtonModule, DropdownComponent, DateInputComponent],
    providers: [OrglocationPackageClient, TimeClient],
    templateUrl: './CreateOrglocationPackage.component.html',
    styleUrl: './CreateOrglocationPackage.component.scss',
    standalone: true
})
export class CreateOrglocationPackageComponent {
    CreateOrglocationPackageCommand: CreateOrglocationPackageCommand = new CreateOrglocationPackageCommand();
    ChangePage: boolean = false;
    OrglocationGuid: string | undefined = undefined;
    constructor(private OrglocationPackageClient: OrglocationPackageClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private TimeClient: TimeClient,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/Organization/OrgLocation/CreateOrglocationPackage/:OrglocationGuid') {
            this.ActivatedRoute.paramMap.subscribe(params => {
                this.OrglocationGuid = params.get('OrglocationGuid') || undefined;
                this.CreateOrglocationPackageCommand.orgLocationGUID = this.OrglocationGuid;
            });
        }
        this.DateNow();
    }

    _dateNow: string | undefined = undefined;
    DateNow() {
        this.TimeClient.dateTimeNow().subscribe(res => {
            this._dateNow= res;
        });
    }
    LoadData(guid: string) {
        this.OrglocationPackageClient.getOrglocationPackageById(guid).subscribe(Data => {
            this.CreateOrglocationPackageCommand = Data;
        })
    }

    Insert() {
        this.OrglocationPackageClient.createOrglocationPackage(this.CreateOrglocationPackageCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.OrglocationPackageClient.updateOrglocationPackage(this.CreateOrglocationPackageCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/Organization/OrgLocation/OrglocationPackage/' + this.OrglocationGuid])
    }
}


