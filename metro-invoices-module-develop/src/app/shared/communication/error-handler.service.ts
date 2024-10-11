import { Injectable, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { messages } from '../../invoice/messages/messages.pt_br';
import { Severity } from './severity.enum';
import { StringUtil } from '../util/string.util';
import { MessageService } from './message.service';

@Injectable()
export class ErrorHandlerService {



    constructor(private messageService: MessageService) {

    }

    public canHandle(error: any) : string {
        if (error.code !== undefined && error.severity !== undefined) {
            return 'communication';
        }

        return null;
    }
    public handle(communication: any, type ?: string) {
        if (communication.code == '_ROOT_') {
            communication.detailMessages.forEach(element => this.handleMessage(element));
        } else {
            this.handleMessage(communication);
        }
    }

    private handleMessage(element: any) {
        const sev: Severity = Severity[<string>element.severity];
        this.messageService.showMessage(sev, element.code, element.params);
    }




}