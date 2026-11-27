import { NgForm, ControlContainer, FormsModule } from '@angular/forms';
import { Component, OnInit, Input, EventEmitter, Output, SimpleChanges } from '@angular/core';
import { MultiSelect } from 'primeng/multiselect';
import { NgIf } from '@angular/common';
import { PrimeTemplate } from 'primeng/api';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-multi-select-input',
    templateUrl: './multi-select-input.component.html',
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    styleUrls: ['./multi-select-input.component.css'],
    imports: [
        MultiSelect,
        FormsModule,
        NgIf,
        PrimeTemplate
    ],
    standalone: true
})
export class MultiSelectInputComponent {
  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
 Name: string = "";
  @Input() filter: boolean = true;
  @Input() RestartInDataCountZero: boolean = true;
  @Input() Data: any;
  @Output() DataValueChange = new EventEmitter();
  @Output() DataChange = new EventEmitter();
  @Input() DataIdName: string = "guid";
  @Input() OptionName: string = "name";
    @Input() OptionsUrl: string = "";
  @Input() Label: string = "";
  @Input() Options: any[] = [];

  SelectedData: any[] = [];
  constructor(private http:HttpClient) {
  }

  ngModelChange(val: any[]) {

    let IDList = val.map(item => item[this.DataIdName])
    this.DataValueChange.emit(IDList)
    this.DataChange.emit(val)


  }
    ngOnInit(): void {
        this.Name=StaticFunctions.GetUUID();
        if(this.OptionsUrl!=''){
            this.LoadOptions(this.OptionsUrl)
        }
    }
      LoadOptions(url:string){
          if(!url.startsWith('http')){
              if(!url.startsWith('/')){
                  url='/'+url
              }
              url=environment.apiUrl+url;
          }
          this.http.get<any[]>(url).subscribe(Data=>{
              this.Options=Data;
          })
      }

  ngOnChanges(changes: any) {
    if(changes.OptionsUrl!=null){
        this.LoadOptions(changes.OptionsUrl.currentValue)

    }
    // if(changes.Data!=null){

    //   if (changes.Data.currentValue == null && changes.Data.firstChange == true && changes.Data.previousValue==null) {
    //     return;
    //   }
    //   if (this.RestartInDataCountZero == true && changes.Data?.previousValue?.length > 0 && changes.Data?.currentValue?.length == 0) {
    //     this.ngModelChange([])
    //   }else if (changes.Data!=null) {
    //     this.SelectedData = []
    //     this.Options?.forEach((Item: any) => {


    //       let ItemValue = this.Options.find(element => { return element[this.DataIdName] == Item.toLowerCase() })
    //       if (ItemValue != null) {
    //         this.SelectedData.push(ItemValue)
    //       }
    //     });

    //   }
    }



  }

