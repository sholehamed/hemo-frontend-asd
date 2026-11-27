import { Filter, PageFilter } from './../Models/PageFilter';
import {
    CommonModule,
    NgClass,
    NgForOf,
    NgIf,
    NgStyle,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    NgTemplateOutlet
} from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ContentChild, Input } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatedList } from '../Models/PaginatedList';
import { GregorianToJalaliPipe } from "../../../tools/JalaliDatePipe";
import { FieldsetModule } from 'primeng/fieldset';
import { environment } from '../../../environments/environment';
import { Panel, PanelModule } from 'primeng/panel';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, NgModel } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';

export class TableConfig {
    Name: string;
    PersianName: string;
    FilterTypeBy: string;
    FilterType: number;
    ShowInRow: boolean = true
    field: any;
}
@Component({
    selector: 'app-base',
    imports: [TableModule, MultiSelectModule, NgClass, SkeletonModule, PanelModule, NgSwitch, NgSwitchCase, NgIf, NgTemplateOutlet, NgForOf, NgSwitchDefault, GregorianToJalaliPipe],
    templateUrl: './base.component.html',
    styleUrl: './base.component.scss',
    standalone: true
})
export class BaseComponent {

    @ContentChild('Header') Header: any;
    @ContentChild('Filter') Filter: any;
    @ContentChild('Body') Body: any;
    @ContentChild('RowActions') RowActions: any;
    @ContentChild('Actions') Actions: any;

    @Input() Params: any = {};
    @Input() Name: string = "";
    @Input() sortBy: string = "Created";
    @Input() DataUrl: string = "";
    @Input() TableConfig: TableConfig[] = [];

    loading: boolean = true;

    PageFilter: any = new PageFilter();

    PaginatedList: PaginatedList = new PaginatedList();
    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.PageFilter.sortBy =this.sortBy;
            this.LoadData();

    }

    LoadData() {

        let objectKeys = Object.keys(this.Params);
        objectKeys.forEach((val) => {
            this.PageFilter[val] = this.Params[val]
        });

        this.loading = true;
        this.http.post<PaginatedList>(
            environment.apiUrl + "/" + this.DataUrl, this.PageFilter, { responseType: "json" }).subscribe(Data => {

                this.PaginatedList = Data;
                this.loading = false;
            });
    }

    clear(table: Table) {
        table.clear();
    }

    onFilter(a: any) {

        this.PageFilter.filters = []
        let objectKeys = Object.keys(a.filters);
        objectKeys.forEach((val) => {
            let _filter = new Filter();
            _filter.filterBy = val;
            _filter.operatorType = a.filters[val][0].matchMode;
            let value = a.filters[val][0].value;
            if (value != null && value !== '') {
                if (typeof value === 'number' || typeof value === 'boolean') {
                    value = value.toString();
                }

                _filter.value = value;
                this.PageFilter.filters.push(_filter);
            }
        });
        this.LoadData();
    }
    onLazyLoad(a: any) {
        a.forceUpdate();
    }
    onSort(a: any) {

        this.PageFilter.sortBy = a.field;
        this.PageFilter.isDescending = (a.order == 1) ? false : true;
        this.PageFilter.pageNumber = 1;
        this.LoadData();
    }
    onPage(a: any) {

        this.PageFilter.pageNumber = a.first / a.rows + 1;
        this.PageFilter.pageSize = a.rows;
        this.LoadData();
    }

}
