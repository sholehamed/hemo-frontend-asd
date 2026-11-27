import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Error } from './error';
import { forbidden } from '../forbidden/forbidden';
import { SignUp } from './SignUp';
import { SsoLogin } from './SsoLogin';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: 'forbidden', component: forbidden },
    { path: 'signUp', component: SignUp },
    { path: 'SsoLogin/:key', component: SsoLogin },
] as Routes;
