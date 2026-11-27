import { Component,OnInit,inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';

// The shell mounts this route only after capability discovery. Never redirect
// from shell initialization, because a deep link may still be navigating.
@Component({standalone:true,imports:[RequestStateComponent],template:'<app-request-state [loading]="true"/>'})
export class HomeComponent implements OnInit {
 private auth=inject(AuthService);private router=inject(Router);
 ngOnInit(){void this.router.navigateByUrl(this.auth.homePath(),{replaceUrl:true});}
}
