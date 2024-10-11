import {Component, OnInit, ViewChild, Injectable, NgModule} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { userRoles } from 'src/app/shared/util/user-roles';
import { Observable, from } from 'rxjs';
import { startWith, debounceTime, filter, distinctUntilChanged, switchMap, map, take, finalize } from 'rxjs/operators';
import { Pageable } from 'src/app/shared/util/pageable';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { OperatorService } from 'src/app/invoice/services/operator.service';
import { InvoiceCalcService } from 'src/app/invoice/services/invoice-calc.service';
import { formatCurrency, formatDate } from '@angular/common';
import {BlobUtil} from "../../../../shared/util/blob.util";
import {MessageService} from "../../../../shared/communication/message.service";
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { ContactService } from 'src/app/invoice/services/contact.service';
import { BilletEmailComponent } from 'src/app/shared/components/billet-email-dialog/billet-email.component';
import { Router } from '@angular/router';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { InvoiceCalcReopenComponent } from 'src/app/invoice/components/invoice-calc/reopen/invoice-calc-reopen.component';
import {AuthGuard} from "../../../../shared/security/guards/auth.guard";

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-invoice-calc',
  templateUrl: './invoice-calc.component.html',
  styleUrls: ['./invoice-calc.component.scss']
})

export class InvoiceCalcComponent implements OnInit {

  userRoles = userRoles;

  routeToEdit: string = 'invoice-calc/edit';

  cols = [
    {title:'Tipo', prop: 'typeTax' },
    {title:'Operadora', prop: 'operatorName' },
    {title:'Código do Cliente', prop: 'customerSapCode' },
    {title:'Grupo de Faturamento', prop: 'customerName' },
    {title:'Competência', prop: 'period' },
    {title:'Situação',prop:'calcStatus', converter : phaseStatusConv, hintContent: "Não existem itens na Memória de Cálculo!", hintCondition: noInvoiceItemHintCondition, enableHint: true},
    {title:'Valor', prop: 'grossTotalValue', converter: currencyConv},
    {title:'E-Mail', prop: 'emailStatus', converter: emailStatusConv},
    {title:'', prop:'buildErrorHint', hintCondition: hintCondition, enableHint: true},
  ];

  actions = [
    {
      // title : 'Ações',
      action : 'actions',
      subActions : [
        {
          title: 'Download Memória de Cálculo',
          // condition: downloadNoteCondition,
          action: 'download_invoice_calc',
          role: userRoles.invoiceCalcDownload,
          icon: {name: 'cloud_download'}
        },
        {
          title: 'Excluir',
          condition: deleteInvoiceCondition,
          action: 'exclude_invoice_calc',
          role: userRoles.invoiceCalcCancel,
          icon: {name: 'cancel'}
        },
        {
          title: 'Enviar e-mail',
          condition: sendEmailCondition,
          action: 'send_invoice_calc_email',
          role: userRoles.invoiceCalcSend,
          icon: {name: 'send'}
        },
        {
          title: 'Editar memória de cálculo',
          condition: editInvoiceCalcCondition,
          action: 'send_invoice_calc_edit',
          role: userRoles.invoiceCalcEdit,
          icon: { name: 'edit' }
        },
        {
          title: 'Gerar arquivo de integração',
          condition: generateIntegrationCondition,
          action: 'generate_integration_invoice_calc',
          // role: userRoles.invoiceCalcGenerateIntegration,
          icon: { name: 'done' }
        },
        {
          title: 'Reabrir memória de nota fiscal cancelada',
          condition: reopenInvoiceMemory,
          action: 'reopenInvoiceMemory',
          role: userRoles.reopenMemory,
          icon: { name: 'warning' }
        }
      ]
    }
  ];

  @ViewChild('search') search: any;

  customerControl = new FormControl();
  operatorControl = new FormControl();
  dialogRef: MatDialogRef<any>;

  cmpControl: any;
  crtdControl: any;

  requiredRolesToView: string = userRoles.invoiceCalcView;

  public allOperators: { name: string, id: number, selected: boolean }[] = [];
  public allCustomers: { name: string, id: number, selected: boolean }[] = [];
  public filteredOperators: Observable<{ name: string, id: number, selected: boolean }[]>;
  public filteredCustomers: Observable<{ name: string, id: number, selected: boolean }[]>;

  idsNotProcessed = [];
  idsDeleteNotHasIntegrationFile = []; // Usado para dar msg de erro
  idsDeleteHasIntegrationFile = []; // Lista com os Ids que serão deletados
  idsHasIntegrationFileCreate = [];

  constructor(
    public dialog: MatDialog,
    private customerService: CustomerService,
    private operatorService: OperatorService,
    private invoiceCalcService: InvoiceCalcService,
    public authService: AuthService,
    private contactService : ContactService,
    private messageService: MessageService,
    private router: Router) {
  }

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    _this.search.filters.inactiveOperator = false;
    _this.search.filters.inactiveCustomer = false;
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.search.filters.period = currentCmp;
    _this.search.filters.creationDate = null;
    _this.renderOperators();
    _this.renderCustomers();
    _this.cmpControl = new FormControl(currentCmp, ValidatorsUtil.date);
    _this.crtdControl = new FormControl(null, ValidatorsUtil.date);
  }

  public renderOperators() {
    this.search.filters.operator = null;
    this.operatorControl.disable();
    this.operatorService.findAutocompleteOperatorsInactive(!this.search.filters.inactiveOperator)
    .pipe(finalize(() => {
      this.operatorControl.enable();
      this.filteredOperators = this.operatorControl.valueChanges.pipe(
        startWith(''),
        map(s => s ? this.filterOperators(s) : this.allOperators.slice())
      );
    }))
    .subscribe((result: any) =>{
      this.allOperators = result;
    });
  }

  private filterOperators(value: string | any): {id: number, name: string, selected: boolean}[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allOperators.filter(operator => operator.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.allOperators.filter(operator => operator.id === value.id);
    }
  }

  private isNotString(value: any): boolean {
    return typeof value !== "string";
  }

  public renderCustomers() {
    //this.search.filters.customer = null;
    this.customerControl.disable();
    if (this.search.filters.operator != null && this.isNotString(this.search.filters.operator)) {
      this.customerService.findAutocompleteCustomersIdOperatorAndInactive(this.search.filters.operator.id, !this.search.filters.inactiveCustomer)
      .pipe(finalize(() => {
        this.customerControl.enable();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterCustomers(s) : this.allCustomers.slice())
        );
      }))
      .subscribe((result: any[]) =>{
        this.allCustomers = result;
      });
    } else {
      this.customerService.findAutocompleteCustomersInactive(!this.search.filters.inactiveCustomer)
      .pipe(finalize(() => {
        this.customerControl.enable();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterCustomers(s) : this.allCustomers.slice())
        );
      }))
      .subscribe((result: any[]) =>{
        if(this.search.filters.operator == null){
          this.allCustomers = result;
        }
      });
    }

  }

  private filterCustomers(value: string | any): {id: number, name: string, selected: boolean}[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(value.name) === 0);
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

  chosenYearHandlerCrtd(normalizedYear: any) {
    let ctrlValue = this.crtdControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControl.setValue(ctrlValue);
  }

  chosenMonthHandlerCrtd(normalizedMonth: any) {
    const ctrlValue = this.crtdControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControl.setValue(ctrlValue);
  }

  displayCustomer(customer:any) {
    if (!customer) {
      return null;
    }
    return customer.name;
  }

  displayOperator(operator:any) {
    if (!operator) {
      return null;
    }
    return operator.name;
  }

  selectionCondition(item : any) {
    return true;
  }

  executeClear(previousFilters:any) {
    this.customerControl.reset;
    this.operatorControl.reset;
    this.renderOperators();
    this.renderCustomers();
  }

  executeSearch() {
    if(localStorage.length != 0){
        this.getLocalStorageFiltersGetParams();
    }
    this.search.filters.operatorId = this.search.filters.operator ? this.search.filters.operator.id : null;
    this.search.filters.customerId = this.search.filters.customer ? this.search.filters.customer.id : null;
    this.search.filters.continueSearch = true;
    localStorage.clear();
  }

  execute(event : any) {
    if (event.action.action == 'download_invoice_calc') {
      this.invoiceCalcService.downloadInvoiceCalc(event.line.id)
        .subscribe(
          content => {
            BlobUtil.startDownload(
              `Faturamento-${event.line.customerName != null ? event.line.customerName : event.line.customerSapCode}-${formatCompetence(event.line.period)}.xls`,
              content,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
          },
          (e) => this.messageService.dealWithError(e)
        );
    }else if (event.action.action == 'exclude_invoice_calc') {
      let confirmDelete = false;
      this.showConfirmDelete('Deseja realmente excluir o item selecionado?', result=> {
        confirmDelete = (!!result && result.status == 'ok')
        if(confirmDelete) this.deleteInvoicesCalc([event.line.id], false)
      });
    } else if (event.action.action == 'send_invoice_calc_email') {
      this.showInvoiceCalcEmailModal(event.line.id)
    } else if (event.action.action == 'send_invoice_calc_edit') {
      this.setLocalStorageFiltersSetParams();
      this.router.navigate([this.routeToEdit], { queryParams: { id: event.line.id}});
    } else if (event.action.action == 'generate_integration_invoice_calc') {
      this.generateIntegrationFile(event.line.id);
    }else if (event.action.action === 'reopenInvoiceMemory') {
      if (event.action.condition && this.authService.hasRole(event.action.role)) {
        this.reopenInvoiceMemory(event.line.customerName, event.line.period, event.line.id);
      }
    }
  }

  generateIntegrationFile(invoiceId: number) {
    this.search.hideSpinnerMenu = false;
    this.invoiceCalcService.generateIntegrationFile(invoiceId)
      .subscribe(
        (resp)=>{
          resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E056');
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        },
        (e)=>{
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        },
        ()=>this.search.hideSpinnerMenu = true
      )
  }

  showInvoiceCalcEmailModal(invoiceId: number) {
    if (!!this.dialogRef) {
      return;
    }
    let invoiceCalcComponent = this;
    this.contactService.getContactsEmail('invoice', invoiceId)
      .subscribe(
        content=> {
          invoiceCalcComponent.dialogRef =
          invoiceCalcComponent.dialog.open(
            BilletEmailComponent,{ data:
              { id: invoiceId, title: 'Enviar Memória de Cálculo',
              emailList: content.map(item => { return { email: item }}) }, width:'450px' });

          invoiceCalcComponent.dialogRef.afterClosed().subscribe(result => {

            invoiceCalcComponent.dialogRef = null;
            if(!!result){
              result.generateInLote = false;
              invoiceCalcComponent.sendInvoiceCalcForEmailList(result);
            }
          })
        },
        (e)=> invoiceCalcComponent.messageService.dealWithError(e)
      );
  }

  sendInvoiceCalcForEmailList(result: any) {
    this.search.hideSpinnerMenu = false;
    this.invoiceCalcService.beginBilletNoteWithEmail(result)
      .subscribe(
        ()=>{
          this.search.search(true);
          this.invoiceCalcService.sendBilletNoteWithEmail(result)
            .subscribe(
              ()=>{
                this.messageService.success('INV-S016', 'memória de cálculo');
                this.search.hideSpinnerMenu = true;
                this.search.search(true);
              },
              (e)=>{
                this.messageService.dealWithError(e);
                this.search.hideSpinnerMenu = true;
                this.search.search(true);
              },
              ()=>this.search.hideSpinnerMenu = true
            );
        },
        (e)=>{
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        }
      );
  }

  showConfirmDelete(msg: string, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(ConfirmComponent, { data: { msg: msg }, width: '380px' });
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      action(result);
    });
  }

  deleteInvoicesCalc(ids: number[], deleteInLot: boolean) {
    if (ids && ids.length > 0) {
      this.invoiceCalcService.deleteInvoicesCalc(ids, deleteInLot)
        .subscribe(
          () => {
            this.search.search(true);
            this.messageService.success('INV-S005', 'Memória de cálculo', 'excluída');
          },
          (e) => {
            this.search.search(true);
            this.messageService.dealWithError(e);
          }
        );
    }
    this.messageIntegracaoProcessed(this.idsDeleteNotHasIntegrationFile, 'INV-E058');
  }

  executeDeleteInvoicesCalc() {
    if (!this.search.selectionList || !this.search.selectionList.length) {
      this.messageService.error('INV-E023');
    } else {
      let confirmDelete = false;
      this.showConfirmDelete('Deseja realmente excluir ' + this.search.selectionList.length + ' itens selecionados?', result => {
        confirmDelete = (!!result && result.status == 'ok')
        if (confirmDelete) {
          this.idsDeleteNotHasIntegrationFile = this.search.selectionList.filter(item => item.hasIntegrationFile);
          this.idsDeleteHasIntegrationFile = this.search.selectionList.filter(item => !item.hasIntegrationFile);
          this.deleteInvoicesCalc(this.idsDeleteHasIntegrationFile.map(item => item.id), true);
        }
      });
    }
  }

  sendEmail() {
    if (!this.search.selectionList || !this.search.selectionList.length) {
      this.messageService.error('INV-E023');
    } else if (this.search.selectionList.filter(invoice => invoice.calcStatus === '2').length === 0) {
      this.messageService.error('INV-E055');
    } else {
      let invoiceCalcComponent = this;
      let invoiceIds = this.search.selectionList.filter(invoice =>
        invoice.calcStatus === '2').map(invoice => invoice.id);
      this.contactService.getContactsEmailFromInvoices('invoices', invoiceIds)
        .subscribe(
          content => {
            invoiceCalcComponent.dialogRef =
            invoiceCalcComponent.dialog.open(BilletEmailComponent,
               { data: { title: 'Enviar Memória de Cálculo',
                emailList: content.map(item => { return { email: item } }) }, width: '450px' });

            invoiceCalcComponent.dialogRef.afterClosed().subscribe(result => {
              invoiceCalcComponent.dialogRef = null;
              if (!!result) {
                result.generateInLote = true;
                result.ids = invoiceIds;
                invoiceCalcComponent.sendInvoiceCalcForEmailList(result);
              }
            })
          },
          (e) => invoiceCalcComponent.messageService.dealWithError(e)
        );
    }
  }

  openConfirmExportReport() {
    let exportItems = false;
    this.showConfirmMessage('Exportar itens da Memória de Cálculo?', result => {
      exportItems = (!!result && result.status == 'ok')
      this.exportReport(exportItems);
    })
  }

  exportReport(exportItems: boolean) {
    this.executeSearch();
    this.invoiceCalcService.downloadInvoiceCalcReport(this.getParamsFilter(exportItems)).subscribe();
    this.messageService.success('AT-S006');
  }

  setLocalStorageFiltersSetParams(){
    this.setKeyValueNotNull('period', this.search.filters.period);
    this.setKeyValueNotNull('operator', this.search.filters.operator);
    this.setKeyValueNotNull('inactiveOperator', this.search.filters.inactiveOperator);
    this.setKeyValueNotNull('creationDate', this.search.filters.creationDate);
    this.setKeyValueNotNull('customer', this.search.filters.customer);
    this.setKeyValueNotNull('inactiveCustomer', this.search.filters.inactiveCustomer);
    this.setKeyValueNotNull('customerSapCode', this.search.filters.customerSapCode);
    this.setKeyValueNotNull('invoiceStatus', this.search.filters.invoiceStatus);
    this.setKeyValueNotNull('emailStatus', this.search.filters.emailStatus);
    this.setKeyValueNotNull('discount', this.search.filters.discount);
    this.setKeyValueNotNull('withProRata', this.search.filters.withProRata);
    this.setKeyValueNotNull('withoutProRata', this.search.filters.withoutProRata);
    this.setKeyValueNotNull('excluded', this.search.filters.excluded);
    this.setKeyValueNotNull('withIntegration', this.search.filters.withIntegration);
    this.setKeyValueNotNull('withOutIntegration', this.search.filters.withOutIntegration);
  }

  setKeyValueNotNull(key: string, value: any){
    if(value != null){
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getLocalStorageFiltersGetParams(){
    if (localStorage.getItem('period') != null) {
      const datePeriod = new Date(JSON.parse(localStorage.getItem('period')));
      datePeriod.setDate(1);
      this.search.filters.period = datePeriod;
    } else {
      this.search.filters.period = null;
    }

    if (localStorage.getItem('operator') != null) {
      const objOperator = JSON.parse(localStorage.getItem('operator'));
      this.search.filters.operator = { id: objOperator.id, name: objOperator.name, selected: objOperator.selected }
      this.operatorControl.setValue(this.search.filters.operator);
    }


    if (localStorage.getItem('creationDate') != null) {
      const dateCreation = new Date(JSON.parse(localStorage.getItem('creationDate')));
      this.search.filters.creationDate = dateCreation;
    } else {
      this.search.filters.creationDate = null;
    }

    if (localStorage.getItem('customer') != null) {
      const objCustomer = JSON.parse(localStorage.getItem('customer'));
      this.search.filters.customer = { id: objCustomer.id, name: objCustomer.name, selected: objCustomer.selected }
      this.customerControl.setValue(this.search.filters.customer);
    }

    this.search.filters.inactiveOperator = this.getValueLocalStorage(localStorage.getItem('inactiveOperator'), this.search.filters.inactiveOperator );
    this.search.filters.inactiveCustomer = this.getValueLocalStorage(localStorage.getItem('inactiveCustomer'), this.search.filters.inactiveCustomer);
    this.search.filters.customerSapCode = this.getValueLocalStorage(localStorage.getItem('customerSapCode'), this.search.filters.customerSapCode);
    this.search.filters.invoiceStatus =  this.getValueLocalStorage(localStorage.getItem('invoiceStatus'), this.search.filters.invoiceStatus);
    this.search.filters.emailStatus = this.getValueLocalStorage(localStorage.getItem('emailStatus'), this.search.filters.emailStatus);
    this.search.filters.discount = this.getValueLocalStorage(localStorage.getItem('discount'), this.search.filters.discount);
    this.search.filters.withProRata = this.getValueLocalStorage(localStorage.getItem('withProRata'), this.search.filters.withProRata);
    this.search.filters.withoutProRata = this.getValueLocalStorage(localStorage.getItem('withoutProRata'), this.search.filters.withoutProRata);
    this.search.filters.excluded = this.getValueLocalStorage(localStorage.getItem('excluded'), this.search.filters.excluded);
    this.search.filters.withIntegration = this.getValueLocalStorage(localStorage.getItem('withIntegration'), this.search.filters.withIntegration);
    this.search.filters.withOutIntegration = this.getValueLocalStorage(localStorage.getItem('withOutIntegration'), this.search.filters.withOutIntegration);
  }

  getValueLocalStorage(objKey: any, objValue: any){
    return objKey != null ? JSON.parse(objKey) : objValue;
  }

  getParamsFilter(exportItems: boolean): { [key: string]: any; } {
    let request: { [key: string]: any; };
    request = {
      exportItems: exportItems,
      period: this.search.filters.period,
      operatorId: this.search.filters.operatorId,
      creationDate: this.search.filters.creationDate,
      customerId: this.search.filters.customerId,
      customerSapCode: this.search.filters.customerSapCode,
      invoiceStatus: this.search.filters.invoiceStatus,
      emailStatus: this.search.filters.emailStatus,
      discount: this.search.filters.discount,
      withProRata: this.search.filters.withProRata,
      withoutProRata: this.search.filters.withoutProRata,
      excluded: this.search.filters.excluded,
      withIntegration: this.search.filters.withIntegration,
      withOutIntegration: this.search.filters.withOutIntegration,
      tributeTypeId: this.search.filters.tributeTypeId
    }
    return request;
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

  openZip() {
    if(!this.search.selectionList || !this.search.selectionList.length){
      this.messageService.error('INV-E023');
    } else {
      let ids = this.search.selectionList.map(item=>item.id);
      this.invoiceCalcService.downloadInvoiceCalcZip(ids)
        .subscribe(
          content => {
            BlobUtil.startDownload(
              `ATC-MEMORIA-CALCULO-${formatDate(new Date(), 'ddMMyyyy-HH:mm', 'pt')}.zip`,
              content,
              'application/zip'
            );
          },
          (e) => this.messageService.dealWithError(e)
        );
    }
  }

  generateGroupIntegration() {
    this.idsNotProcessed = [];
    if (!this.search.selectionList || !this.search.selectionList.length) {
      this.messageService.error('INT-E001');
    } else {
      this.search.hideSpinnerMenu = false;

      // status diferente de processado
      this.idsNotProcessed = this.search.selectionList.filter(item => !item.isProcessed);
      this.idsHasIntegrationFileCreate = this.search.selectionList.filter(item => item.hasIntegrationFile);

      let idsProcessed = this.search.selectionList.filter(item => item.isProcessed && !item.hasIntegrationFile);
      const ids = idsProcessed.map(list => list.id);
      if (ids && ids.length > 0) {
        this.invoiceCalcService.generateGroupIntegrationFile(ids)
          .subscribe(
            (resp) => {
              resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E056');
              this.search.hideSpinnerMenu = true;
              this.search.search(true);
            },
            (e) => {
              this.messageService.dealWithError(e);
              this.search.hideSpinnerMenu = true;
              this.search.search(true);
            },
            () => {
              this.search.hideSpinnerMenu = true;
            }
          )
      }
      //Faturas com Arquivo de Integração
      this.messageIntegracaoProcessed(this.idsHasIntegrationFileCreate, 'INV-E059');
      // Faturas não processadas
      this.messageIntegracaoProcessed(this.idsNotProcessed, 'INV-E057');
    }
  }

  // Função para abrir o pop-up de confirmação
  reopenInvoiceMemory(customerName: string, period: string, invoiceId: number) {
    const dialogRef = this.dialog.open(InvoiceCalcReopenComponent, {
      width: '800px',
      height: '600px',
      data: { customerName, period, invoiceId } // Use object notation to pass multiple data properties
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'reopen') {
        this.search.search(true); // Update the search by calling search(true)
      }
    });
  }

  messageIntegracaoProcessed(list: any[], error: string) {
    if (list && list.length > 0) {
      let msg = '';
      for (let i = 0; i < list.length; i++) {
        if (msg) {
          msg = msg + ', ' + list[i].id;
        } else {
          msg = list[i].id;
        }
      }
      this.messageService.error(error, msg);
      this.search.hideSpinnerMenu = true;
    }
  }

  messageResultArray(value: any) {
    value.forEach(element => {
      this.showMessageSuccess(element);
      this.showMessageError(element);
    });
  }

  showMessageSuccess(element: any) {
    if (element.type === "SUCCESS") {
      this.messageService.showInlineMessage(Severity.INFO, element.message);
    }
  }

  showMessageError(element: any) {
    if (element.type === "ERROR") {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }
}

function currencyConv(value: any) {
  if (!value) {
    return '-';
  }
  if (value === '0') {
    value = '0,00';
  }
  return 'R$ ' + value;
}

function phaseStatusConv(params:string) {
  switch(params) {
    case '0' : return 'Aguardando Processamento';
    case '1' : return 'Em Processamento';
    case '2' : return 'Processado';
    case '3' : return 'Processado com Erro';
    case '7' : return 'Erro';
    default: return 'Indefinida';
  }
}

function emailStatusConv(params:string) {
  switch(params) {
    case '0' : return 'Não Enviado';
    case '1' : return 'Enviando';
    case '2' : return 'Enviado';
    case '3' : return 'Erro';
    default: return 'Indefinida';
  }
}

function formatCompetence(value:string) {
    var x = value.split('/');
    var month = x[0];
    var year = x[1];

    switch (month) {
      case "01": return "Janeiro-" + year;
      case "02": return "Fevereiro-" + year;
      case "03": return "Março-" + year;
      case "04": return "Abril-" + year;
      case "05": return "Maio-" + year;
      case "06": return "Junho-" + year;
      case "07": return "Julho-" + year;
      case "08": return "Agosto-" + year;
      case "09": return "Setembro-" + year;
      case "10": return "Outubro-" + year;
      case "11": return "Novembro-" + year;
      case "12": return "Dezembro-" + year;
      default: return value;

    }
}

function hintCondition(element:any) {
  return !!element.buildErrorHint.length;
}

function noInvoiceItemHintCondition(element:any) {
  if(element.calcStatus == '3' && element.grossTotalValue == "0,00") return true
  else return false
}

function deleteInvoiceCondition(element:any){
  return !element.haveInvoiceNote && !element.hasFutureInvoice && !element.exclusionIndicator && !element.hasIntegrationFile;
}

function sendEmailCondition(element:any){
  return element.isProcessed && !element.exclusionIndicator;
}

function editInvoiceCalcCondition(element: any) {
  return !element.haveInvoiceNote &&  !element.hasFutureInvoice && !element.exclusionIndicator && !element.hasIntegrationFile;
}

function generateIntegrationCondition(element: any) {
  return element.isProcessed && !element.hasIntegrationFile;
}

function reopenInvoiceMemory(element: any) {
  return element.hasOracleInvoicePermission && element.typeTax === 'ST';
}

