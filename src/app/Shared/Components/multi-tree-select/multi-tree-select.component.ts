import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';

@Component({
  selector: 'app-multi-tree-select',
  standalone: true,
  imports: [NgIf, FormsModule, TreeSelectModule],
  templateUrl: './multi-tree-select.component.html',
  styleUrl: './multi-tree-select.component.css'
})
export class MultiTreeSelectComponent {

  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
  @Input() Name: string = "";
  @Input() filter: boolean = true;
  @Input() RestartInDataCountZero: boolean = true;
  @Input() DataValue: any;
  @Output() DataValueChange = new EventEmitter();
  @Output() DataChange = new EventEmitter();
  @Input() DataIdName: string = "GUID";
  @Input() DataLabelName: string = "Name";
  @Input() PersianName: string = "";
  @Input() Data: any[] = [];

  ArrayData: any[];

  SelectedData: any[] = [];
  ViewInit = false;
  ngAfterViewInit() {
    this.ViewInit = true;

  }
  ngModelChange(val: any[]) {
    //
    let IDList = val.map(item => item[this.DataIdName])
    this.DataValueChange.emit(IDList)
    this.DataChange.emit(val)


  }


  ngOnInit(): void {

  }

  SetData() {

  }

  SetArrayData(Data: any[]) {
    this.ArrayData = [];
    Data.forEach((val, index) => {
      this.ArrayData.push(val);
      this.SetArrayDataFromParent(val);
    })
    return this.ArrayData;
  }

  SetArrayDataFromParent(Item: any) {
    Item.children?.forEach((val: any, index: number) => {
      this.ArrayData.push(val);
      this.SetArrayDataFromParent(val);
    })
  }

  ngOnChanges(changes: any) {

    if(changes.Data!=null){
      if (changes.Data.currentValue == null && changes.Data.firstChange == true && changes.Data.previousValue == null) {
        return;
      }

      if (this.RestartInDataCountZero == true && changes.Data != null && changes.Data?.previousValue?.length > 0 && changes.Data?.currentValue?.length == 0) {
        this.SelectedData = [];
        this.ngModelChange([]);
      } else if (changes.Data != null) {
        this.SetArrayData(changes.Data.currentValue);
        this.SelectedData = []
        this.DataValue?.forEach((Item: any) => {
          let ItemValue = this.ArrayData.find(element => { return element[this.DataIdName] == Item })
          if (ItemValue != null) {
            this.SelectedData.push(ItemValue)
          }
        });
        this.ngModelChange(this.SelectedData);
      }
    }


  }

}
