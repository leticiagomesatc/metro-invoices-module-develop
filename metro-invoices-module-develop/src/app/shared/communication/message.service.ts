import { Injectable, OnInit } from '@angular/core';
import { ToastrService, ActiveToast } from 'ngx-toastr';
import { messages } from '../../invoice/messages/messages.pt_br';
import { Severity, SevertyDesc } from './severity.enum';
import { StringUtil } from '../util/string.util';
import { CommandUtil } from '../util/commands.util';
import * as _ from 'lodash';
import { take, switchMap, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BlobUtil } from '../util/blob.util';

@Injectable()
export class MessageService {


    messagesReserved = [];
    stock = false;

    constructor(private toastr: ToastrService) { }


    public stockMessages() {
        this.clearMessages();
        this.stock = true;
    }

    public copyReserved() {
        CommandUtil.copyTextToClipboard(
            _(this.messagesReserved)
                .map(m => SevertyDesc.of(m.severity) + ' : ' + m.msg)
                .join('\n'));
    }



    private reserveMessage(severity: Severity, msg: string) {
        this.messagesReserved.push({ severity: severity, msg: msg });
    }




    private clearMessages() {
        this.stock = false;
        this.messagesReserved = [];
    }

    public showMessage(severity: Severity, code: string, ...parms) {
        let message = messages[code];
        if (!message) {
            message = `?${code}?`;
        }

        this.showInlineMessage(severity, message, ...parms);
    }

    public showInlineMessage(severity: Severity, message: any, ...parms) {
        if (!!parms) {
            message = StringUtil.format(message, ...parms);
        }
        if (this.stock) {
            this.reserveMessage(severity, message);
        }
        let activeToast: ActiveToast<any>;

        switch (severity) {
            case Severity.INFO:
                activeToast = this.toastr.success(message);

                break;
            case Severity.WARN:
                activeToast = this.toastr.warning(message);

                break;
            case Severity.ERROR:
                activeToast = this.toastr.error(message.replaceAll(",\"", ";\""));

                break;
            default: throw new Error("Serverity not found " + severity);
        }

        activeToast.onTap
            .pipe(take(1))
            .subscribe(() => {
                if (this.stock) {
                    this.copyReserved();
                } else {
                    CommandUtil.copyTextToClipboard(SevertyDesc.of(severity) + ': ' + activeToast.message);
                }
            });
    }


    public success(code: string, ...parms) {
        this.showMessage(Severity.INFO, code, ...parms);
    }

    public warning(code: string, ...parms) {
        this.showMessage(Severity.WARN, code, ...parms);
    }

    public error(code: string, ...parms) {
        this.showMessage(Severity.ERROR, code, ...parms);
    }

    dealWithError(error: any) {
        if (error instanceof HttpErrorResponse) {
            const httpError = error as HttpErrorResponse;
            if (!!httpError.error ) {
                if (!!httpError.error.code || !!httpError.error.message) {
                    this.dealDefaultError(error.error);
                } else if (httpError.error instanceof Blob) {
                    if(httpError.status === 404){
                        this.error('INV-E030', error.message);
                    } else {
                        BlobUtil.read(httpError.error).pipe(
                            map(msg =>  JSON.parse(msg))
                        ).forEach( err =>
                            this.dealDefaultError(err)
                        )
                    }
                } else if(typeof httpError.error == "string") {
                    this.dealDefaultError(JSON.parse(httpError.error));
                }
            } else if (httpError.status === 0) {
                this.warning('AT-W001');
            } else if (!!error.message) {
                this.error('AT-E010', error.message);
            } else {
                this.error('AT-E001');
            }
        } else if ((!!error.code || !!error.message)) {
            this.dealDefaultError(error);
        } else if (!!error.message) {
            this.error('AT-E010', error.message);
        } else {
            this.error('AT-E001');
        }
    }

    private dealDefaultError(e : any) {
        if (e.code === '_ROOT_') {
            e.detailMessages.forEach(sub => {
                this.dealDefaultError(sub);
            });

        } else if (!!e.code) {
            this.error(e.code, ...e.params);
        } else if (e.message) {
            this.showInlineMessage(Severity.ERROR, e.message, ...e.params);
        }
    }



}
