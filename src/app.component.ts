import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './app/Shared/Services/AuthService';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule, ConfirmDialogModule, ProgressBarModule, NgIf],
    template: `
     <div *ngIf="GetRequestCount()>0" class="TopProgress ">
  <p-progressBar mode="indeterminate" [style]="{ height: '5px' }"></p-progressBar>
</div>
      <div [class]="GetRequestCount()?'disable-all-buttons':''">
        <router-outlet></router-outlet> 
      </div>


    <p-toast [life]="10000" position="top-right" key="tr"></p-toast>
<p-toast position="top-left" key="tl"></p-toast>
<p-toast position="bottom-right" key="br"></p-toast>
<p-toast position="bottom-center" key="bc"></p-toast>
<p-toast position="bottom-left" key="bl"></p-toast>

<p-confirmDialog [style]="{width: '50vw'}" [baseZIndex]="10000" rejectButtonStyleClass="p-button-text">
</p-confirmDialog>
    `
})
export class AppComponent {

    GetRequestCount() {

        if (AuthService.RequestCount > 0) {
            this.SetDisable();
        } else {
            this.SetEnable();
        }
        return AuthService.RequestCount;
    }
    buttons: any[] = [];
    isDisable = false;
    SetDisable() {
        document.body.classList.add('disabled-all');

    }
    SetEnable() {
        document.body.classList.remove('disabled-all');

    }
}
