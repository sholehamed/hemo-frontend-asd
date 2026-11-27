import { DragDropModule } from 'primeng/dragdrop';
import { HttpClient } from '@angular/common/http';

import { Component, OnInit, ChangeDetectorRef, Input, ContentChild, Output, EventEmitter } from '@angular/core';
import { TreeDragDropService, TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TableConfig } from '../base/base.component';
import { PaginatedList } from '../Models/PaginatedList';
import { environment } from '../../../environments/environment';
import { Filter, PageFilter } from '../Models/PageFilter';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';



export interface DragDropItem{
    Drag:any;
    Drop:any
}

@Component({
    selector: 'app-tree-base',
    imports: [TreeTableModule, CommonModule, TableModule, InputTextModule, FormsModule, ButtonModule, DragDropModule,PanelModule],
    templateUrl: './tree-base.component.html',
    styleUrl: './tree-base.component.scss',
    providers:[TreeDragDropService]
})
export class TreeBaseComponent {
    @ContentChild('Header') Header: any;
    @ContentChild('Filter') Filter: any;
    @ContentChild('Body') Body: any;
    @ContentChild('RowActions') RowActions: any;
    @ContentChild('Actions') Actions: any;
    @Input() Name: string = "";
    @Input() sortBy: string = "created";
    @Input() TableConfig: TableConfig[] = [];
    @Input() DataUrl: string = "";
    @Output() OnDragDrop = new EventEmitter<DragDropItem>();
    PageFilter: PageFilter = new PageFilter();
    Data!: TreeNode[];


    totalRecords!: number;

    loading: boolean = false;
    PaginatedList: PaginatedList = new PaginatedList();
    FilterData: any = {}
    constructor(private cd: ChangeDetectorRef, private http: HttpClient) { }

    dragged:any;
    dragStart(item:any) {

        this.dragged = item;
    }
    dragEnd() {
        this.dragged = null;
    }

    drop(item:any) {
        if (this.dragged) {
          this.OnDragDrop.emit({Drag:this.dragged,Drop:item})
        }
    }

    

    ngOnInit() {
        this.TableConfig.forEach((val) => {
            if (val.FilterTypeBy == '') {
                val.FilterTypeBy = val.Name
            }
        })
        this.LoadData();
    }

    LoadData() {
        this.PageFilter.filters = this.filters;
        this.loading = true;
        this.PageFilter.sortBy=this.sortBy;
        this.PageFilter.isDescending=false
        this.http.post<PaginatedList>(
            environment.apiUrl + "/" + this.DataUrl, this.PageFilter, { responseType: "json" }).subscribe(Data => {
                this.Data = []
                this.PaginatedList = Data;
                this.Data = this.PaginatedList.data
                this.cd.markForCheck();
                this.loading = false;
            });
    }



    onNodeExpand(event: any) {
        let _PageFilter: any = new PageFilter();
        _PageFilter.PGUID = event.node.data.guid;
        let _items: any[] = []
        this.loading = true;
        _PageFilter.filters = this.filters;
        _PageFilter.sortBy=this.sortBy;
        _PageFilter.isDescending=false
        this.http.post<PaginatedList>(
            environment.apiUrl + "/" + this.DataUrl, _PageFilter, { responseType: "json" }).subscribe(Data => {


                event.node.children = Data.data;
                this.Data = [...this.Data];
                this.cd.markForCheck();
                this.loading = false;
            });


    }
    filters: Filter[] = []
    onGlobalSearch(data: any, FilterBy: string) {

        this.FilterData[FilterBy] = data

        this.filters = []
        let objectKeys = Object.keys(this.FilterData);
        objectKeys.forEach((val) => {
            let _filter = new Filter();
            _filter.filterBy = val;
            let value = this.FilterData[val];
            if (value != null && value !== '') {
                if (typeof value === 'number' || typeof value === 'boolean') {
                    value = value.toString();
                }

                _filter.value = value;
                this.filters.push(_filter);
            }
        });


    }
    onPage(a: any) {

        this.PageFilter.pageNumber = a.first / a.rows + 1;
        this.PageFilter.pageSize = a.rows;
        this.LoadData();
    }
}
