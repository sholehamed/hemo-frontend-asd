import { NgForm, ControlContainer, FormsModule } from '@angular/forms';
import { Component, OnInit, Input, EventEmitter, Output, SimpleChanges } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StaticFunctions } from '../../Services/StaticFunctions';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./dropdown.component.css'],
    imports: [
        DropdownModule,
        FormsModule,
        NgIf
    ],
    standalone: true
})
export class DropdownComponent implements OnInit {
    @Input() Submitted: boolean = false
    @Input() Required: boolean = false
    @Input() SelectFirstItem: boolean = false
    Name: string = "";
    @Input() filter: boolean = true;
    @Input() RestartInDataCountZero: boolean = true;
    @Input() Data: any;
    @Output() DataValueChange = new EventEmitter();
    @Output() DataChange = new EventEmitter();
    @Input() DataIdName: string = "guid";
    @Input() OptionName: string = "name";
    @Input() Label: string = "";
    @Input() Options: any[] = [];
    @Input() OptionsUrl: string = "";
    @Input() Direction: string = 'rtl';
    @Input() ReadOnly: boolean = false;

    SelectedData: any = null;
    ViewInit = false;
    constructor(private http: HttpClient) {
    }
    ngModelChange(value: any) {
        this.DataValueChange.emit(value[this.DataIdName]);
        this.DataChange.emit(value);
    }


    ngOnInit(): void {
        this.Name = StaticFunctions.GetUUID();
        this.ViewInit = true;
       
    }

    setData() {
        if (this.Data != null && this.Data != '' && this.Options.length > 0) {
           try {
            this.SelectedData = this.Options.find(item => { return item[this.DataIdName].toLowerCase() == this.Data.toLowerCase() })
           } catch (error) {
            this.SelectedData = this.Options.find(item => { return item[this.DataIdName] == this.Data })
           }
        } else if ((this.Data == null || this.Data == '') && this.Options.length > 0 && this.SelectFirstItem == true) {
            this.SelectedData = this.Options[0];
            this.ngModelChange(this.SelectedData);
        }
    }

    LoadOptions(url: string) {
        if (url != null && url != '') {
            if (!url.startsWith('http')) {
                if (!url.startsWith('/')) {
                    url = '/' + url
                }
                url = environment.apiUrl + url;
            }
            this.http.get<any[]>(url).subscribe(Data => {
                this.Options = Data;

                if (this.Options.length == 0) {
                    this.Clear()
                } else {
                    this.setData();
                }


            })
        }

    }
    Clear() {
        this.SelectedData = null;
        this.DataValueChange.emit(null);
        this.DataChange.emit(null);
    }

    ngOnChanges(changes: any) {
        if (changes.OptionsUrl != null) {
            this.LoadOptions(changes.OptionsUrl.currentValue);
        }

        if (changes.Data != null) {

            if (changes.Data.currentValue != null && changes.Data.currentValue != '') {
                this.setData()
            }
        }
    }



}


