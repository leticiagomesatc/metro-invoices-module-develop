import { Component, ViewChild, ElementRef, OnInit, Renderer2, EventEmitter } from '@angular/core';

import { environment } from 'src/environments/environment';
import { MessageService } from 'src/app/shared/communication/message.service';
import { InputFile, InputFileComponent } from 'ngx-input-file';
import { FileService } from '../../services/file.service';
import { InvoiceService } from '../../services/invoice.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MatSelect, MatOption } from '@angular/material';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

@Component({
  selector: 'app-accounting-files',
  templateUrl: './accounting-files.component.html',
  styleUrls: ['./accounting-files.component.scss']
})
export class AccountingFiles implements OnInit {

  requiredRolesToView: string = userRoles.inAccountingFilesView;
  
  periodBegin: Date;
  periodEnd: Date;
  accountingTypes: String[] = [];
  alreadyAccounted: Boolean;
  allSelected: Boolean;

  @ViewChild('selection') selection: MatSelect;

  hideSpinner: boolean = true;

  accountingTypeList: any[] = [
    { key:'ISSUED_INVOICE_NOTE', value:'Notas fiscais emitidas'},
    { key:'ISSUED_DEBIT_NOTE', value:'Notas de débito emitidas'},
    { key:'CANCELLED_INVOICE_NOTE', value:'Notas fiscais canceladas'},
    { key:'CANCELLED_DEBIT_NOTE', value:'Notas de débito canceladas'},
    { key:'COLLECTED_INVOICE_NOTE', value:'Arrecadação notas fiscais'},
    { key:'COLLECTED_DEBIT_NOTE', value:'Arrecadação notas de débito'},
  ]

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private messageService: MessageService) {
  }

  ngOnInit(){
    this.authService.checkAuthorization(this.requiredRolesToView, (comp)=>true, undefined);
  }

  generateAccountingFile() {
    this.hideSpinner = false;

    if (this.accountingTypes.length) {
      this.fileService.generateAccountingFile(this.createObject()).subscribe(
        response => {
          this.hideSpinner = true;
          BlobUtil.startDownloadCsv(
            response.headers.get('filename'),
            response.body,
            'text/csv; charset=utf-8'
          );
        },
        (e)=> this.dealWithError(e)
      );
    } else {
      this.hideSpinner = true;
      this.messageService.error('INV-E046');
    }
  }

  createObject() : any {
    return {
      periodBegin: this.periodBegin, 
      periodEnd: this.periodEnd, 
      accountingTypes: this.accountingTypes.filter(type => this.getAccountingTypeFromKey(type)), 
      alreadyAccounted: this.alreadyAccounted
    }
  }

  dealWithError(e: any) {
    this.hideSpinner = true;
    this.messageService.dealWithError(e)
  }

  selectAllAccountingTypes() : any {
    this.allSelected = !this.allSelected;  // to control select-unselect
      
      if (this.allSelected) {
        this.selection.options.forEach( (item : MatOption) => item.select());
      } else {
        this.selection.options.forEach( (item : MatOption) => {item.deselect()});
      }
  }

  concatAccountingTypes(accountingTypes: String[]):String {
    return accountingTypes.map(item => this.getAccountingTypeFromKey(item)).join(',')
  }

  getAccountingTypeFromKey(key:String):String{
    if (!key) {
      return undefined;
    }
    return this.accountingTypeList.find(item=>item.key === key).value;
  }

  adjustSelectAll() : any {
    if (this.createObject().accountingTypes.length === 6) {
      this.selection.options.find(type => type.value === 0).select();
      this.allSelected = true;
    } else {
      this.selection.options.find(type => type.value === 0).deselect();
      this.allSelected = false;
    }
  }

}
