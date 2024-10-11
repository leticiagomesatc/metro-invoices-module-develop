import { formatDate } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwSearchHistoryService } from 'src/app/shared/controllers/fw/fw-search-history/fw-search-history.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { userRoles } from 'src/app/shared/util/user-roles';

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-billing-history',
  templateUrl: './billing-history.component.html',
  styleUrls: ['./billing-history.component.scss'],
})
export class BillingHistory implements OnInit{

  requiredRolesToView: string = userRoles.inBillingHistoryView;
  
  cols = [
    { title: 'CÓDIGO CLIENTE', prop: 'customerSapCode' },
    { title: 'GRUPO DE FATURAMENTO', prop: 'customerName' },
    { title: 'CNPJ', prop: 'customerCnpj', converter: nationalCompanyNumberConv },
    { title: 'COMPETÊNCIA', prop: 'period' },
  ];

  actions = [];
  
  @ViewChild('search') search: any;
  @ViewChild('noteTypeSelect') noteTypeSelect: MatSelect;

  formOnSearchMoment: any

  cmpControl

  disableExportBtn = false;

  constructor(
    public fwSearchHistoryService: FwSearchHistoryService,
    private messageService: MessageService,
    private authService: AuthService) {}
  
  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.search.filters.invoicementPeriod = currentCmp;
    _this.search.filters.period = currentCmp;
    _this.cmpControl = new FormControl(currentCmp, ValidatorsUtil.date);
  }

  onSearch() {
    this.search.filters.noteType = undefined
    if (this.noteTypeSelect.value) {
        this.search.filters.noteType = this.noteTypeSelect.value;
    }
    if (this.search.filters.customer) {
        this.search.filters.customerId = this.search.filters.customer.id;
        delete this.search.filters.customer;
    }
    if (this.search.filters.businessLocal) {
        this.search.filters.businessLocalId = this.search.filters.businessLocal.id;
        delete this.search.filters.businessLocal;
    }
    this.formOnSearchMoment = this.search.filters;
  }
  
  executeClear(previousFilters:any) {
    this.noteTypeSelect.value = undefined;
  }

  onCreateInnerList({line: line }) {
    line.innerListFilter = {};
    line.innerListFilter.createdInvoiceNoteIdList = line.createdInvoiceNoteIdList;
    line.innerListFilter.debitNoteId = line.debitNoteId;
    line.innerListFilter.invoiceId = line.invoiceId;
  }

  export(){
    const billetIds = this.search.dataSource.data.map(line => line.billetId)
    if(billetIds.length > 0) {
      Object.keys(this.formOnSearchMoment).forEach(property=> {
        if(this.formOnSearchMoment[property] === null || this.formOnSearchMoment[property] === undefined) delete this.formOnSearchMoment[property]
      })
      this.disableExportBtn = true;
      this.fwSearchHistoryService.export(this.formOnSearchMoment)
      .subscribe(
        content=> {
          BlobUtil.startDownload(
            `atc-historico-faturamento-${formatDateHour()}.xls`,
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
    } else this.messageService.error('INV-E042')
  }

  chosenYearHandler(normalizedYear: any) {
    let ctrlValue = this.cmpControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();
      ctrlValue.setDate(1);

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

  cleanFilterCustomer() {
    this.search.filters.customer = null;
    this.search.filters.customerId = null;
  }

}

function nationalCompanyNumberConv(params: any) {
  return params.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

function formatDateHour(){
  return formatDate(new Date(), 'ddMMyyyy-HHmmss','pt-BR');
}
