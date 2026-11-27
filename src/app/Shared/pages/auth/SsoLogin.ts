import { AuthService } from './../../Services/AuthService';
import { SsoClient, SsoSsoLoginCommand } from './../../../Services/api-client';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
    selector: 'app-login',
    standalone: true,
    providers: [SsoClient],
    imports: [],
    template: `


    `
})

export class SsoLogin {

    constructor(private ActivatedRoute: ActivatedRoute,private SsoClient:SsoClient,private AuthService:AuthService) {
        this.ActivatedRoute.paramMap.subscribe(params => {
            let key = params.get('key') || '';
            this.GetToken(key);
        });

    }


    GetToken(key: string) {
        let data:SsoSsoLoginCommand=new SsoSsoLoginCommand();
        data.key=key;
        this.SsoClient.ssoLogin(data).subscribe(Data=>{
            this.AuthService.SetToken(Data,true)
        },e=>{
            //window.close()
        })
    }
}

