
import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { DiscountClient, CreateDiscountCommand } from '../../../../../Services/api-client';
import { CheckboxComponent } from '../../../../../Shared/Components/checkbox/checkbox.component';
import { DateInputComponent } from '../../../../../Shared/Components/date-input/date-input.component';
import { InputNumberComponent } from '../../../../../Shared/Components/input-number/input-number.component';
import { InputStringComponent } from '../../../../../Shared/Components/input-string/input-string.component';
import { StaticFunctions } from '../../../../../Shared/Services/StaticFunctions';

@Component({
    selector: 'CreateDiscount',
    imports: [PanelModule, FormsModule, ButtonModule, InputStringComponent, CheckboxComponent, InputNumberComponent, DateInputComponent],
    providers: [DiscountClient],
    templateUrl: './CreateDiscount.component.html',
    styleUrl: './CreateDiscount.component.scss',
    standalone: true
})
export class CreateDiscountComponent {
    CreateDiscountCommand: CreateDiscountCommand = new CreateDiscountCommand();
    ChangePage: boolean = false;
    constructor(private DiscountClient: DiscountClient,
        private MessageService: MessageService,
        private ActivatedRoute: ActivatedRoute,
        private Router: Router) {
        if (StaticFunctions.GetFormUrl() == '/Identity/Package/ChangeDiscount/:GUID') {
            this.ChangePage = true;
            this.ActivatedRoute.paramMap.subscribe(params => {
                let guid = params.get('GUID') || '';
                this.LoadData(guid)
            });
        } else {
            this.CreateDiscountCommand.code = this.generatePassword();
            this.CreateDiscountCommand.usageLimit = 1;
            this.CreateDiscountCommand.usageLimitPerUser = 1;
            this.CreateDiscountCommand.percentage = true;
            this.CreateDiscountCommand.isActive = true;
             this.CreateDiscountCommand.minimumOrderAmount=0;
        }
    }
    generatePassword(length: number = 10): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }

        return password;
    }

    LoadData(guid: string) {
        this.DiscountClient.getDiscountById(guid).subscribe(Data => {
            this.CreateDiscountCommand = Data;
        })
    }

    Insert() {
        this.DiscountClient.createDiscount(this.CreateDiscountCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }
    Update() {
        this.DiscountClient.updateDiscount(this.CreateDiscountCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService);
            this.Back();
        })
    }

    Back() {
        this.Router.navigate(['/Identity/Package/Discount'])
    }
}


