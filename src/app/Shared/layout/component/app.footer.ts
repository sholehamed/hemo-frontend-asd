import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <a href="https://asd.ir" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">کلیه حقوق این سامانه متعلق به راهکارهای ابری  بولوت می باشد</a>
    </div>`
})
export class AppFooter {
    AppName=environment.AppName
}
