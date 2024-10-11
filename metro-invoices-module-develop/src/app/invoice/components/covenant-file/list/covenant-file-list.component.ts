import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Pageable } from 'src/app/shared/util/pageable';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { formatDate } from '@angular/common';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MessageService } from 'src/app/shared/communication/message.service';
import { MatDialogRef } from '@angular/material';
import { InvoiceService } from 'src/app/invoice/services/invoice.service';
import { BusinessLocalService } from 'src/app/invoice/services/business-local.service';
import { CompanyBranchService } from 'src/app/invoice/services/company-branch.service';
import { CovenantFileService } from 'src/app/invoice/services/covenant-file.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

const LOCALE = 'pt-BR';

@Component({
  selector:     'app-covenant-file-list',
  templateUrl:  './covenant-file-list.component.html',
  styleUrls: [  './covenant-file-list.component.scss'],
})
export class CovenantFileList   {
  
  requiredRolesToView = userRoles.inCovenantFileView

  cols = [
    {title:'Nome do arquivo',     prop: 'fileName' },
    {title:'Tipo do arquivo',     prop: 'covenantFileType', converter: typeConv },
    {title:'Data de criação',     prop: 'createdOn',        converter: formatSimpleDate },
    {title:'Mês de Emissão', prop: 'period',       converter: periodConv },
  ];

  actions = [
    {
      // title : 'Ações', 
      action : 'actions', 
      subActions : [
        {
          title:'Download', 
          condition : ()=>true,
          action: 'download_covenant_file', 
          icon:{name:'cloud_download'}
        }
      ]
    }
  ];
  
  @ViewChild('search') search : any; 

  form: FormGroup;

  businessLocalControl = new FormControl();
  companyBranchControl = new FormControl();
  cmpControl;
  filteredBusinessLocal: Observable<any[]>;
  filteredCompanyBranch: Observable<any[]>;
  formOnSearchMoment: any;

  constructor(
    private messageService : MessageService,
    private businessLocalService : BusinessLocalService,
    private companyBranchService : CompanyBranchService,
    private covenantFileService : CovenantFileService,
    public validate : FwValidateService,
    private builder: FormBuilder,
    private authService: AuthService) {}

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.form = _this.builder.group({
      period: [currentCmp, ValidatorsUtil.date],
      businessLocal: [null],
      companyBranch: [null]
    });
    _this.filteredBusinessLocal = _this.form.get('businessLocal').valueChanges.pipe(startWith(''), debounceTime(250), distinctUntilChanged(), switchMap((value:any) => !!value && value.length > 2 ?
      from(_this.businessLocalService.search({ name: value }, new Pageable(0, 10)))
      : from(Promise.resolve({ content: [] }))), map((a: any) => a.content));
    _this.filteredCompanyBranch = _this.form.get('companyBranch').valueChanges.pipe(startWith(''), debounceTime(250), distinctUntilChanged(), switchMap((value:any) => !!value && value.length > 2 ?
      from(_this.companyBranchService.search(_this.createParams(value), new Pageable(0, 10)))
      : from(Promise.resolve({ content: [] }))), map((a: any) => a.content));
  }

  createParams(value:string) {
    let params = <any>{nationalCompanyNumber:value};
    if(this.form.value.businessLocal) params.businessLocalId = this.form.value.businessLocal ? this.form.value.businessLocal.id : undefined
    return params;
  }

  isDevMode() {
    return false;
  }

  executeAction(event : any) {
    if(event.action.action == 'download_covenant_file') {
      this.covenantFileService.downloadFile(event.line.fileHash)
      .subscribe(
        content=> {
          BlobUtil.startDownload(
           event.line.fileName,
            content,
            'text/plain; charset= ISO_8859_1',
           
          
            );
        },
        (e)=> this.messageService.dealWithError(e)
      );
    }
  }

  chosenYearHandler(normalizedYear: any) {
    let ctrlValue = this.form.get('period').value;
    if (!ctrlValue) {
        ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.form.get('period').setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: any, datepicker: any) {
      const ctrlValue = this.form.get('period').value;
      ctrlValue.setMonth(normalizedMonth.getMonth());
      ctrlValue.setDate(1);
      this.form.get('period').setValue(ctrlValue);
      datepicker.close();
  }

  displayBusinessLocal(businessLocal:any) {
    if (!businessLocal) {
      return null;
    }
    return businessLocal.name;
  }
  
  displayCompanyBranch(companyBranch:any) {
    if (!companyBranch) {
      return null;
    }
    return `${companyBranch.nationalCompanyNumber}-${companyBranch.socialName}`;
  }

  selectBusinessLocal(selected: any) {
    if(this.form.value.companyBranch && selected.id != this.form.value.companyBranch.businessLocalId) {
      this.form.get('companyBranch').reset()
    }
  }

  issueCovenantFile() {

    this.setValidators(this.form.get('period'), [Validators.required, Validators.required])
   
    if(this.form.status == 'VALID' ){
      this.search.hideSpinnerMenu = false;
      this.covenantFileService.create(this.createIssueParams())
      .subscribe(
        (e)=>{
          this.search.search(false)
          this.messageService.success('INV-S006');
        },
        (e)=> {
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
        },
        () => this.search.hideSpinnerMenu = true
      )
    }
  }

  createIssueParams() {
    return {
      period: this.form.value.period,
      companyBranchId: this.form.value.companyBranch ? this.form.value.companyBranch.id : undefined,
      businessLocalId: this.form.value.businessLocal ? this.form.value.businessLocal.id : undefined
    }
  }

  executeSearch() {
    if(this.form.status == 'VALID')
      this.setFormOnSearchMoment();

    this.resetValidatorAndClearSearchFilter()
    this.setFormToSearchFilter()
  }

  setFormOnSearchMoment() {
    this.formOnSearchMoment = {};
    
    if(this.form.value.period) this.formOnSearchMoment.period = this.form.value.period;
    if(this.form.value.businessLocal) this.formOnSearchMoment.businessLocalId = this.form.value.businessLocal.id;
    if(this.form.value.companyBranch) this.formOnSearchMoment.companyBranchId = this.form.value.companyBranch.id;
  }

  setFormToSearchFilter() {
    this.search.filters.period = this.form.value.period;
    if(this.form.value.businessLocal) {
      this.search.filters.businessLocal = this.form.value.businessLocal;
      this.search.filters.businessLocalId = this.form.value.businessLocal.id;
    }
    if(this.form.value.companyBranch) {
      this.search.filters.companyBranch = this.form.value.companyBranch;
      this.search.filters.companyBranchId = this.form.value.companyBranch.id;
    }
  }

  downloadAll() {
    if (this.search.page.content && this.search.page.numberOfElements > 0) {
      this.search.hideSpinnerMenu = false;
      this.covenantFileService.downloadAll(this.formOnSearchMoment)
        .subscribe(
          content=> {
          BlobUtil.startDownload(
            `ATC-CONVENIO115-${formatDate(new Date(), 'ddMMyyyy-HH:mm', 'pt')}.zip`,
                content,
                'application/zip'
            );
        },
        (e)=> this.messageService.dealWithError(e),
        () => this.search.hideSpinnerMenu = true
      );
    }
    else {
      this.messageService.error('INV-E023');
    }
  }

  setValidators(field:AbstractControl, validators:any[]) {
    field.setValidators(validators)
    field.markAsTouched()
    field.updateValueAndValidity()
  }

  executeClear(previousFilters:any) {
    this.resetValidatorAndClearSearchFilter()
    this.resetForm()
  }

  resetValidatorAndClearSearchFilter() {
    this.setValidators(this.form.get('period'), [ValidatorsUtil.date])
    this.search.filters = {};
  }

  resetForm() {
    this.form.get('period').reset()
    this.form.get('businessLocal').reset()
    this.form.get('companyBranch').reset()
  }

}

function typeConv(params:any) {
  switch(params) {
    case 'MASTER' : return 'MESTRE';
    case 'ITEM' : return 'ITEM';
    case 'DATA' : return 'DADOS';
    case 'HEADER' : return 'IDENTIFICAÇÃO FILIAL';
    case 'CHARGEBACK' : return 'ESTORNO';
    default: return 'Indefinida';
  }
}

function periodConv(params:any) {
  if (!params) {
    return null;
  }
  return formatDate(params, 'MM/yyyy','pt-BR', '+0');
}

function formatSimpleDate(object : any){
  if (!object) {
    return null;
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}
