import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { UserInfoComponent } from "./user-info/user-info.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";

@Component({
  selector: 'app-profile',
  imports: [TabsModule, UserInfoComponent, ChangePasswordComponent,UserInfoComponent,ChangePasswordComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

}
