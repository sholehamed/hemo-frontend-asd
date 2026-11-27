import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs/internal/Observable";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthToken } from "./AuthToken";
import { MenuItem } from "primeng/api";
import { environment } from "../../../environments/environment";
import { Token } from "../../Services/api-client";




@Injectable({
    providedIn: 'root' // این باعث می‌شود که AuthService به صورت خودکار در کل برنامه استفاده شود
})
export class AuthService {
    public static RequestCount = 0;
    
    APIUrl: string = "";

    constructor(private http: HttpClient, private Router: Router) {
        this.APIUrl = environment.apiUrl;
    }
    CheckPagePermission(Menu: string): Observable<boolean> {
        
        let Data = { Menu: Menu }
        return this.http.post<boolean>(
            this.APIUrl + `/Identity/RoleAccess/CheckPagePermission`, Data, { responseType: "json" }
        );
    }
    SetToken(AuthToken: Token, ChangeRoute: boolean = true): void {

        sessionStorage.setItem("userRole", AuthToken.userRole?.toString()??'');
        sessionStorage.setItem("Token", AuthToken.key!);
        sessionStorage.setItem("firstName", AuthToken.firstName!);
        sessionStorage.setItem("lastName", AuthToken.lastName!);
      
        if (ChangeRoute) {
            this.Router.navigate([''])
        }

    }
    SetUserRole(UserRole: number): void {

        if (UserRole > 0) {
            sessionStorage.setItem("UserRole", UserRole.toString());
        }

    }
    GetUserRole(): number {

        try {
            let UserRole = sessionStorage.getItem("UserRole")?.toString();
            return parseInt(UserRole!);
        } catch (error) {
            return 0;
        }

    }
    GetFullname(): any {
        let Fullname = sessionStorage.getItem("Fullname");
        return Fullname;
    }
    LogOut() {
        sessionStorage.clear();
        this.CloseAllModals();
        this.Router.navigate(['']);
        this.OpenLoginPage();
       
    }
    GetToken(Username: string, Password: string): Observable<AuthToken> {
        let Login = { Username: Username, Password: Password }
        return this.http.post<AuthToken>(
            this.APIUrl + `api/user/login`, Login, { responseType: "json" }
        );
    }
    MenuBindUserMenu(): Observable<MenuItem[]> {

        return this.http.get<MenuItem[]>(
            this.APIUrl + `api/Menu/MenuBindUserMenu`, { responseType: "json" }
        );
    }

    RefreshTokenToken(): Observable<Token> {
        
        return this.http.get<Token>(
            this.APIUrl + `/Identity/user/RefreshToken`, { responseType: "json" }
        );
    }

    OpenLoginPage() {
        this.Router.navigate(['/auth/login']);
    }
    OpenforbiddenPage() {
        this.Router.navigate(['/auth/forbidden']);
    }
    GetAccessToken() {
        let Token = sessionStorage.getItem("Token");
        return Token;
    }
    UserIsAthenticated(): boolean {
        let Token = sessionStorage.getItem("Token");
        if (Token == null || Token == '') {
            return false;
        } else {
            return true;
        }
    }

    CheckAccessToken(): void {
        if (!this.UserIsAthenticated()) {
            this.OpenLoginPage();
        }
    }
    CloseAllModals() {
        // this.DialogService.dialogComponentRefMap.forEach(dialog => {
        //   dialog.destroy();

        // });
    }
    GoToHomePage(): void {
        this.CloseAllModals();
        this.Router.navigate([''])
    }
}
