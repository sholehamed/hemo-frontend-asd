
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseComponent, TableConfig } from '../../../../Shared/base/base.component';
import { DemoRequestClient, UpdateDemoRequestCommand } from '../../../../Services/api-client';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { NgIf } from '@angular/common';
import { Location } from '@angular/common';

@Component({
    selector: 'GetDemoRequestWithPagination',
    imports: [BaseComponent, NgIf, ButtonModule, TooltipModule, RouterLink],
    providers: [DemoRequestClient],
    templateUrl: './GetDemoRequestWithPagination.component.html',
    styleUrl: './GetDemoRequestWithPagination.component.scss',
    standalone: true
})
export class GetDemoRequestWithPaginationComponent {
    @ViewChild(BaseComponent) BaseComponent: BaseComponent;
    TableConfig: TableConfig[] = [];
    Accepted: any;
    UserGUID = ''
    Params: any;
    ShowUserInfo = false
    constructor(private DemoRequestClient: DemoRequestClient, private ActivatedRoute: ActivatedRoute,private location: Location
        , private ConfirmationService: ConfirmationService, private MessageService: MessageService
    ) {

        let Url = StaticFunctions.GetFormUrl();
        switch (Url) {
            case '/Identity/Package/DemoRequests': {
                this.Accepted = null;
                this.UserGUID = '00000000-0000-0000-0000-000000000000';
                this.setTableConfig();
                break;
            }
            case '/Identity/Package/DemoRequestNotConfirms': {
                this.Accepted = false;
                this.UserGUID = '00000000-0000-0000-0000-000000000000';
                this.setTableConfig();
                break;
            }
            case '/Identity/Package/DemoRequestConfirms': {
                this.Accepted = true;
                this.UserGUID = '00000000-0000-0000-0000-000000000000';
                this.setTableConfig();
                break;
            }
            case '/Identity/Package/UserDemoRequests/:UserGUID': {
                this.ShowUserInfo = true;
                this.Accepted = null;
                this.ActivatedRoute.paramMap.subscribe(params => {
                    this.UserGUID = params.get('UserGUID') || '';
                    this.setTableConfig();
                });

                break;
            }




        }



    }
 goBack() {
    this.location.back();
  }
    setTableConfig() {
        this.Params = { UserGUID: this.UserGUID, Accepted: this.Accepted }
        if (this.ShowUserInfo) {
            this.TableConfig = [
                           { Name: 'userFirstName', PersianName: 'نام', FilterTypeBy: 'User.FirstName', FilterType: 1 },
                { Name: 'userLastName', PersianName: 'نام خانوادگی', FilterTypeBy: 'User.LastName', FilterType: 1 },
                { Name: 'userMobile', PersianName: 'تلفن همراه', FilterTypeBy: 'User.Mobile', FilterType: 1 },
                { Name: 'package', PersianName: 'پکیج', FilterTypeBy: 'Package.Name', FilterType: 1 },
                { Name: 'orgLocation', PersianName: ' شرکت', FilterTypeBy: 'OrgLocation.Name', FilterType: 1 },
                { Name: 'accepted', PersianName: 'قبول شده', FilterTypeBy: '', FilterType: 4 },
            ].map(item => ({
                ...new TableConfig(),
                ...item
            }))
        } else {
            this.TableConfig = [
                { Name: 'userFirstName', PersianName: 'نام', FilterTypeBy: 'User.FirstName', FilterType: 1 },
                { Name: 'userLastName', PersianName: 'نام خانوادگی', FilterTypeBy: 'User.LastName', FilterType: 1 },
                { Name: 'userMobile', PersianName: 'تلفن همراه', FilterTypeBy: 'User.Mobile', FilterType: 1 },
                { Name: 'package', PersianName: 'پکیج', FilterTypeBy: 'Package.Name', FilterType: 1 },
                { Name: 'orgLocation', PersianName: ' شرکت', FilterTypeBy: 'OrgLocation.Name', FilterType: 1 },
                { Name: 'accepted', PersianName: 'قبول شده', FilterTypeBy: '', FilterType: 4 },
                { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },
                { Name: '', PersianName: 'درخواست های قبلی', FilterTypeBy: '', FilterType: 0 },
            ].map(item => ({
                ...new TableConfig(),
                ...item
            }))
        }

    }

    updateDemoRequest(item: any, accepted: boolean) {

        StaticFunctions.confirm(this.ConfirmationService, () => {
            let sendData = new UpdateDemoRequestCommand();
            sendData.guid = item.guid;
            sendData.accepted = accepted;
            this.DemoRequestClient.updateDemoRequest(sendData).subscribe(Data => {
                StaticFunctions.ShowSuccess(this.MessageService)
                this.BaseComponent.LoadData()
            })
        }, () => { })

    }

}


