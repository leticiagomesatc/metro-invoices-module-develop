import { Component, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { DatePipe, DecimalPipe, formatNumber } from '@angular/common';
import {formatDate, formatCurrency} from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DebitNoteCreateIssueComponent } from './emit-dialog/debit-note-new-issue.component';
import { DebitNoteService } from 'src/app/invoice/services/debit-note.service';
import * as _ from 'lodash';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MessageService } from 'src/app/shared/communication/message.service';
import { BilletEmailComponent } from 'src/app/shared/components/billet-email-dialog/billet-email.component';
import { ContactService } from 'src/app/invoice/services/contact.service';
import { ZipDialogComponent } from 'src/app/shared/components/zip-dialog/zip-dialog.component';
import { BilletDuplicateComponent } from 'src/app/shared/components/billet-duplicate-dialog/billet-duplicate.component';
import { ConfirmCancelComponent } from 'src/app/shared/components/confirm-cancel-dialog/confirm-cancel.component';
import { JustificationCancellationNoteService } from 'src/app/invoice/services/justification-cancellation-note.service';
import { DecreaseBilletService } from 'src/app/invoice/services/decrease-billet.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

const DATE_FORMAT = 'dd/MM/yyyy';
const LOCALE = 'pt-BR';

@Component({
  selector: 'app-debit-note-issues-list',
  templateUrl: './debit-note-issues-list.component.html',
  styleUrls: ['./debit-note-issues-list.component.scss'],
})
export class DebitNoteIssuesList {

  userRoles = userRoles;

  cols = [
     { title: 'Número', prop: 'serialNumber.serialNumber', converter : invoiceNoteNumberConv },
    { title: 'Código do Cliente', prop: 'template.customer.sapCode' },
    { title: 'Grupo de Faturamento', prop: 'template.customer.name' },
    { title: 'Tipo da Nota', prop: 'template.type', converter: debitNoteTypeConv },
    { title: 'Valor Mensal', prop: 'template.monthlyAmout', converter: currencyConv },
    { title: 'Data de Emissão', prop: 'issueDate', converter: issueDateConv },
    { title: 'Data de Vencimento', prop: 'dueDate', converter: issueDateConv },
    { title: 'Competência', prop: 'period', converter: competenciaConvString }
    
  ];


  actions = [
    {
      // title : 'Ações',
      action: 'actions',
      subActions: [
        {
          title: 'Download Nota de Débito',
          action: 'download',
          role: userRoles.dbIssueDownload,
          icon: { name: 'cloud_download' }
        },
        {
          title: 'Download Boleto',
          action: 'generate_single_billet',
          condition : singleBilletConditionAndWithBillet,
          role: userRoles.dbIssueDownload,
          icon: { name: 'attach_money' }
        },
        {
          title: 'Download Boleto',
          action: 'generate_group_billet',
          condition : groupBilletCondition,
          role: userRoles.dbIssueDownload,
          icon: { name: 'attach_money' }
        },
        {
          title: 'Cancelar',
          action: 'cancel-debit-note',
          condition : cancelCondition,
          role: userRoles.dbIssueCancel,
          icon: { name: 'cancel' }
        }
        ,
        {
          title:'Enviar Nota de Débito/Boleto em E-mail',
          action: 'send_note_billet_email',
          condition : notPayedAndSingleBilletCondition,
          role: userRoles.dbIssueSend,
          icon:{name:'send'}
        }
        ,
        {
          title:'Enviar boleto por E-mail',
          action: 'send_billet_email',
          condition : notPayedBilletConditionAndWithBillet,
          role: userRoles.dbIssueSend,
          icon:{name:'send'}
        }
        ,{
          title:'Gerar segunda via do boleto',
          action: 'generate_duplicate_billet',
          condition : notPayedAndSingleBilletConditionWithBillet,
          role: userRoles.dbIssueDuplicateBillet,
          icon:{name:'insert_drive_file'}
        },
        {
          title: 'Download Arquivos Cancelamento',
          action: 'generate_cancel_files',
          condition : cancelledCondition,
          role: userRoles.dbIssueDownload,
          icon: { name: 'cloud_download' }
        },
      ]
    }
  ];


  @ViewChild('search') search : any;

  dialogRef: MatDialogRef<any>;

  selectionType : string = null;
  justifications: Observable<any>;
  requiredRolesToView: string = userRoles.dbIssueView;
  requiredRolesToEmit: string = userRoles.dbIssueEmit;

  startSelectingMail() {
    this.selectionType = 'EMAIL';
    this.search.startSelecting();
    this.cd.detectChanges();
  }

  isDevMode() {
    return false;
  }

  constructor(
    public dialog: MatDialog,
    private debitNoteService :DebitNoteService,
    private contactService: ContactService,
    private messageService : MessageService,
    private justificationService : JustificationCancellationNoteService,
    private decreaseBilletService : DecreaseBilletService,
    private cd : ChangeDetectorRef,
    public authService: AuthService,) { }

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, (comp) => true, undefined);
  }

  newIssue(): void {
    if (!!this.dialogRef) {
      return;
    }
    this.search.hideSpinnerMenu = false;
    this.dialogRef = this.dialog.open(DebitNoteCreateIssueComponent,{width:'800px', height:'600px'});

    this.dialogRef.afterClosed().subscribe(result => {
        if (!!result && result.status == 'ok') {
          this.search.search();
        }
        this.dialogRef = null;
        this.search.hideSpinnerMenu = true;
    });
  }

  execute(event : any) {
    if (event.action.action == 'download') {
      this.debitNoteService.downloadNote(event.line.id)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.template.customer.sapCode != null ? event.line.template.customer.sapCode : event.line.template.customer.name}-ND_${event.line.serialNumber.serialNumber}.pdf`,
              content,
              'application/pdf'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } else if (event.action.action == 'generate_single_billet') {
      this.debitNoteService.generateBillet(event.line.id)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.template.customer.sapCode != null ? event.line.template.customer.sapCode : event.line.template.customer.name}-Boleto_ND_${event.line.serialNumber.serialNumber}.pdf`,
              content,
              'application/pdf'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } else if (event.action.action == 'generate_group_billet') {
      this.debitNoteService.generateBillet(event.line.id)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.template.customer.sapCode != null ? event.line.template.customer.sapCode : event.line.template.customer.name}-Boleto_ND_${event.line.serialNumber.serialNumber}.zip`,
              content,
              'application/zip'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    }else if (event.action.action == 'send_note_billet_email') {
      this.showBilletNoteEmailModal(event.line.id, false, 'Enviar Nota de Débito')
    }else if (event.action.action == 'send_billet_email') {
      this.showBilletNoteEmailModal(event.line.id, true, 'Enviar Boleto')
    }else if (event.action.action == 'generate_duplicate_billet') {
      this.showBilletDuplicateModal(event.line.id)
    }else if (event.action.action == 'cancel-debit-note') {
      this.validateAndCancelInvoiceNote(event.line)
    }else if (event.action.action == 'generate_cancel_files'){
      this.debitNoteService.downloadCancelledNotes(event.line.id)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-Arquivos_Cancelamento_ND_${event.line.serialNumber.serialNumber}.zip`,
              content,
              'application/zip'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    }
  }

  showBilletNoteEmailModal(invoiceId: number, onlyBillet: boolean, title: string) {
    if (!!this.dialogRef) {
      return;
    }
    let invoiceComponent = this;
    this.contactService.getContactsEmail('debit-note', invoiceId)
        .subscribe(
          content=> {
            invoiceComponent.dialogRef = invoiceComponent.dialog.open(BilletEmailComponent,{ data: { id: invoiceId, title: title ? title : 'Enviar Nota de Débito', emailList: content.map(item => { return { email: item }}) }, width:'450px' });

            invoiceComponent.dialogRef.afterClosed().subscribe(result => {
              invoiceComponent.dialogRef = null;
              if(!!result){
                if(onlyBillet){
                  invoiceComponent.sendBilletForEmailList(result);
                }else{
                  invoiceComponent.sendBilletNoteForEmailList(result)
                }
            }
            })
          },
          (e)=> invoiceComponent.messageService.dealWithError(e)
        );

  }

  validateAndSendBilletNoteEmail(item : any) {
    if(!this.search.selectionList.length){
      this.messageService.error('INV-E023');
    }else{
      if(item) {
        this.sendBilletNoteEmail([item.id]);
      } else {
        if(this.search.selectionList && !this.search.selectionList.length) {
          this.messageService.error('INV-E020');
        }  else if(!this.search.selectionList.filter(item=>createNoteSelectionElement(item).sendBilletNoteCondition).length) {
          this.messageService.error('INV-E040');
        } else{
          let ids = this.search.selectionList
            .filter(item=>createNoteSelectionElement(item).notPayedBilletCondition)
            .map(item=>item.id);
          this.sendBilletNoteEmail(ids);
        }
      }
    }
  }

  validateAndSendBilletEmail(item : any) {
    if(!this.search.selectionList.length){
      this.messageService.error('INV-E023');
    }else{
      if(item) {
        this.sendBilletEmail([item.id]);
      } else {
        if(this.search.selectionList && !this.search.selectionList.length) {
          this.messageService.error('INV-E020');
        } else {
          let ids = this.search.selectionList
            .filter(item=>createNoteSelectionElement(item).notPayedBilletCondition)
            .map(item=>item.id);
          this.sendBilletEmail(ids);
        }
      }
    }
  }


  validateAndCancelInvoiceNote(item : any){
    this.justificationService.getAllJustifications().subscribe(content=> {
      this.justifications = content;
      let confirmCancel = false;
      this.showConfirmCancel('Deseja realmente cancelar a ND '+item.serialNumber.serialNumber+' da competência '+competenciaConvString(item.period) +'?',
        item.id, result=> {
        confirmCancel = (!!result && result.status == 'ok')
        if(confirmCancel) this.debitNoteService.cancelDebitNote(item.id, result.justificationId, result.files).subscribe(
          ()=>{
            this.search.search(false);
            setTimeout(() => {
              this.messageService.success('INV-S034', 'Nota de Débito');
            }, 1000);
                        
          },
          (e)=>this.messageService.dealWithError(e)
        );
      });
    });
  }

  showConfirmCancel(msg: string, noteNumber: number, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.debitNoteService.validateNoteOutOfCompetence(noteNumber).subscribe(result =>{
      this.dialogRef = this.dialog.open(ConfirmCancelComponent,{ data: { msg: msg, outOfPeriod: result, justifications: this.justifications}, width:'650px' });

      this.dialogRef.afterClosed().subscribe(result => {
        this.dialogRef = null;
        action(result);
      });
    });
  }

sendBilletNoteEmail(ids: number[]) {
  this.debitNoteService.sendBilletNoteEmail(ids)
    .subscribe(
      ()=>{
        this.messageService.success('INV-S016', 'notas de débito/boletos');
      },
      (e)=>this.messageService.dealWithError(e)
    );
}

sendBilletEmail(ids: number[]) {
  this.debitNoteService.sendBilletEmail(ids)
    .subscribe(
      ()=>{
        this.messageService.success('INV-S016', 'boletos');
      },
      (e)=>this.messageService.dealWithError(e)
    );
}

sendBilletNoteForEmailList(result: any) {
  this.debitNoteService.sendBilletNoteWithEmail(result)
    .subscribe(
      ()=>{
        this.messageService.success('INV-S016', 'notas de débito/boletos');
      },
      (e)=>this.messageService.dealWithError(e)
    );
}

sendBilletForEmailList(result: any) {
  this.debitNoteService.sendBilletWithEmail(result)
    .subscribe(
      ()=>{
        this.messageService.success('INV-S016', 'boletos');
      },
      (e)=>this.messageService.dealWithError(e)
    );
}
openZip() {
  if(!this.search.selectionList.length){
    this.messageService.error('INV-E023');
  }else{
    if (this.search.selectionList && !this.search.selectionList.length) {
      this.messageService.error('INV-E020');
    } else {

    let ids = this.search.selectionList.map(item=>item.id)
    this.dialogRef = this.dialog.open(ZipDialogComponent, {
      width:'300px',
      data: {
        funcaoSucesso: (billet:boolean, note:boolean)=>{
        this.debitNoteService.downloadZipDebitNotes(ids, billet, note).subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-NOTA-Debito-${formatDate(new Date(), 'ddMMyyyy-HH:mm', 'pt')}.zip`,
              content,
              'application/zip'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
      }}
    });
    this.dialogRef.afterClosed();
  }
}
}
showBilletDuplicateModal(noteNumberId: number) {
  if (!!this.dialogRef) {
    return;
  }
  let _this = this;
  this.debitNoteService.getCustomerByDebitNote(noteNumberId)
      .subscribe(
        content=> {
          _this.dialogRef = _this.dialog.open(BilletDuplicateComponent, this.createDataForBilletDuplicateModal(content, noteNumberId));
          _this.dialogRef.afterClosed().subscribe(result => {
            _this.dialogRef = null;
            if(!!result) _this.generateDuplicateBillet(result, noteNumberId)
          })
        },
        (e)=> _this.messageService.dealWithError(e)
      );
}

  generateDuplicateBillet(result: any, noteNumberId : number) {
    const appliedBalances = result.appliedBalances
    delete result.appliedBalances
    this.debitNoteService.generateDuplicateBillet(result, noteNumberId)
      .subscribe(
        ()=>{
          if(appliedBalances.length > 0) {
            appliedBalances.forEach(balance => balance.idDebitNoteBalanceApplication = noteNumberId);
            this.decreaseBilletService.bulkSave(appliedBalances)
            .subscribe(
              () => this.messageService.success('INV-S027'),
              (e) => this.messageService.dealWithError(e)
            )
          } else this.messageService.success('INV-S027')
        },
        (e)=>this.messageService.dealWithError(e)
    );
  }

  createDataForBilletDuplicateModal(content: any, noteNumber: any) {
    return { 
      data: { 
        interestRateIndicator: content.interestRateIndicator, 
        interestRateType: content.interestRateType, 
        interestRatePct: content.interestRatePct,
        fineRateIndicator: content.fineRateIndicator, 
        fineRateType: content.fineRateType, 
        fineRatePct: content.fineRatePct,
        customerNationalCompanyNumber: content.cnpj,
        source: 'DN',
        noteNumber: noteNumber
      }, 
      width:'550px' }
  }
}



function debitNoteTypeConv(params: string) {
  switch (params) {
    case 'ACCOUNTS_MEETING': return 'Encontro de contas';
    case 'PAYMENT': return 'Pagamento';
    case 'PREPAYMENT': return 'Pagamento Antecipado';
    case 'FINE': return 'Multa';
    default: return 'Indefinida';
  }
}

function competenciaConv(params:any) {
  if (!params) {
    return null;
  }
  return formatDate(params, 'MM/yyyy','pt-BR');

}

function competenciaConvString(params:any) {
  if (!params) {
    return null;
  }
  var dat = new String(params);
  var res = dat.substring(5, 7);
  res = res + "/";
  res = res + dat.substring(0, 4);
  return res;
}

function inactiveConv(params: boolean) {
  if (params === true) {
    return 'Inativa';
  } else if (params === false) {
    return 'Ativa';
  } else {
    return '?'
  }

}

function issueDateConv(params: string, ctx: any) {

  return formatDate(params, DATE_FORMAT, LOCALE);

}

function currencyConv(value: any) {
  return formatCurrency(value, LOCALE, 'R$');
}

function invoiceNoteNumberConv(value : any) {
  if (!value) {
    return null;
  }
  return formatNumber(value, 'pt-BR', '9.0-0');
}

function cancelCondition(line : any) {
  return !!line && notPayedBilletCondition(line) && line.status == 'ISSUED' || line.status == 'ACCOUNTED';
}

function createNoteSelectionElement(element:any) {
  return {
    id: element.id,
    notPayedBilletCondition: notPayedBilletCondition(element),
    sendBilletNoteCondition: sendBilletNoteCondition(element)
  }
}

function notPayedBilletCondition(line : any) {
  return !line.existsPayedBillet && line.status != 'CANCELLED';
}

function notPayedBilletConditionAndWithBillet(line : any) {
  return !line.existsPayedBillet && line.status != 'CANCELLED' && noteWithBillet(line);
}

function cancelledCondition(line : any) {
  const noteCompetence = competenciaConvString(line.period);
  const cancelCompetence = competenciaConvString(line.cancelDate);
  return !!line && line.status == 'CANCELLED' && noteCompetence !== cancelCompetence;
}

function singleBilletCondition(line : any) {
  return line.quantityBillets < 2 && line.status != 'CANCELLED';
}

function groupBilletCondition(line : any) {
  return line.quantityBillets > 1 && line.status != 'CANCELLED';
}

function sendBilletNoteCondition(line : any) {
  return !line.noteExistsPayedBillet && line.phaseStatus != 'CANCELLED' && line.quantityBillets == 1;
}

function notPayedAndSingleBilletCondition(element:any){
  return notPayedBilletCondition(element) && singleBilletCondition(element);
}

function notPayedAndSingleBilletConditionWithBillet(element:any){
  return notPayedBilletCondition(element) && singleBilletCondition(element) && noteWithBillet(element);
}

function singleBilletConditionAndWithBillet(line: any){
  return singleBilletCondition(line) && noteWithBillet(line);
}

function noteWithBillet(line: any){
  return line.template.type != 'ACCOUNTS_MEETING' && line.template.type != 'PREPAYMENT';
}