import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeSelect } from 'primeng/treeselect';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { environment } from '../../../../environments/environment';
import { NgIf } from '@angular/common';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-input-tree-select',
  templateUrl: './input-tree-select.component.html',
  styleUrl: './input-tree-select.component.css',
  imports: [
    TreeSelect,
    FormsModule,
    NgIf
  ],
  standalone: true
})
export class InputTreeSelectComponent {
  @Input() Submitted: boolean = false
  @Input() Required: boolean = false
  Name: string = "";
  @Input() filter: boolean = true;
  @Input() RestartInDataCountZero: boolean = true;
  @Input() Data: any;
  @Output() DataValueChange = new EventEmitter();
  @Output() DataChange = new EventEmitter();
  
  @Input() appendTo: string|null =null;
  @Input() DataIdName: string = "guid";
  @Input() OptionName: string = "name";
  @Input() Label: string = "";
  @Input() Options: TreeNode[] = [];
  @Input() OptionsUrl: string = "";
  @Input() ReadOnly: boolean = false;
  ArrayData: any[];

  SelectedData: any = null;
  ViewInit = false;

  constructor(private http: HttpClient) {
  }
  ngAfterViewInit() {
    this.ViewInit = true;

  }
  ngModelChange(value: any) {

    this.DataValueChange.emit(value.key);
    this.DataChange.emit(value);
  }
  Clear() {
    this.SelectedData=null;
    this.DataValueChange.emit(null);
    this.DataChange.emit(null);
  }



  ngOnInit(): void {
    this.Name = StaticFunctions.GetUUID();
    if (this.OptionsUrl != '') {
      this.LoadOptions(this.OptionsUrl)
    }
  }
  LoadOptions(url: string) {
    if (url != '' && url != null) {
      if (!url.startsWith('http')) {
        if (!url.startsWith('/')) {
          url = '/' + url
        }
        url = environment.apiUrl + url;
      }
      this.http.get<any[]>(url).subscribe(Data => {
        this.Options = Data;
        if(this.Options.length==0){
          this.Clear()
        }else{
          this.setData();
        }      
      })
    }
  }

  findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {

    if (key == null || key == '') {
      return null;
    }

    for (const node of nodes) {
      if (node.key?.toLowerCase() === key.toLowerCase()) {
        return node;
      }

      if (node.children && node.children.length > 0) {
        const foundNode = this.findNodeByKey(node.children, key);
        if (foundNode) {
          return foundNode;
        }
      }
    }

    return null;
  }

  setData() {

    if(this.Data!=null&&this.Data!=''&&this.Options.length>0){
      this.SelectedData = this.findNodeByKey(this.Options, this.Data);
    }
   

  }

  ngOnChanges(changes: any) {

    if (changes.OptionsUrl != null) {
      this.LoadOptions(changes.OptionsUrl.currentValue)
    }

    if (changes.Data != null) {
      
      if (changes.Data.currentValue != null && changes.Data.currentValue != '') {
        this.setData()

      }
    }
  }

}
