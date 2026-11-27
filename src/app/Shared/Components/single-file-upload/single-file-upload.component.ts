import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { InputGroupModule } from 'primeng/inputgroup';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgIf } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-single-file-upload',
  templateUrl: './single-file-upload.component.html',
  imports: [InputGroupModule, TooltipModule, FileUploadModule, InputTextModule, ButtonModule, FormsModule, ProgressBarModule, NgIf],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  styleUrl: './single-file-upload.component.css',
  standalone: true
})
export class SingleFileUploadComponent {
  @ViewChild('advancedfileinput') advancedFileInput: ElementRef | undefined | any;
  @Input() Placeholder: string = ""
  @Input() DownloadLink: any
  @Input() FieldGUID: string = ""
  @Input() Submitted: boolean = false
  @Input() ReadOnly: boolean = false
  @Input() Required: boolean = false
  @Input() ShowDonlowd: boolean = true
  @Input() Label: string = ""
  @Input() Data: any
  @Input() PublicFile: boolean = false
  @Output() DataValueChange = new EventEmitter();
  Name: string = "";


  constructor(private http: HttpClient, private messageService: MessageService) {

  }

  ngOnInit(): void {

    this.Name = StaticFunctions.GetUUID();
  }

  downloading = false;
  downloadProgress = 0
  downloadFile(): void {

    if (this.PublicFile == true) {

      let url=environment.apiUrl + "/Gdoc/GFile/DownloadPublicFile/" + this.DownloadLink;
      let Address = ((window.location.href.includes('.bolut.ir'))) ? url : url.replace('https://', 'http://').replace('.bolut.ir', '.bolut.net');
      window.open(Address, '_blank');
      return;
    } else {

      this.downloading = true;
      this.downloadProgress = 0;
      let url = environment.apiUrl + "/Gdoc/GFile/DownloadFile";

      const data = {
        "Link": this.DownloadLink
      };

      this.http.request("post", url as string, {
        responseType: 'blob',
        body: data,
        reportProgress: true,
        observe: 'events',

      }).subscribe({
        next: (event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.Response:
              {
                this.downloading = false;
                this.downloadProgress = 0;

                if (event['status'] == 200) {

                  const url = window.URL.createObjectURL(event.body);
                  window.open(url);

                } else if (event['status'] == 400) {

                }

                break;
              }

            case HttpEventType.DownloadProgress: {
              if (event['loaded']) {

                this.downloadProgress = Math.round((event['loaded'] * 100) / event['total']!);
              }


              break;
            }
          }


        },
        error: (error: ErrorEvent) => {
          this.downloading = false;


        }
      });

    }


  }

  OnDataValueChange(Data: any) {
    this.DataValueChange.emit(Data);
  }

  onUpload(a: any) {

  }

  choose() {
    this.advancedFileInput?.nativeElement.click();
  }


  uploading = false;
  progress = 0;
  uploadFile() {

    this.uploading = true;
    this.progress = 0;
    let url = ''
    if (this.PublicFile == false) {
      url = environment.apiUrl + "/Gdoc/GFile/UploadFile";
    } else {
      url = environment.apiUrl + "/Gdoc/GFile/UploadPublicFile";
    }


    let formData = new FormData();


    formData.append('data', this.File!, this.File!.name);

    this.http
      .request("post", url as string, {
        body: formData,

        reportProgress: true,
        observe: 'events',

      }).subscribe({
        next: (event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.Response:
              this.uploading = false;
              this.progress = 0;

              if (event['status'] == 201) {
                this.File = null;
                let Link = event.body;
                this.OnDataValueChange(Link);
                this.DownloadLink = Link
                this.Data = Link;
              }

              break;

            case HttpEventType.UploadProgress: {
              if (event['loaded']) {
                this.progress = Math.round((event['loaded'] * 100) / event['total']!);
                console.log(this.progress)
              }

              break;
            }
            case HttpEventType.ResponseHeader: {
              break;
            }
          }


        },
        error: (error: ErrorEvent) => {

          this.uploading = false;


        }
      });
  }

  File: File | null;

  onFileSelect(event: any) {

    this.File = event.target.files[0];
    event.target.files = null;
    this.uploadFile();

  }
}
