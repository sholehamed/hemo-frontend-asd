
import { Routes } from '@angular/router';
import { authGuardGuard } from '../../../Shared/AuthGuard/auth-guard.guard';
import { StaticFunctions } from '../../../Shared/Services/StaticFunctions';
import { GetTicketWithPaginationComponent } from './GetTicketWithPagination/GetTicketWithPagination.component';
import { ChatComponent } from './chat/chat.component';

export default [

    {
        path: 'Chat/:TicketGUID', component: ChatComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Tickets', component: GetTicketWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Tickets1', component: GetTicketWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Tickets2', component: GetTicketWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Tickets3', component: GetTicketWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;


