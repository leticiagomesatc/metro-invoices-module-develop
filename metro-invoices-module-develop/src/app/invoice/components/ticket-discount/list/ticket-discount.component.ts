import { formatDate } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { TicketService } from 'src/app/invoice/services/ticket-discount.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { userRoles } from 'src/app/shared/util/user-roles';
import { TicketDiscountEditComponent } from '../edit/ticket-discount-edit.component';

const PROCESSADO_ERRO = 'Processado com erro';
const PROCESSERRO = '6';

@Component({
  selector: 'app-ticket-discount',
  templateUrl: './ticket-discount.component.html',
  styleUrls: ['./ticket-discount.component.scss']
})
export class TicketDiscountComponent implements OnInit{

    cols = [
        { title: 'Ticket', prop: 'ticketNV3' },
        { title: 'Segmento', prop: 'segment' },
        { title: 'Cód. Cliente', prop: 'customerSapCode' },
        { title: 'Grupo de Faturamento', prop: 'customerName' },
        { title: 'Designação NV3', prop: 'designationNV3' },
        { title: 'Tempo Imputável', prop: 'attributableTime' },
        { title: 'Data interrupção', prop: 'interruptionDate' },
        { title: 'Designação SICOP', prop: 'designationSICOP' },
        { title: 'Status Circuito', prop: 'statusCircuit' },
        { title: 'Status Processamento', prop: 'statusProcessing' },
        { title: 'Mensagem Erro', prop: 'errorMessage' },
        { title: 'SLA OK', prop: 'slaOk' }
      ];

      
       actions = [
         {
           action: 'actions',
           subActions: [
             {
               title: 'Editar item',
               action: 'edit_item',
               role: userRoles.ticketsDiscountEditar,
               icon: { name: 'edit' }
             },
             {
               title: 'Reprocessar Desconto',
               action: 'reprocess_discount',
               role: userRoles.ticketsDiscountExecutar,
               icon: { name: 'done' }
             },
             {
              title: 'Desprezar Item',
              action: 'despise_item',
              role: userRoles.ticketsDiscountExecutar,
              icon: { name: 'cancel' }
             }
           ]
         }
       ];

  @ViewChild('search') search: any;

  dialogRef: MatDialogRef<any>;
  userRoles = userRoles;
  form : FormGroup;
  requiredRolesToView: string = userRoles.ticketsDiscount;
  
  allCustomers: { name: string, id: number, selected: boolean, sapCode: string }[] = [];
  filteredCustomers: Observable<{ name: string, id: number, selected: boolean, sapCode: string}[]>;
  customerControl = new FormControl();

  filteredSapCode: Observable<{ name: string, id: number, selected: boolean, sapCode: string}[]>;
  codSapControl = new FormControl();

  marketSegments: Observable<any[]>
  marketSegmentControl = new FormControl();

  allDesignationSicop:string [] = [];
  filteredDesignationSicop: Observable<any[]>;
  designationControlSicop = new FormControl();
  
  allDesignationNv3:string [] = [];
  filteredDesignationNv3: Observable<any[]>;
  designationControlNv3 = new FormControl();

  edit: boolean = false;

  constructor(
    private ticketService:TicketService,
    public authService: AuthService,
    private dialog: MatDialog,
    private customerService: CustomerService,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = true;
    this.renderCustomers();
    this.renderSapCode();
    this.renderDesignationNv3();
    this.renderDesignationSicop();
    this.marketSegments = this.ticketService.getMarketSegmentFiltered();
    this.search.filters.statusProcessing = PROCESSERRO;
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

    public renderDesignationNv3() {
      this.ticketService.getDesignationFilteredNv3()
        .pipe(finalize(() => {
          this.designationControlNv3.enable();
          this.filteredDesignationNv3 = this.designationControlNv3.valueChanges.pipe(
            startWith(''),
            map(s => s ? this.filterDesignationNv3(s) : this.allDesignationNv3.slice())
          );
        }))
        .subscribe((result: any[]) =>{
            this.allDesignationNv3 = result;
        });
    }

    private filterDesignationNv3(value: string | any): {} [] {
      if (typeof value === "string") {
        const filterValue = value.toLowerCase();
        return this.allDesignationNv3.filter(designation => designation.toLowerCase().indexOf(filterValue) === 0);
      } else {
         return this.allDesignationNv3.filter(designation => designation.toLowerCase().indexOf(value.name) === 0);
      }
    }

    public renderDesignationSicop() {
      this.ticketService.getDesignationFilteredSicop()
        .pipe(finalize(() => {
          this.designationControlSicop.enable();
          this.filteredDesignationSicop = this.designationControlSicop.valueChanges.pipe(
            startWith(''),
            map(s => s ? this.filterDesignationSicop(s) : this.allDesignationSicop.slice())
          );
        }))
        .subscribe((result: any[]) =>{
            this.allDesignationSicop = result;
        });
    }

  
    private filterDesignationSicop(value: string | any): {} [] {
      if (typeof value === "string") {
        const filterValue = value.toLowerCase();
        return this.allDesignationSicop.filter(designation => designation.toLowerCase().indexOf(filterValue) === 0);
      } else {
         return this.allDesignationSicop.filter(designation => designation.toLowerCase().indexOf(value.name) === 0);
      }
    }

  executeSearch() {
    this.search.filters.continueSearch = true;
    this.search.filters.customerId = this.search.filters.customer ? this.search.filters.customer.name : null;
    this.search.filters.sapCode = this.search.filters.customerSapCode ? this.search.filters.customerSapCode.sapCode : null;
    this.search.filters.slaOkTrue = this.search.filters.slaOkTrue ? this.search.filters.slaOkTrue : false; 
    this.search.filters.slaOkFalse = this.search.filters.slaOkFalse ? this.search.filters.slaOkFalse : false;
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
    if (event.action.action == 'reprocess_discount') {
      this.reprocessUniqueDiscountTicket(event.line.id);
    }else if (event.action.action == 'edit_item') {
      this.showEdit(event.line);
    }else if (event.action.action == 'despise_item') {
      let confirmDelete = false;
      this.showConfirm('Certeza que deseja desprezar o item selecionado? Após realizar essa alteração a mesma não podera ser desfeita.', result=> {
        confirmDelete = (!!result && result.status == 'ok')
        if(confirmDelete) this.desprezarTicket (event.line.id)
        this.search.hideSpinnerMenu = true    
      });  
    }
  }

  reprocessUniqueDiscountTicket(ticketId: number) {
    this.ticketService.reprocessDiscount(ticketId).subscribe((resp) => {
      resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E062');
      this.search.search(true);
    },
      (e) => {
        this.messageService.dealWithError(e);
        this.search.search(true);
      });
      this.search.hideSpinnerMenu = true;
  }

  desprezarTicket(ticketId: number) {
    this.search.hideSpinnerMenu = false;
    this.ticketService.despiseDiscount(ticketId).subscribe((resp) => {
      resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E063');
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

  reprocessTicketsDiscounts() {
 const idsTicketDiscount = this.search.selectionList.filter(isProcessedWithError).map(item => item.id);
    if (!this.search.selectionList || !this.search.selectionList.length || idsTicketDiscount.length == 0) {
      this.messageService.error('INV-E023');
    } else {
        this.ticketService.reprocessDiscounts(idsTicketDiscount).subscribe((resp) => {
          resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E062');
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
    this.ticketService.downloadDiscounts(this.getParamsFilter())
      .subscribe(
        content => {
          BlobUtil.startDownload(
            `TicketsProcessados_${formatDate(new Date(), 'dd_MM_yyyy', 'pt')}.xlsx`,
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
      statusProcessing: this.search.filters.statusProcessing,
      designationNV3: this.search.filters.designationNV3,
      designationSICOP: this.search.filters.designationSICOP,
      initialInterruptionPeriod: this.search.filters.initialInterruptionPeriod,
      finalInterruptionPeriod: this.search.filters.finalInterruptionPeriod,
      initialPeriodOfSICOPImport: this.search.filters.initialPeriodOfSICOPImport,
      finalPeriodOfSICOPImport: this.search.filters.finalPeriodOfSICOPImport,
      errorMessage: this.search.filters.errorMessage,
      idticketNV3: this.search.filters.idticketNV3,
      marketSegmentsId: this.search.filters.marketSegmentsId,
      sapCode: this.search.filters.sapCode,
      customerId: this.search.filters.customerId,
      slaOkTrue: this.search.filters.slaOkTrue,
      slaOkFalse: this.search.filters.slaOkFalse
    }
    return request;
  }

  despiseDiscounts(){
    const idsTicketDiscount = this.search.selectionList.filter(isProcessedWithError).map(item => item.id);
    if (!this.search.selectionList || !this.search.selectionList.length || idsTicketDiscount.length == 0) {
      this.messageService.error('INV-E023');
    } else {
      this.search.hideSpinnerMenu = false;
      let confirmDelete = false;

      this.showConfirm('Certeza que deseja desprezar os itens selecionados? Após realizar essa alteração a mesma não podera ser desfeita.', result => {
        confirmDelete = (!!result && result.status == 'ok')
        if (confirmDelete) {
          this.ticketService.despiseDiscounts(idsTicketDiscount).subscribe((resp) => {
            resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E064');
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
    if(item.statusProcessing != PROCESSADO_ERRO){
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

  showEdit(ticket: any) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(TicketDiscountEditComponent, {data: { ticket: ticket, search: this.search}, width:'800px', height:'600px'});
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      this.search.hideSpinnerMenu = true;
    });
  }

  executeClear(previousFilters:any) {
    this.marketSegmentControl.reset();
  }  
}

function isProcessedWithError(value) {
  return value.statusProcessing === PROCESSADO_ERRO;
}