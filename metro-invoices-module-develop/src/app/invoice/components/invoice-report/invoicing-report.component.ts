import { formatCurrency, formatDate } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { MatSelect, MatAutocompleteSelectedEvent, MatFormFieldControl } from '@angular/material';
import { Router } from '@angular/router';
import { ChargeService } from '../../services/charge.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { startWith, debounceTime, filter, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { CustomerService } from '../../services/customer.service';
import { Pageable } from 'src/app/shared/util/pageable';
import { InvoicingReportService } from '../../services/invoicing-report.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import * as moment from 'moment';
import { MASKCLIENT } from 'src/app/shared/util/validators.util';

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-invoicing-report',
  templateUrl: './invoicing-report.component.html',
  styleUrls: ['./invoicing-report.component.scss'],
})
export class InvoicingReport  implements OnInit{

  maskCliente: string = MASKCLIENT;

  requiredRolesToView:string= userRoles.inInvoicingReportView;

  disableExportBtn:boolean = false

  form : FormGroup

  filteredCustomers: Observable<any[]>

  statuses: any[] = [{key: 'E', value:'Emitidas'}, {key: 'C', value:'Canceladas'}, {key: 'A', value:'Ambas'}]
  states: Observable<string[]>
  marketSegments: Observable<any[]>

  minLastEmission: Date;
  minLastPayment: Date;
    minLastCancel: Date;

  constructor(
    public validate: FwValidateService,
    private router: Router,
    private messageService: MessageService,
    private invoicingReportService: InvoicingReportService,
    private builder: FormBuilder,
    private customerService: CustomerService, 
    private authService: AuthService) {}

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this : any) {
    _this.createForm();
    _this.createCustomerField();
    _this.states = _this.invoicingReportService.retrieveStates();
    _this.marketSegments = _this.invoicingReportService.retrieveMarketSegments();
  }

  createCustomerField() {
    this.filteredCustomers = this.form.get('customer').valueChanges
      .pipe(startWith(''), debounceTime(250), filter(value => !!value && value.length > 2), distinctUntilChanged(), switchMap(value => value ?
        from(this.customerService.search({ name: value, customerSapCode: value }, new Pageable(0, 10), null))
        : from(Promise.resolve({ content: [] }))), map(a => a.content.map(item => {
          delete item.finalBalance;
          delete item.interestFines;
          return item;
        })));
  }

  createForm() {
    this.form = this.builder.group({
      customerSapCode: null,
      customerSocialReason: null,
      customerNationalNumber: null,
      customer: null,
      marketSegment: null,
      firstEmissionDate: null,
      lastEmissionDate:null,
      firstPaymentDate: null,
      lastPaymentDate: null,
	  firstCancelDate: null,
      lastCancelDate: null,
      state: null,
      noteStatus: null,
      exportInvoiceItens: false,
      customerId: null,
    });
  }

  export(){
    this.disableExportBtn = true
    this.invoicingReportService.export(this.cleanForm())
    .subscribe(
      content=> {
        BlobUtil.startDownload(
          `ATC_FATURADOS_${formatDateInverse()}.xls`,
          content,
          'text/plain'
        );
        this.disableExportBtn = false;
      },
      (e)=> {
        this.messageService.dealWithError(e)
        this.disableExportBtn = false;
        }
      );
  }

  private cleanForm(): any {
    this.form.value.customerId = null
    if (this.form.value.customer) {
      this.form.value.customerId = this.form.value.customer.id
    }

    
    let returnValue = JSON.parse(JSON.stringify(this.form.value))
    
    delete returnValue.customer

    returnValue.firstEmissionDate = this.form.value.firstEmissionDate
    returnValue.lastEmissionDate = this.form.value.lastEmissionDate
    returnValue.firstPaymentDate = this.form.value.firstPaymentDate
    returnValue.lastPaymentDate = this.form.value.lastPaymentDate
	  returnValue.firstCancelDate = this.form.value.firstCancelDate
    returnValue.lastCancelDate = this.form.value.lastCancelDate
    
    Object.keys(returnValue).forEach(property=> {
      if(returnValue[property] === null || returnValue[property] === undefined) delete returnValue[property]
    })


    return returnValue
  }

  displayCustomer(customer: any) {
    if (!customer) {
      return null;
    }
    return customer.sapCode + ' - ' + customer.name;
  }

  filterEmission = (d: Date): boolean => {
    return this.minLastEmission ? d > this.minLastEmission : true
  }

  filterPayment = (d: Date): boolean => {
    return this.minLastPayment ? d > this.minLastPayment : true
  }
  
  filterCancel = (d: Date): boolean => {
    return this.minLastCancel ? d > this.minLastCancel : true
  }

  resetDate(control: any){
    const formControl = `first${control}Date`
    const minField = `minLast${control}`

    this.form.controls[formControl].reset()
    this[minField] = undefined
  }

  resetMin(control:string) {
    const firstFormControl = `first${control}Date`
    const lastFormControl = `last${control}Date`
    const minField = `minLast${control}`

    this[minField] = this.form.controls[firstFormControl].value
    if(this.form.controls[lastFormControl].value <= this[minField]){
      this.form.controls[lastFormControl].reset()
    }
  }

}

function formatDateInverse(){
  return formatDate(new Date(), 'ddMMyyyy_HHmmss','pt-BR');
}