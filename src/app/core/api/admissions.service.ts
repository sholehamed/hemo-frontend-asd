import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
export interface PatientIdentity {guid:string;firstName:string;lastName:string;fatherName:string|null;birthDate:string|null;gender:string;mobile:string|null}
export interface CreateAdmission {
  identificationType:string;identificationNumber:string;firstName:string;lastName:string;fatherName:string|null;birthDate:string|null;gender:string;mobile:string|null;
  hisNumber:string;ward:string;bedNumber:string;physician:string;admissionType:string;diagnosis:string|null;insurance:string|null;bloodGroup:string|null;transfusionHistory:string;
  allergy:boolean;leukoreduced:boolean;irradiated:boolean;alloantibody:boolean;notes:string|null
}
export interface AdmissionView extends CreateAdmission {guid:string;patientGuid:string;admittedAt:string;identityStatus:string;identityReviewedAt:string|null;wristbandCode:string;status:string;historyReviewedAt:string|null;clearanceChecklist:number;clearanceNotes:string|null;clearanceReviewedAt:string|null;version:string}
export interface AdmissionFilters {search?:string;ward?:string;identityStatus?:string;bloodGroup?:string;status?:string;pageNumber?:number;pageSize?:number;from?:string|null;to?:string|null}
export interface AdmissionPage {data:AdmissionView[];pageNumber:number;totalCount:number;totalPages:number;hasPreviousPage:boolean;hasNextPage:boolean}
export interface AdmissionGroup {name:string;count:number}
export interface AdmissionStats {total:number;active:number;verified:number;mismatch:number;ready:number;wards:AdmissionGroup[];bloodGroups:AdmissionGroup[]}
export interface AdmissionReview {kind:string;outcome:string;checklist:number;notes:string|null;reviewedAt:string}
export interface ReviewRequest {guid:string;kind:'Identity'|'History'|'Clearance';outcome:string;checklist:number;notes:string|null;version:string}
export interface UpdateAdmission {guid:string;ward:string;bedNumber:string;physician:string;diagnosis:string|null;insurance:string|null;notes:string|null;version:string}
@Injectable({providedIn:'root'})
export class AdmissionsService {
  private readonly http=inject(HttpClient);private readonly url='/Identity/PatientAdmission';
  list(filters:AdmissionFilters={}){return firstValueFrom(this.http.post<AdmissionPage>(this.url+'/BindPaging',filters));}
  get(guid:string){return firstValueFrom(this.http.get<AdmissionView>(this.url+'/'+encodeURIComponent(guid)));}
  find(identificationType:string,identificationNumber:string){return firstValueFrom(this.http.get<PatientIdentity|null>(this.url+'/FindPatient',{params:new HttpParams().set('identificationType',identificationType).set('identificationNumber',identificationNumber)}));}
  create(request:CreateAdmission){return firstValueFrom(this.http.post<string>(this.url,request));}
  update(request:UpdateAdmission){return firstValueFrom(this.http.put<void>(this.url,request));}
  history(guid:string){return firstValueFrom(this.http.get<AdmissionView[]>(this.url+'/'+encodeURIComponent(guid)+'/History'));}
  reviews(guid:string){return firstValueFrom(this.http.get<AdmissionReview[]>(this.url+'/'+encodeURIComponent(guid)+'/Reviews'));}
  stats(filters:{ward?:string;from?:string|null;to?:string|null}={}){return firstValueFrom(this.http.post<AdmissionStats>(this.url+'/Stats',filters));}
  review(request:ReviewRequest){return firstValueFrom(this.http.post<void>(this.url+'/Review',request));}
}
