import { Component, ChangeDetectorRef, ElementRef, ViewChild, Output, Input } from '@angular/core';
import { InvoiceService } from '../../services/invoice.service';
import { FormControl } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { startWith, map, flatMap, filter, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CustomerService } from '../../services/customer.service';
import { Pageable } from 'src/app/shared/util/pageable';
import {ValidatorsUtil} from 'src/app/shared/util/validators.util';
import { formatDate, formatNumber, formatCurrency } from '@angular/common';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MessageService } from 'src/app/shared/communication/message.service';
import * as _ from 'lodash';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { ConfirmCancelComponent } from 'src/app/shared/components/confirm-cancel-dialog/confirm-cancel.component';
import { BilletEmailComponent } from 'src/app/shared/components/billet-email-dialog/billet-email.component';
import { ContactService } from '../../services/contact.service';
import { JustificationCancellationNoteService } from '../../services/justification-cancellation-note.service';
import { ZipDialogComponent } from 'src/app/shared/components/zip-dialog/zip-dialog.component';
import { BilletDuplicateComponent } from 'src/app/shared/components/billet-duplicate-dialog/billet-duplicate.component';
import { InputFile } from 'ngx-input-file';
import { DecreaseBilletService } from '../../services/decrease-billet.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';


const LOCALE = 'pt-BR';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
})
export class InvoiceList   {

  userRoles = userRoles;

  cols = [
    {title:'Código do Cliente', prop: 'customer.sapCode' },
    {title:'Grupo de Faturamento', prop: 'customer.name'},
    {title:'Competência',prop:'period', converter : competenciaConv},
    {title:'Fase',prop:'phase' , converter : phaseConv},
    {title:'Situação',prop:'phaseStatus', converter : phaseStatusConv},
    {title:'Num. da N.F.',prop:'noteNumber', converter : invoiceNoteNumberConv},
    {title:'Emissão da N.F.',prop:'noteIssueDate', converter : formatSimpleDate},
    {title:'Valor Bruto',prop:'grossTotalValue', converter : currencyConv},
    {title:'', prop:'buildErrorHint', hintCondition: hintCondition, enableHint: true},
  ];

  actions = [
    {
      // title : 'Ações',
      action : 'actions',
      subActions : [
        {
          title:'Emitir Nota Fiscal',
          condition : invoiceCalcCondition,
          action: 'generate_invoice_note',
          role: userRoles.inInvoiceEmit,
          icon:{name:'done_outline'}
        },
        {
          title:'Download Nota Fiscal',
          condition : downloadNoteCondition,
          action: 'download_invoice_note',
          role: userRoles.inInvoiceDownload,
          icon:{name:'cloud_download'}
        },
        {
          title:'Download Boleto',
          condition : singleBilletCondition,
          action: 'generate_single_billet',
          role: userRoles.inInvoiceDownload,
          icon:{name:'attach_money'}
        },
        {
          title:'Download Boleto',
          condition : groupBilletCondition,
          action: 'generate_group_billet',
          role: userRoles.inInvoiceDownload,
          icon:{name:'attach_money'}
        }
        ,
        {
          title:'Enviar Nota Fiscal/Boleto em E-mail',
          condition : notPayedAndSingleBilletCondition,
          action: 'send_billet_note_email',
          role: userRoles.inInvoiceSend,
          icon:{name:'send'}
        },
        {
          title:'Enviar Boleto em E-mail',
          condition : notPayedBilletCondition,
          action: 'send_billet_email',
          role: userRoles.inInvoiceSend,
          icon:{name:'send'}
        },
        {
          title:'Gerar segunda via do boleto',
          condition : notPayedAndSingleBilletCondition,
          action: 'generate_duplicate_billet',
          role: userRoles.inDuplicateBilletEmit,
          icon:{name:'insert_drive_file'}
        },
        {
          title: 'Cancelar',
          action: 'cancel_invoice_note',
          condition : cancelCondition,
          role: userRoles.inInvoiceCancel,
          icon: { name: 'cancel' }
        },
        {
          title: 'Download Arquivos Cancelamento',
          action: 'generate_cancel_files',
          condition : cancelledCondition,
          command: {
            name : 'searchAndDelete'
          },
          role: userRoles.inInvoiceDownload,
          icon: { name: 'cloud_download' }
        },
      ]
    }
  ];

  prepareFilters : Function = prepareFilters;

  @ViewChild('search') search : any;

  customerControl = new FormControl();
  cmpControl;
  options: any[] = [];
  filteredCustomers: Observable<any[]>;
  justifications: Observable<any>;
  requiredRolesToView: string = userRoles.inInvoiceView;
  requiredRolesToEmit: string = userRoles.inInvoiceEmit;

  selectionType : string = null;
  dialogRef: MatDialogRef<any>;
  inputFileModel: InputFile[];
  constructor(
    private dialog: MatDialog,
    private messageService : MessageService,
    private customerService: CustomerService,
    private invoiceService : InvoiceService,
    private contactService : ContactService,
    private justificationService : JustificationCancellationNoteService,
    private decreaseBilletService: DecreaseBilletService,
    public authService: AuthService,
    private cd : ChangeDetectorRef) {}

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    _this.filteredCustomers = _this.customerControl.valueChanges
      .pipe(startWith(''), debounceTime(250), filter((value:any) => !!value && value.length > 2), distinctUntilChanged(), switchMap(value => value ?
        from(_this.customerService.search({ name: value }, new Pageable(0, 10)))
        : from(Promise.resolve({ content: [] }))), map((a:any) => a.content));
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.search.filters.invoicementPeriod = currentCmp;
    _this.cmpControl = new FormControl(currentCmp, ValidatorsUtil.date);
  }

  startSelectingMail() {
    this.selectionType = 'EMAIL';
    this.search.startSelecting();
    this.cd.detectChanges();
  }

  selectionCondition(item : any) {
    return true;
  }

  isDevMode() {
    return false;
  }

  execute(event : any) {
    if (event.action.action === 'generate_invoice_note') {
      this.search.hideSpinnerMenu = false;
      this.invoiceService.issueNote([event.line.id])
        .subscribe(
          ()=>{
            this.messageService.success('INV-S001');
            this.search.search(false);
          },
          (e)=>{
            this.messageService.dealWithError(e);
            this.search.hideSpinnerMenu = true;
          },
          ()=>this.search.hideSpinnerMenu = true
        );
    } else if (event.action.action == 'download_invoice_note') {
      this.invoiceService.downloadNote(event.line.noteId)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.customer.sapCode != null ? event.line.customer.sapCode : event.line.customer.name}-NF_${event.line.noteNumber}.pdf`,
              content,
              'application/pdf'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } else if (event.action.action == 'generate_single_billet') {
      this.invoiceService.generateBillet(event.line.noteId)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.customer.sapCode != null ? event.line.customer.sapCode : event.line.customer.name}-Boleto_NF_${event.line.noteNumber}.pdf`,
              content,
              'application/pdf'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } else if (event.action.action == 'generate_group_billet') {
      this.invoiceService.generateBillet(event.line.noteId)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-${event.line.customer.sapCode != null ? event.line.customer.sapCode : event.line.customer.name}-Boleto_NF_${event.line.noteNumber}.zip`,
              content,
              'application/zip'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } else if (event.action.action == 'send_billet_note_email') {
      this.showBilletNoteEmailModal(event.line.id, event.line.noteId)
    } else if (event.action.action == 'send_billet_email') {
      this.showBilletEmailModal(event.line.id, event.line.noteId)
    }else if (event.action.action == 'generate_duplicate_billet') {
      this.showBilletDuplicateModal(event.line.id, event.line.noteId)
    }else if (event.action.action == 'cancel_invoice_note'){
      this.validateAndCancelInvoiceNote(event.line)
    }else if (event.action.action == 'generate_cancel_files'){
      this.invoiceService.downloadCancelledNotes(event.line.noteId)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-Arquivos_Cancelamento_NF_${event.line.noteNumber}.zip`,
              content,
              'application/zip'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    }
  }

  chosenYearHandler(normalizedYear: any) {
    let ctrlValue = this.cmpControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.cmpControl.setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: any, datepicker: any) {
    const ctrlValue = this.cmpControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    ctrlValue.setDate(1);
    this.cmpControl.setValue(ctrlValue);
    datepicker.close();
  }

  displayCustomer(customer:any) {
    if (!customer) {
      return null;
    }
    return customer.name;
  }

  issueInvoiceNotes() {
    if(!this.search.selectionList || !this.search.selectionList.length){
      this.messageService.error('INV-E023');
    }else if(this.search.selectionList && !this.search.selectionList.length || !this.search.selectionList.filter(item=>createNoteSelectionElement(item).calcPhaseCondition).length) {
        this.messageService.error('INV-E015');
    } else {
      this.search.hideSpinnerMenu = false;
      this.invoiceService.issueNote(this.search.selectionList.filter(item=>createNoteSelectionElement(item).calcPhaseCondition).map(item=>item.id))
      .subscribe(
        ()=>{
          this.messageService.success('INV-S001');
          this.search.search(true);
        },
        (e)=>{
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
        },
        ()=>this.search.hideSpinnerMenu = true
      );
    }
  }

  validateAndSendBilletNoteEmail(item : any, onlyBillet: boolean) {
    if(item) {
      this.sendBilletNoteEmail([item.noteId], onlyBillet);
    } else {
      if(!this.search.selectionList || !this.search.selectionList.length){
        this.messageService.error('INV-E023');
      } else if(!this.search.selectionList.filter(item=>createNoteSelectionElement(item).sendBilletNoteCondition).length) {
          this.messageService.error(!onlyBillet ? 'INV-E018' : 'INV-E021');
      } else {
        let elements = this.search.selectionList.filter(item=>createNoteSelectionElement(item).notPayedBilletCondition);
        let invoiceIds = elements.map(item=>item.id);
        let serialNumbers = elements.map(item=>item.noteId);

        if(!onlyBillet) {
          this.invoiceService.validateExpiredNotes(invoiceIds).subscribe(content=> {
            let confirmEmail = true;
            if(!content) {
              this.showConfirmMessage('Há boletos vencidos dentre as notas selecionadas. Deseja confirmar o envio?', result=> {
                confirmEmail = (!!result && result.status == 'ok')
              })
            }
            if(confirmEmail) this.sendBilletNoteEmail(serialNumbers, onlyBillet)
          })
        } else { this.sendBilletNoteEmail(serialNumbers, onlyBillet) }
      }
    }
  }

  validateAndCancelInvoiceNote(item : any){

    this.justificationService.getAllJustifications().subscribe(content=> {
      this.justifications = content;

      let confirmCancel = false;
      this.showConfirmCancel('Deseja realmente cancelar a NF '+item.noteNumber+' da competência '+competenciaConv(item.period) +'?',
        item.noteId, result=> {
        confirmCancel = (!!result && result.status == 'ok')
        if(confirmCancel) this.invoiceService.cancelInvoiceNote(item.noteId, result.justificationId, result.files).subscribe(
          ()=>{
            this.messageService.success('INV-S034', 'Nota Fiscal');
            this.search.search(false);
          },
          (e)=>this.messageService.dealWithError(e)
        );
      });
    });
  }

  showConfirmMessage(msg: string, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(ConfirmComponent,{ data: { msg: msg }, width:'350px' });

    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      action(result);
    })
  }

  showBilletNoteEmailModal(invoiceId: number, noteNumber: number) {
    if (!!this.dialogRef) {
      return;
    }
    let invoiceComponent = this;
    this.contactService.getContactsEmail('invoice', invoiceId)
        .subscribe(
          content=> {
            invoiceComponent.dialogRef = invoiceComponent.dialog.open(BilletEmailComponent,{ data: { id: invoiceId, title: 'Enviar Nota Fiscal', emailList: content.map(item => { return { email: item }}) }, width:'450px' });

            invoiceComponent.dialogRef.afterClosed().subscribe(result => {
              invoiceComponent.dialogRef = null;
              if(!!result) invoiceComponent.sendBilletNoteForEmailList(result, false, noteNumber)
            })
          },
          (e)=> invoiceComponent.messageService.dealWithError(e)
        );
  }

  showBilletEmailModal(invoiceId: number, noteNumber: number) {
    if (!!this.dialogRef) {
      return;
    }
    let invoiceComponent = this;
    this.contactService.getContactsEmail('invoice', invoiceId)
      .subscribe(
        content=> {
          invoiceComponent.dialogRef = invoiceComponent.dialog.open(BilletEmailComponent,{ data: { id: invoiceId, title: 'Enviar Boleto', emailList: content.map(item => { return { email: item }}) }, width:'450px' });

          invoiceComponent.dialogRef.afterClosed().subscribe(result => {
            invoiceComponent.dialogRef = null;
            if(!!result) invoiceComponent.sendBilletNoteForEmailList(result, true, noteNumber)
          })
        },
        (e)=> invoiceComponent.messageService.dealWithError(e)
      );
  }

  showConfirmCancel(msg: string, noteNumber:number, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.invoiceService.validateNoteOutOfCompetence(noteNumber).subscribe(result =>{
      this.dialogRef = this.dialog.open(ConfirmCancelComponent,{ data: { msg: msg, outOfPeriod: result, justifications: this.justifications}, width:'650px' });
      this.dialogRef.afterClosed().subscribe(result => {
        this.dialogRef = null;
        action(result);
      });
    });
  }

  sendBilletNoteEmail(serialNumbers: number[], onlyBillet: boolean) {
    this.search.hideSpinnerMenu = false;
    this.invoiceService.sendBilletNoteEmail(serialNumbers, onlyBillet)
      .subscribe(
        ()=>{
          this.messageService.success('INV-S016', onlyBillet? 'boletos' : 'notas fiscais/boletos');
        },
        (e)=> {
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
        },
        () => this.search.hideSpinnerMenu = true
      );
  }

  sendBilletNoteForEmailList(result: any, onlyBillet: boolean, noteNumber : number) {
    this.search.hideSpinnerMenu = false;
    this.invoiceService.sendBilletNoteWithEmail(result, onlyBillet, noteNumber)
      .subscribe(
        ()=>{
          this.messageService.success('INV-S016', onlyBillet? 'boletos' : 'notas fiscais/boletos');
          this.search.hideSpinnerMenu = true;
        },
        (e)=>this.messageService.dealWithError(e),
        ()=>this.search.hideSpinnerMenu = true
      );
  }

  openZip() {
    if(!this.search.selectionList || !this.search.selectionList.length){
      this.messageService.error('INV-E023');
    } else if(!this.search.selectionList.filter(item=>createNoteSelectionElement(item).billetCondition).length
      && !this.search.selectionList.filter(item=>createNoteSelectionElement(item).downloadNoteCondition).length) {
        this.messageService.error('INV-E021');
    } else {
      let ids = this.search.selectionList.filter(item=>createNoteSelectionElement(item).billetCondition).map(item=>item.noteId);
      ids.push(this.search.selectionList.filter(item=>createNoteSelectionElement(item).downloadNoteCondition).map(item=>item.noteId));

      this.dialogRef = this.dialog.open(ZipDialogComponent, {
        width:'300px',
        data: {
          funcaoSucesso: (billet:boolean, note:boolean)=>{
          this.invoiceService.downloadZipNotes(ids, billet, note).subscribe(
            content=> {
              BlobUtil.startDownload(
                `ATC-NOTA-FISCAL-${formatDate(new Date(), 'ddMMyyyy-HH:mm', 'pt')}.zip`,
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

  showBilletDuplicateModal(invoiceId: number, noteNumber: number) {
    if (!!this.dialogRef) {
      return;
    }
    let invoiceComponent = this;
    this.invoiceService.getCustomerByInvoice(invoiceId)
        .subscribe(
          content=> {
            invoiceComponent.dialogRef = invoiceComponent.dialog.open(BilletDuplicateComponent, this.createDataForBilletDuplicateModal(content, noteNumber));
            invoiceComponent.dialogRef.afterClosed().subscribe(result => {
              invoiceComponent.dialogRef = null;
              if(!!result) invoiceComponent.generateDuplicateBillet(result, noteNumber)
            })
          },
          (e)=> invoiceComponent.messageService.dealWithError(e)
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
        source: 'IN',
        noteNumber: noteNumber
      }, 
      width:'550px' }
  }

  generateDuplicateBillet(result: any, noteNumber : number) {

    const appliedBalances = result.appliedBalances
    delete result.appliedBalances
    this.invoiceService.generateDuplicateBillet(result, noteNumber)
      .subscribe(
        ()=>{
          if(appliedBalances.length > 0) {
            appliedBalances.forEach(balance => balance.idInvoiceNoteBalanceApplication = noteNumber);
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

}



function prepareFilters(filters : any) {
  if (!!filters && !!filters.customer && !!filters.customer.id) {
    filters.customerId = filters.customer.id;
  }
}

function competenciaConv(params:any) {
  if (!params) {
    return null;
  }
  return formatDate(params, 'MM/yyyy','pt-BR');

}

function phaseConv(params:string) {
  switch(params) {
    case 'INVOICE_CALC' : return 'Memória de cálculo';
    case 'INVOICE' : return 'Fatura/Nota Fiscal';
    case 'ACCOUNTING' : return 'Contabilidade';
    default: return 'Indefinida';
  }

}

function formatSimpleDate(object : any){
  if (!object) {
    return null;
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}


function phaseStatusConv(params:string) {
  switch(params) {
    case 'WAITING' : return 'Aguardando Processamento';
    case 'PROCESSING' : return 'Em Processamento';
    case 'PROCESSED' : return 'Processado';
    case 'PROCESSED_WITH_ERRORS' : return 'Processado com Erro';
    case 'SAP_PROCESSING' : return 'Em Processamento SAP';
    case 'SAP_PROCESSED_WITH_ERRORS' : return 'Processado com Erro SAP';
    case 'SAP_PROCESSED' : return 'Processado SAP';
    //new
    case 'CREATED' : return 'N.F. Emitida';
    case 'CANCELLED' : return 'N.F. Cancelada';
    case 'ACCOUNTED' : return 'N.F. Contabilizada';
    case 'CANCELLED_POST_ACCOUNTING' : return 'N.F. Canc. pós Cont.';
    case 'NF_ERROR' : return 'Erro Processamento N.F.';
    default: return 'Indefinida';
  }


}

function invoiceNoteNumberConv(value : any) {
  if (!value) {
    return null;
  }
  return formatNumber(value, 'pt-BR', '9.0-0');
}


function invoiceCalcCondition(line : any) {
  return !!line && (line.phase == 'INVOICE_CALC' || line.phaseStatus == 'PROCESSED');
}

function invoiceNoteCondition(line : any) {
  return !!line && (line.phase == 'INVOICE' || line.phaseStatus == 'CREATED');
}


function billetCondition(line : any) {
  return !!line && invoiceNoteCondition(line) && line.noteExistsBillet && line.phaseStatus != 'CANCELLED' && parseFloat(line.grossTotalValue) > 0;
}

function notPayedBilletCondition(line : any) {
  return billetCondition(line) && !line.noteExistsPayedBillet && line.phaseStatus != 'CANCELLED';
}

function downloadNoteCondition(line : any) {
  return !!line && (line.phase == 'INVOICE' || line.phaseStatus == 'ACCOUNTED');
}

function cancelCondition(line : any) {
  return !!line && invoiceNoteCondition(line) && line.phaseStatus != 'CANCELLED' && !line.noteExistsPayedBillet;
}

function cancelledCondition(line : any) {
  return !!line && line.phaseStatus == 'CANCELLED';
}

function singleBilletCondition(line : any) {
  return billetCondition(line) && line.quantityBillets < 2;
}

function groupBilletCondition(line : any) {
  return billetCondition(line) && line.quantityBillets > 1;
}

function sendBilletNoteCondition(line : any) {
  return billetCondition(line) && !line.noteExistsPayedBillet && line.phaseStatus != 'CANCELLED' && line.quantityBillets == 1;
}

function createNoteSelectionElement(element:any) {
  return {
    id: element.id,
    calcPhaseCondition: invoiceCalcCondition(element),
    billetCondition: billetCondition(element),
    notPayedBilletCondition: notPayedBilletCondition(element),
    sendBilletNoteCondition: sendBilletNoteCondition(element),
    downloadNoteCondition: downloadNoteCondition(element)
  }
}

function hintCondition(element:any) {
  return !!element.buildErrorHint.length;
}

function notPayedAndSingleBilletCondition(element:any){
  return notPayedBilletCondition(element) && singleBilletCondition(element);
}

function currencyConv(value: any) {
  return formatCurrency(value, LOCALE, 'R$');
}

