
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { PackageCategoryClient, CreatePackageCategoryCommand } from '../../../../../Services/api-client';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';
import { InputTextareaComponent } from "../../../../../Shared/Components/input-textarea/input-textarea.component";
import { InputNumberComponent } from "../../../../../Shared/Components/input-number/input-number.component";
import { SingleFileUploadComponent } from "../../../../../Shared/Components/single-file-upload/single-file-upload.component";
@Component({
    selector: 'CreatePackageCategory',
    imports: [PanelModule, FormsModule, ButtonModule, InputStringComponent, InputTextareaComponent, InputNumberComponent, SingleFileUploadComponent],
    providers:[PackageCategoryClient],
    templateUrl: './CreatePackageCategory.component.html',
    styleUrl: './CreatePackageCategory.component.scss',
    standalone:true
})
export class CreatePackageCategoryComponent {
    CreatePackageCategoryCommand:CreatePackageCategoryCommand=new CreatePackageCategoryCommand();
    ChangePage: boolean = false;
    constructor(private PackageCategoryClient:PackageCategoryClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/Package/PackageCategory/ChangePackageCategory/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        }
    }
    LoadData(guid: string) {
        this.PackageCategoryClient.getPackageCategoryById(guid).subscribe(Data => {
            this.CreatePackageCategoryCommand = Data;
        })
    }

    Insert() {
        this.PackageCategoryClient.createPackageCategory(this.CreatePackageCategoryCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.PackageCategoryClient.updatePackageCategory(this.CreatePackageCategoryCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/Package/PackageCategory'])
    }
}


