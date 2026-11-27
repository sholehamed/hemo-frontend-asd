
import { ConfirmationService, MessageService } from 'primeng/api';
import { Guid } from 'guid-typescript';
export class StaticFunctions {
    static GetModalWidthSize(): string {
        let IsMobile = window.innerWidth < 1024;
        if (IsMobile) {
            return "95%";
        } else {
            return "90%";
        }
    }


    static GetPersianDateTime(_Date: Date): string {

        if (_Date == null) {
            return "";
        }
        let PersianDate = this.GetPersianDate(_Date);
        let PersianTime = this.GetPersianTime(_Date)
        PersianDate = PersianDate + " " + PersianTime
        return PersianDate;
    }
    static GetUUID(): string {
        let UUID = Guid.create().toString().replaceAll('-', '');
        return UUID;
    }
    static GetPersianDate(_Date: Date): string {
        let PersianDate = (new Date(_Date)).toLocaleDateString('fa-IR');
        return PersianDate;
    }
    static GetPersianTime(_Date: Date): string {
        let PersianTime = (new Date(_Date)).toLocaleTimeString('fa-IR')
        if (PersianTime == '۰:۰۰:۰۰') {
            PersianTime = ""
        }

        return PersianTime;
    }

    static GetModalHeightSize(): string {
        return "80%";
    }

    public static GetFormUrl() {
        return sessionStorage.getItem('url');
    }

    public static GetDayOfWeekName(DayOfWeek: number) {
        try {


            let persianDays =
                ["یک‌شنبه",
                    "دوشنبه",
                    "سه‌شنبه",
                    "چهارشنبه",
                    "پنج‌شنبه",
                    "جمعه",
                    "شنبه"]

            return persianDays[DayOfWeek];
        }
        catch {
            return "";
        }
    }

    static ShowError(MessageService: MessageService, Message: string, key: string = "tr") {

        MessageService.add({ severity: 'error', summary: 'توجه', detail: Message, key: key });
    }
    static ShowSuccess(MessageService: MessageService, Message: string = "عملیات با موفقیت انجام شد.", key = "tr") {
        MessageService.add({ severity: 'success', summary: 'عملیات موفق', detail: Message, key: key });
    }
    static confirm(confirmationService: ConfirmationService, OnAccept: Function, OnReject: Function, Message: string = 'آیا از ادامه عملیات اطمینان دارید؟', header: string = 'توجه', icon: string = "pi-exclamation-triangle") {

        confirmationService.confirm({
            message: Message,
            header: header,
            icon: 'pi ' + icon,
            accept: () => {
                OnAccept()
            },
            reject: (type: any) => {
                OnReject()
            }
        });
    }
    static GetExtension(filename: any): string {
        return filename.substring(filename.lastIndexOf('.') + 1, filename.length);
    }
    static GetLink(Data: any, type: any) {
        var sampleArr = this.base64ToArrayBuffer(Data);
        var blob = new Blob([sampleArr], { type: type });
        let link = window.URL.createObjectURL(blob);
        return link;
    };

    static base64ToArrayBuffer(base64: any) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }





}
