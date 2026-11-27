
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TreeBaseComponent } from '../../tree-base/tree-base.component';
import { OrgLocationClient, OrgLocationWithPaginationDTO } from '../../../Services/api-client';
import { BaseComponent, TableConfig } from '../../base/base.component';
import { PanelModule } from 'primeng/panel';
import { DropdownComponent } from '../../Components/dropdown/dropdown.component';
import { FormsModule } from '@angular/forms';
@Component({
    selector: 'SelectOrgLocationModal',
    imports: [BaseComponent, PanelModule, ButtonModule, TooltipModule, FormsModule],
    providers: [OrgLocationClient],
    templateUrl: './SelectOrgLocationModal.component.html',
    styleUrl: './SelectOrgLocationModal.component.scss',
    standalone: true
})
export class SelectOrgLocationModalComponent {
    @ViewChild(TreeBaseComponent) TreeBaseComponent: TreeBaseComponent;
    TableConfig: TableConfig[] = [];
    @Output() onSelect = new EventEmitter<OrgLocationWithPaginationDTO>();
    constructor(
    ) {
        this.setTableConfig();
    }

    setTableConfig() {
        this.TableConfig = [
            { Name: 'name', PersianName: 'عنوان', FilterTypeBy: '', FilterType: 1 },
            { Name: '', PersianName: 'عملیات', FilterTypeBy: '', FilterType: 0 },

        ].map(item => ({
            ...new TableConfig(),
            ...item
        }))
    }

    select(item: any) {
        this.onSelect.emit(item);
    }

    OrgLocationTypeCode: number | undefined = undefined;
    ProvinceGuid: string | undefined = undefined;
    CityGuid: string | undefined = undefined;
    params: any = {};
    Search() {
        this.params = {
            OrgLocationTypeCode: this.OrgLocationTypeCode,
            ProvinceGuid: this.ProvinceGuid,
            CityGuid: this.CityGuid,
        };

        this.setTableConfig();
    }

    Clean() {
        this.OrgLocationTypeCode = undefined;
        this.ProvinceGuid = undefined;
        this.CityGuid = undefined;
        this.Search();
    }
}


