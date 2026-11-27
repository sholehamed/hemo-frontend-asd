
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { PackageClient, CreatePackageCommand } from '../../../../../Services/api-client';
import { InputNumberComponent } from '../../../../../Shared/Components/input-number/input-number.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { InputTreeSelectComponent } from "../../../../../Shared/Components/input-tree-select/input-tree-select.component";
import { InputTextareaComponent } from "../../../../../Shared/Components/input-textarea/input-textarea.component";
import { DropdownComponent } from "../../../../../Shared/Components/dropdown/dropdown.component";
import { SingleFileUploadComponent } from "../../../../../Shared/Components/single-file-upload/single-file-upload.component";
@Component({
    selector: 'CreatePackage',
    imports: [PanelModule, FormsModule, ButtonModule, InputStringComponent, InputNumberComponent, InputTreeSelectComponent, InputTextareaComponent, DropdownComponent, SingleFileUploadComponent],
    providers: [PackageClient],
    templateUrl: './CreatePackage.component.html',
    styleUrl: './CreatePackage.component.scss',
    standalone: true
})
export class CreatePackageComponent {
    CreatePackageCommand: CreatePackageCommand = new CreatePackageCommand();
    ChangePage: boolean = false;
    PackageCategoryGUID: string = "";
    Title: string = "";
    constructor(private PackageClient: PackageClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        this.ActivatedRoute.paramMap.subscribe(params => {
            this.PackageCategoryGUID = params.get('PackageCategoryGUID') || '';
            this.Title = params.get('Title') || '';
            this.CreatePackageCommand.packageCategoryGUID=   this.PackageCategoryGUID;
        });
        if (StaticFunctions.GetFormUrl() == '/Identity/Package/Package/ChangePackage/:GUID/:PackageCategoryGUID/:Title') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        } else {
            this.CreatePackageCommand.expireDays = 360;
            this.SetMaxGorder();
        }
    }
    SetMaxGorder() {
        this.PackageClient.getMaxGorder(this.PackageCategoryGUID).subscribe(Data => {
            this.CreatePackageCommand.gorder = Data;
        })
    }
    LoadData(guid: string) {
        this.PackageClient.getPackageById(guid).subscribe(Data => {
            this.CreatePackageCommand = Data;
        })
    }

    Insert() {
        this.CreatePackageCommand.packageCategoryGUID = this.PackageCategoryGUID
        this.PackageClient.createPackage(this.CreatePackageCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.PackageClient.updatePackage(this.CreatePackageCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate([`/Identity/Package/Package/${this.PackageCategoryGUID}/${this.Title}`])
    }



}


