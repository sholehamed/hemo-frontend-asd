import { ConfirmationService } from 'primeng/api';
import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, input, OnDestroy, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GregorianToJalaliPipe } from "../../../../../tools/JalaliDatePipe";
import { environment } from '../../../../../environments/environment';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { ProgressBar } from "primeng/progressbar";
import { InputStringComponent } from "../../../../Shared/Components/input-string/input-string.component";
import { FormsModule } from '@angular/forms';
import { Button } from "primeng/button";
import { ScrollPanel } from "primeng/scrollpanel";
import { Location } from '@angular/common';
import { StaticFunctions } from '../../../../Shared/Services/StaticFunctions';
import { TicketClient, TicketMessageClient, TicketFindByIdDTO, TicketCloseCommand, CreateTicketMessageCommand } from '../../../../Services/api-client';

@Component({
  selector: 'app-chat',
  imports: [NgFor, GregorianToJalaliPipe, FormsModule, NgIf, ProgressBar, InputStringComponent, Button, ScrollPanel],
  providers: [TicketClient, TicketMessageClient],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnDestroy {
  @Input() TicketGUID: string;
  @Input() TicketFindByIdDTO: TicketFindByIdDTO = new TicketFindByIdDTO();
  Messages: any[] = [];
  @ViewChild('scrollPanel') scrollPanel!: ScrollPanel;
  @Output() close = new EventEmitter();
  IsModal: boolean = true;
  constructor(
    private ConfirmationService: ConfirmationService,
    private location: Location,
    private http: HttpClient,
    private TicketClient: TicketClient,
    private TicketMessageClient: TicketMessageClient,
    private ActivatedRoute: ActivatedRoute) {

    this.ActivatedRoute.paramMap.subscribe(params => {
      let TicketGUID = params.get('TicketGUID') || '';
      if (TicketGUID != '' && TicketGUID != null) {
        this.IsModal = false;
        this.TicketGUID = TicketGUID;
        this.LoadMessages();
        this.LoadTicket();
      }

      //this.StartInterval();
    });
  }


  CloseTicket() {
    StaticFunctions.confirm(this.ConfirmationService, () => {
      let sendData = new TicketCloseCommand();
      sendData.guid=this.TicketGUID;
      this.TicketClient.ticketCloseCommand(sendData).subscribe(Data => {
        this.Onclose();
      })
    }, () => { })

  }

  Onclose() {
    this.close.emit()
    if (this.IsModal == true) {

    } else {
      this.location.back();

    }
  }

  ngOnInit(): void {
    this.LoadMessages();
  }
  private intervalId: any;
  StartInterval(): void {
    if (this.intervalId == null) {
      this.intervalId = setInterval(() => {
        this.LoadMessages();
      }, 10000);
    }

  }
  StopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  LoadTicket() {
    this.TicketClient.getTicketById(this.TicketGUID).subscribe(Data => {
      this.TicketFindByIdDTO = Data;

    })
  }
  private scrollToBottom(): void {
    const el = this.scrollPanel?.contentViewChild?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  LoadMessages() {
    this.TicketMessageClient.ticketMessageFindAll(this.TicketGUID).subscribe(Data => {
      this.Messages = Data;
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    })
  }


  uploading = false;
  progress = 0;
  onFileSelected(FileData: any): void {

    const file: File = FileData.target.files[0];

    if (file) {

    }



    this.uploading = true;
    this.progress = 0;
    let url = environment.apiUrl + "/Gdoc/GFile/UploadFile";

    let formData = new FormData();


    formData.append('data', file!, file!.name);

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
                FileData.target.value = null;
                let sendData = new CreateTicketMessageCommand()
                sendData.message = event.body;
                sendData.isFile = true;
                sendData.ticketGUID = this.TicketGUID;
                this.TicketMessageClient.createTicketMessage(sendData).subscribe(Data => {

                  this.LoadMessages();
                })
                this.uploading = false;
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



  downloadFile(Message: any): void {

    Message.downloading = true;
    Message.downloadProgress = 0;

    let url = environment.apiUrl + "/Gdoc/GFile/DownloadFile";

    const data = {
      "Link": Message.message
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
              Message.downloading = false;
              Message.downloadProgress = 0;

              if (event['status'] == 200) {

                const url = window.URL.createObjectURL(event.body);
                window.open(url);

              } else if (event['status'] == 400) {

              }

              break;
            }

          case HttpEventType.DownloadProgress: {
            if (event['loaded']) {

              Message.downloadProgress = Math.round((event['loaded'] * 100) / event['total']!);
            }


            break;
          }
        }


      },
      error: (error: ErrorEvent) => {
        Message.downloading = false

      }
    });



  }

  CreateTicketMessageCommand: CreateTicketMessageCommand = new CreateTicketMessageCommand();
  SendMessage() {
    if (this.CreateTicketMessageCommand.message == null || this.CreateTicketMessageCommand.message == '') {
      return;
    }
    this.CreateTicketMessageCommand.ticketGUID = this.TicketGUID;
    this.CreateTicketMessageCommand.isFile = false;
    this.TicketMessageClient.createTicketMessage(this.CreateTicketMessageCommand).subscribe(Data => {
      this.CreateTicketMessageCommand.message = '';
      this.LoadMessages();
    })
  }

  ngOnDestroy(): void {
    this.StopInterval();
  }
}
