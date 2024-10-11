import { Component, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidatorsUtil, MASKCLIENT } from 'src/app/shared/util/validators.util';
import { formatDate, formatCurrency } from '@angular/common';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MessageService } from 'src/app/shared/communication/message.service';
import { CovenantFileService } from 'src/app/invoice/services/covenant-file.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { MaskPipe } from 'ngx-mask';
import { StringUtil } from 'src/app/shared/util/string.util';
import * as moment from 'moment';
import { MatDialogRef, MatDialog } from '@angular/material';
import { CreateDowningComponent } from '../create-downing-dialog/create-downing.component';
import { BalanceService } from 'src/app/invoice/services/balance.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactService } from 'src/app/invoice/services/contact.service';
import { BilletEmailComponent } from 'src/app/shared/components/billet-email-dialog/billet-email.component';
import { userRoles } from 'src/app/shared/util/user-roles';
import { AuthService } from 'src/app/shared/security/auth/auth.service';

const LOCALE = 'pt-BR';

@Component({
  selector:     'app-client-balance-list',
  templateUrl:  './client-balance-list.component.html',
  styleUrls: [  './client-balance-list.component.scss'],
})
export class ClientBalanceList   {
  
  requiredRolesToView: string = userRoles.inClientBalanceView;
  maskCliente: string = MASKCLIENT;

  cols = [
    {title:'Código Cliente',                            prop: 'sapCode' },
    {title:'Grupo de Faturamento',                      prop: 'name' },
    {title:'CNPJ',                                      prop: 'cnpj',           converter: nationalCompanyNumberConv },
    {title:'Saldo Final',                               prop: 'finalBalance' },
    {title:'Juros e/ou Multa aplicados ao saldo total', prop: 'interestFines',  converter: currencyConv },
  ];

  innerCols = [
    { title: 'Nota(s)',               prop: 'noteNumber' },
    { title: 'Valor bruto',           prop: 'billetAmountValue',            converter: currencyConv },
    { title: 'Boleto',                prop: 'uniqueNumberIdentifier' },
    { title: 'Data de emissão',       prop: 'noteCreatedOn',                    converter: formatSimpleDate},
    { title: 'Vencimento',            prop: 'formatedDueDate' },
    { title: 'Pagamento',             prop: 'payedDate',                    converter: formatSimpleDate },
    { title: 'Valor Pago',            prop: 'payedValue',                   converter: currencyConv },
    { title: 'Atraso',                prop: 'dueDays',                      converter: dayConv },
    { title: 'Saldo',                 prop: 'balanceValueOperationalType' },
    { title: 'Juros/Multa Aplicados', prop: 'interestFines',                converter: currencyConv},
  ]

  actions = [
    {
      action : 'actions',
      subActions : [
        {
          title:'Gerar Boleto(s) Saldo(s) do Cliente',
          action: 'create_billet_downing',
          role: userRoles.inClientBalanceEmit,
          icon:{name:'insert_drive_file'}
        }
      ]

    }
  ];

  innerActions = [
    {
      action : 'actions', 
      isSubAction: true,
      subActions : [
        {
          title: 'Efetuar baixa em saldo total da nota', 
          action: 'create_downing_note', 
          icon: {name:'insert_drive_file'}
        },
        {
          title: 'Download Boleto',
          action: 'download_billet',
          icon: {name: 'attach_money'}
        },
        {
          title: 'Enviar Boleto em E-mail',
          action: 'send_billet_email',
          icon:{name: 'send'}
        }
      ]

    }
  ];
  
  @ViewChild('search') search : any; 

  form: FormGroup;

  filters: string[];

  dialogRef: MatDialogRef<any>;

  formOnSearchMoment: any;
  disableExportBtn:boolean = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public validate : FwValidateService,
    public balanceService: BalanceService,
    private builder: FormBuilder,
    private dialog: MatDialog,
    private messageService: MessageService,
    private contactService : ContactService,
    private authService: AuthService) {}


  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    _this.filters = ['customerSapCode',
      'customerNationalCompanyNumber',
      'customerName',
      'noteType',
      'createdOnStart',
      'createdOnEnd',
      'downedBalance',
      'overdueClients',
      'partialDownedBalance',
      'fullfiledPayments',
      'openBalance'];
    _this.form = _this.builder.group({
      customerSapCode: [null],
      customerNationalCompanyNumber: [null],
      customerName: [null],
      noteType: [null],
      createdOnStart: [moment().startOf('month').toDate(), [ValidatorsUtil.date, Validators.required]],
      createdOnEnd: [moment().endOf('month').toDate(), [ValidatorsUtil.date, Validators.required]],
      downedBalance: [null],
      partialDownedBalance: [null],
      overdueClients: [null],
      fullfiledPayments: [null],
      openBalance: [null],
    });
  }

  isDevMode() {
    return false;
  }

  executeAction(event : any) {
    if(event.action.action == 'create_billet_downing') {
      let data = event.line.innerListFilter;
      data.showValue = {customerName: event.line.name, customerSapCode: event.line.sapCode}
      this.router.navigate(['create-billet-downing'], { state: { data } });
    } else if(event.action.action == 'create_downing_note') {
      if (!!this.dialogRef) {
        return;
      }
      this.dialogRef = this.dialog.open(CreateDowningComponent, { data: this.createDowningData(event.line, event.line.outerLine, event.line.billetId), width:'1200px' });
    
      this.dialogRef.afterClosed().subscribe(result => {
        if(result && result.status == 'ok') this.search.search(false);
        this.dialogRef = null;
      })
    } else if(event.action.action == 'download_billet') {
      this.balanceService.downloadBillet(event.line.billetId).subscribe(
        content=> {
          BlobUtil.startDownload(
            `ATC-${event.line.outerLine.sapCode != null ? event.line.outerLine.sapCode : event.line.outerLine.name}-Boleto_${event.line.noteNumber}.pdf`,
            content,
            'application/pdf'
          );
        },
        (e)=> this.messageService.dealWithError(e)
      );
    } else if(event.action.action == 'send_billet_email') {
      this.showBilletEmailModal(event.line.billetId);
    }
  }

  showBilletEmailModal(billetId: number) {
    if (!!this.dialogRef) {
      return;
    }
    let balanceComponent = this;
    this.contactService.getContactsEmail('billet', billetId)
      .subscribe(
        content=> {
          balanceComponent.dialogRef = balanceComponent.dialog.open(BilletEmailComponent,{ data: { id: billetId, title: 'Enviar Boleto', emailList: content.map(item => { return { email: item }}) }, width:'450px' });

          balanceComponent.dialogRef.afterClosed().subscribe(result => {
            balanceComponent.dialogRef = null;
            if(!!result) balanceComponent.sendBilletToEmailList(result)
          })
        },
        (e)=> balanceComponent.messageService.dealWithError(e)
      );
  }

  sendBilletToEmailList(result: any) {
    this.balanceService.sendBilletToEmailList(result)
      .subscribe(
        ()=>{
          this.messageService.success('INV-S016', 'boleto');
        },
        (e)=>this.messageService.dealWithError(e)
      );
  }
  
  download(){
      this.disableExportBtn = true;
      let value = this.formOnSearchMoment;
      if (null !== this.form.get('customerSapCode').value) {
        value.customerSapCode = this.form.get('customerSapCode').value;
      }
      if (null !== this.form.get('customerName').value) {
        value.customerName = this.form.get('customerName').value;
      }
      if (null !== this.form.get('customerNationalCompanyNumber').value) {
        value.customerNationalCompanyNumber = this.form.get('customerNationalCompanyNumber').value;
      } else {
        value.customerNationalCompanyNumber = "";
      }
      value.customerIds = this.search.dataSource.data.map(line => line.id)
      this.balanceService.downloadFile(value)
      .subscribe(
        content=> {
          this.disableExportBtn = false
          BlobUtil.startDownload(
            `atc-controle-saldo-cliente_${formatDateInverse()}.xls`,
            content,
            'text/plain'
          );
        },
        (e)=> {
          
          this.disableExportBtn = false
          this.messageService.dealWithError(e)}
      ); 
  } 
  

  createDowningData(innerLine:any, outerline:any, billetId?:number) {
    return { 
      customerSapCode: outerline.sapCode,
      customerNationalCompanyNumber: outerline.cnpj,
      customerName: outerline.name,
      billetId: billetId,
      isBalance: innerLine.isBalance,
      finalized: innerLine.finalized,
      filter: this.formOnSearchMoment
    }
  }

  executeSearch() {
    this.search.filters = {};
    if(this.form.status == 'VALID') this.setFormToSearchFilter(); 
    else { 
      this.search.filters.continueSearch = false;
      this.activateValidators(this.form.get('createdOnStart'))
      this.activateValidators(this.form.get('createdOnEnd'))
    }
  }

  setFormToSearchFilter() {
    this.search.filters.clientBalance = true;
    this.filters.forEach(item => {
      if(this.form.value[item]) {
        let formValue = this.form.value[item]
        this.search.filters[item + (this.form.value[item].hasOwnProperty('id') ? 'Id':'')] = formValue.hasOwnProperty('id') ? formValue.id : formValue
      }
    });
    this.formOnSearchMoment = this.executeInnerList();
  }
  
  executeClear(previousFilters:any) {
    this.form.reset()
  }

  activateValidators(field:AbstractControl) {
    field.markAsTouched()
    field.updateValueAndValidity()
  }

  executeInnerList():any {
    let value = {
      customerNationalCompanyNumber: this.form.get('customerNationalCompanyNumber').value,
      createdOnStart: this.form.get('createdOnStart').value,
      createdOnEnd: this.form.get('createdOnEnd').value,
      downedBalance: this.form.get('downedBalance').value,
      partialDownedBalance: this.form.get('partialDownedBalance').value,
      overdueClients: this.form.get('overdueClients').value,
      fullfiledPayments: this.form.get('fullfiledPayments').value,
      openBalance: this.form.get('openBalance').value,
      noteType: this.form.get('noteType').value,
    }
    Object.keys(value).forEach(property=> {
      if(value[property] === null || value[property] === undefined) delete value[property]
    })
    return value;
  }

  onCreateInnerList({line: line }) {
    if(this.formOnSearchMoment.billetId) delete this.formOnSearchMoment.billetId
    line.innerListFilter = this.formOnSearchMoment;
    line.innerListFilter.customerNationalCompanyNumber = line.cnpj;
    line.innerListFilter.customerIds = new Array();
    line.innerListFilter.customerIds.push(line.id);
  }

}

function formatSimpleDate(object : any){
  if (!object) {
    return '-';
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}

function currencyConv(value: any) {
  if (!value) {
    return '-';
  }
  return formatCurrency(value, LOCALE, 'R$');
}

function dayConv(object : any){
  return StringUtil.retroactiveDaysIn(object);
}

function nationalCompanyNumberConv(params: any) {
  return params.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}
function formatDateInverse(){
  return formatDate(new Date(), 'ddMMyyyy-HHmmSS','pt-BR');
}
