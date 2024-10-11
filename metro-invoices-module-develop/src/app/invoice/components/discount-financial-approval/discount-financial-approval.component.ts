import { formatCurrency,formatDate } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { TicketServiceCalc } from 'src/app/invoice/services/ticket-discount-calc.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { userRoles } from 'src/app/shared/util/user-roles';
import { DiscountFinancialApprovalService } from '../../services/discount-financial-approval.service';

const PENDING= 'Pendente';
const PENDING_ID = '4';

@Component({
  selector: 'app-discount-financial-approval',
  templateUrl: './discount-financial-approval.component.html',
  styleUrls: ['./discount-financial-approval.component.scss']
})
export class DiscountFinancialApprovalComponent implements OnInit{

    cols = [
        { title: 'Ticket', prop: 'ticketNV3' },
        { title: 'Segmento', prop: 'segment' },
        { title: 'Cód. Cliente', prop: 'customerSapCode' },
        { title: 'Grupo de Faturamento', prop: 'customerName' },
        { title: 'Designação NV3', prop: 'designationNV3' },
        { title: 'Tempo Imputável', prop: 'attributableTime' },
        { title: 'Data interrupção', prop: 'interruptionDate' },
        { title: 'Designação SICOP', prop: 'designationSICOP' },
        { title: 'Aprovação Financeira', prop: 'financialApproval' },
        { title: 'Valor Mensal Bruto', prop: 'grossMonthlyValue', converter:currencyConv },
        { title: 'Valor Desconto Bruto', prop: 'grossDiscountAmount', converter:currencyConv },
        { title: '', prop: 'buildHelp', hintCondition: hintCondition, enableHint: true },
      ];


       actions = [
         {
           action: 'actions',
           subActions: [
             {
               title: 'Aprovar Desconto',
               action: 'approve_discount',
               icon: { name: 'done' }
             },
             {
              title: 'Reprovar Desconto',
              action: 'fail_discount',
              role: userRoles.invoiceCalcCancel,
              icon: { name: 'cancel' }
             }
           ]
         }
       ];

  @ViewChild('search') search: any;

  dialogRef: MatDialogRef<any>;
  userRoles = userRoles;
  form : FormGroup;
  requiredRolesToView: string = userRoles.invoiceCalcView;

  yesNoStatus: any[] = [{ description: 'Sim', key: 1 }, { description: 'Não', key: 0 }];
  allDesignation:string [] = [];
  filteredDesignation: Observable<any[]>;

  allCustomers: { name: string, id: number, selected: boolean, sapCode: string }[] = [];
  filteredCustomers: Observable<{ name: string, id: number, selected: boolean, sapCode: string}[]>;
  filteredSapCode: Observable<{ name: string, id: number, selected: boolean, sapCode: string}[]>;

  marketSegments: Observable<any[]>
  discountControl = new FormControl();
  marketSegmentControl = new FormControl();
  designationControl = new FormControl();
  customerControl = new FormControl();
  codSapControl = new FormControl();

  edit: boolean = false;

  constructor(
    private discountFinanApprService:DiscountFinancialApprovalService,
    public authService: AuthService,
    private dialog: MatDialog,
    private customerService: CustomerService,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = true;
    this.renderDesignation();
    this.renderCustomers();
    this.renderSapCode();
    this.search.filters.financialApproval = PENDING_ID;
    this.marketSegments = this.discountFinanApprService.getMarketSegmentFiltered();
  }

  public renderDesignation() {
    this.discountFinanApprService.getDesignationFiltered()
      .pipe(finalize(() => {
        this.designationControl.enable();
        this.filteredDesignation = this.designationControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterDesignation(s) : this.allDesignation.slice())
        );
      }))
      .subscribe((result: any[]) =>{
          this.allDesignation = result;
      });
    }

  private filterDesignation(value: string | any): {} [] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allDesignation.filter(designation => designation.toLowerCase().indexOf(filterValue) === 0);
    } else {
       return this.allDesignation.filter(designation => designation.toLowerCase().indexOf(value.name) === 0);
    }
  }

  public renderCustomers() {
    this.customerService.findAutocompleteCustomersInactive(true)
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

    private filterCustomers(value: string | any): {id: number, name: string, selected: boolean, sapCode: string}[] {
      if (typeof value === "string") {
        const filterValue = value.toLowerCase();
        return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) === 0);
      } else {
        return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(value.name) === 0);
      }
    }

    displayCustomer(customer:any) {
      if (!customer) {
        return null;
      }
      return customer.name;
    }

    public renderSapCode() {
      this.customerService.findAutocompleteCustomersInactive(true)
        .pipe(finalize(() => {
          this.codSapControl.enable();
          this.filteredSapCode = this.codSapControl.valueChanges.pipe(
            startWith(''),
            map(s => s ? this.filterSapCode(s) : this.allCustomers.slice())
          );
        }))
        .subscribe((result: any[]) =>{
            this.allCustomers = result;
        });
      }

    private filterSapCode(value: string | any): {id: number, name: string, selected: boolean, sapCode: string}[] {
      if (typeof value === "string") {
         return this.allCustomers.filter(customer => customer.sapCode.indexOf(value) === 0);
       } else {
         return this.allCustomers.filter(customer => customer.sapCode.indexOf(value.sapCode) === 0);
       }
    }

    displaySapCode(customer:any) {
      if (!customer) {
        return null;
      }
      return customer.sapCode;
    }

  executeSearch() {
    this.search.filters.continueSearch = true;
    this.search.filters.customerId = this.search.filters.customer ? this.search.filters.customer.name : null;
    this.search.filters.sapCode = this.search.filters.customerSapCode ? this.search.filters.customerSapCode.sapCode : null;
 }

  validateDate(filterInitial: any, filterFinal: any, type: any){
    let dateInitial : Date = filterInitial;
    let dateFinal: Date = filterFinal;
    if(dateInitial > dateFinal && dateFinal !== null){
      if(type === 'interrupcao')this.messageService.warning('INV-E065');
      else this.messageService.warning('INV-E066');
    }
  }

  execute(event : any) {
    this.search.hideSpinnerMenu = false;
    if (event.action.action == 'approve_discount') {
      this.approveSelectedDiscount(event.line.id);
    }else if (event.action.action == 'fail_discount') {
      let confirmDelete = false;
      this.showConfirm('Certeza que deseja reprovar o desconto selecionado? Após realizar essa alteração a mesma não poderá ser desfeita.', result=> {
        confirmDelete = (!!result && result.status == 'ok')
        if(confirmDelete) this.disapproveSelectedDiscount (event.line.id)
        this.search.hideSpinnerMenu = true
      });
    }
  }

  approveSelectedDiscount(ticketId: number) {
    this.discountFinanApprService.approveDiscount(ticketId).subscribe((resp) => {
      resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E073');
      this.search.search(true);
    },
      (e) => {
        this.messageService.dealWithError(e);
        this.search.search(true);
      });
      this.search.hideSpinnerMenu = true;
  }

  disapproveSelectedDiscount(ticketId: number) {
    this.search.hideSpinnerMenu = false;
    this.discountFinanApprService.disapproveDiscount(ticketId).subscribe((resp) => {
      resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E074');
      this.search.search(true);
    },
      (e) => {
        this.messageService.dealWithError(e);
        this.search.search(true);
      });
  }

  messageResultArray(value: any) {
    value.forEach(element => {
      this.showMessageSuccess(element);
      this.showMessageError(element);
    });
  }

  showMessageSuccess(element: any) {
    if (element.type === 'SUCCESS') {
      this.messageService.showInlineMessage(Severity.INFO, element.message);
    }
  }

  showMessageError(element: any) {
    if (element.type === 'ERROR') {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }

  approveSelectedDiscounts() {
    const idsTicketDiscount = this.search.selectionList.filter(isProcessed).map(item => item.id);
    if (!this.search.selectionList || !this.search.selectionList.length || idsTicketDiscount.length == 0) {
      this.messageService.error('INV-E023');
    } else {
         this.discountFinanApprService.approveDiscountsGroup(idsTicketDiscount).subscribe((resp) => {
           resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E075');
           this.search.hideSpinnerMenu = true;
           this.search.search(true);
         },
          (e) => {
             this.messageService.dealWithError(e);
             this.search.hideSpinnerMenu = true;
             this.search.search(true);
           },
           () => this.search.hideSpinnerMenu = true);
        }
  }


  openZip() {
    this.search.hideSpinnerMenu = false;
    this.search.hideSpinnerSearch = false;
    this.discountFinanApprService.downloadDiscounts(this.getParamsFilter())
      .subscribe(
        content => {
          BlobUtil.startDownload(
            `DescontosAprovacaoFinanceira_${formatDate(new Date(), 'dd_MM_yyyy', 'pt')}.xlsx`,
            content,
            'application/xlsx'
          );
          this.messageService.success('INV-E068');
          this.search.hideSpinnerSearch = true;
        },
        (e) => {
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
          this.search.hideSpinnerSearch = true;
        },
        () => this.search.hideSpinnerMenu = true);
  }

  getParamsFilter(): { [key: string]: any; } {
    let request: { [key: string]: any; };
    request = {
      financialApproval: this.search.filters.financialApproval,
      designation: this.search.filters.designation,
      idticketNV3: this.search.filters.idticketNV3,
      initialInterruptionPeriod: this.search.filters.initialInterruptionPeriod,
      finalInterruptionPeriod: this.search.filters.finalInterruptionPeriod,
      initialPeriodOfSICOPImport: this.search.filters.initialPeriodOfSICOPImport,
      finalPeriodOfSICOPImport: this.search.filters.finalPeriodOfSICOPImport,
      marketSegmentsId: this.search.filters.marketSegmentsId,
      sapCode: this.search.filters.sapCode,
      customerId: this.search.filters.customerId,
      discountAppliedMc: this.search.filters.discountAppliedMc
    }
    return request;
  }

  disapproveSelectedDiscounts(){
    const idsTicketDiscount = this.search.selectionList.filter(isProcessed).map(item => item.id);
    if (!this.search.selectionList || !this.search.selectionList.length || idsTicketDiscount.length == 0) {
      this.messageService.error('INV-E023');
    } else {
      this.search.hideSpinnerMenu = false;
      let confirmDelete = false;

      this.showConfirm('Certeza que deseja reprovar os descontos selecionados? Após realizar essa alteração a mesma não poderá ser desfeita.', result => {
        confirmDelete = (!!result && result.status == 'ok')
        if (confirmDelete) {
          this.discountFinanApprService.disapproveDiscountsGroup(idsTicketDiscount).subscribe((resp) => {
            resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E076');
            this.search.search(true);
          },
          (e) => {
              this.messageService.dealWithError(e);
              this.search.search(true);
            });
        }
        this.search.hideSpinnerMenu = true
      });
    }
  }

  selectionCondition(item: any) {
    if(item.financialApproval != PENDING){
      return false;
    }else{
      return true;
    }
  }

  showConfirm(msg: string, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(ConfirmComponent, { data: { msg: msg }, width: '415px'});
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      action(result);
    });
  }


  executeClear(previousFilters:any) {
    this.marketSegmentControl.reset();
    this.discountControl.reset();
  }
}

function hintCondition(element: any) {
  return !!element.buildHelp.length && element.financialApproval !== PENDING;
}

function isProcessed(value) {
  return value.financialApproval === PENDING;
}

function currencyConv(value: any) {
  return formatCurrency(value, 'pt-br', 'R$');
}
