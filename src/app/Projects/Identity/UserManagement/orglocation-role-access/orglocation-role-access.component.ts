import { MessageService } from 'primeng/api';
import { NgFor, NgIf } from '@angular/common';
import { OrglocationPackageClient, OrglocationPackageGetCurrentUserPacksDTO, MenuClient, RoleAccessClient, RoleAccessUpdateAccessFromOrglocationCommand } from './../../../../Services/api-client';
import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { ActivatedRoute } from '@angular/router';
import { TreeModule } from 'primeng/tree';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-orglocation-role-access',
  imports: [AccordionModule, CardModule,NgFor,TreeModule,ButtonModule,NgIf],
  providers: [OrglocationPackageClient,MenuClient,RoleAccessClient],
  templateUrl: './orglocation-role-access.component.html',
  styleUrl: './orglocation-role-access.component.scss',
  standalone: true
})
export class OrglocationRoleAccessComponent {
    RoleGUID:string;
  Packs: OrglocationPackageGetCurrentUserPacksDTO[] = []
  items:any[]=[]
  selectedFiles:any[]=[]
  Changed=false;
  constructor(private OrglocationPackageClient: OrglocationPackageClient,
private RoleAccessClient:RoleAccessClient,
    private MenuClient:MenuClient,
    private ActivatedRoute:ActivatedRoute,
    private MessageService:MessageService
  ) {
    this.ActivatedRoute.paramMap.subscribe(params => {
        this.RoleGUID = params.get('RoleGUID') || '';
        this.LoadPacks();
    });

  }

  LoadPacks() {
    this.OrglocationPackageClient.getCurrentUserPacks().subscribe(Data => {
      this.Packs = Data;
      if( this.Packs.length>0){
        this.LoadData(0)
      }
    })
  }

  SelectedPackIndex=0;
  LoadData(index:any){
    this.SelectedPackIndex=index;
this.MenuClient.menuForAccess(this.Packs[index].guid!,this.RoleGUID).subscribe(Data=>{
    this.Changed=false;
    this.selectedFiles=[];
    this.items=Data;
    this.SetCheckStatus(this.items);
})
  }

  SetCheckStatus(Data:any[]){
    Data.forEach((val,index)=>{
        if(val.checked==true){

            this.selectedFiles.push(val);

        }
        this.SetCheckStatus(val.children)
    })
  }

  UpdateList(){

    let Data=new RoleAccessUpdateAccessFromOrglocationCommand();
    Data.menuGUIDs=this.selectedFiles.map(a=>a.key)
    Data.orglocationPackageGUID=this.Packs[this.SelectedPackIndex].guid;
    Data.roleGUID=this.RoleGUID;

    this.RoleAccessClient.updateAccessFromOrglocation(Data).subscribe(Data=>{
        this.Changed=false;
        StaticFunctions.ShowSuccess(this.MessageService)
    })
  }
}
