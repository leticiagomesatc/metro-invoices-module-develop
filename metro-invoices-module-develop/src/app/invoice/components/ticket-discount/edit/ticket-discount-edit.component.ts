 import { Component, Inject, ViewChild } from '@angular/core';
 import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
 import * as _ from 'lodash';
 import { MessageService } from 'src/app/shared/communication/message.service';
 import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
 import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TicketService } from 'src/app/invoice/services/ticket-discount.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';

@Component({
   selector: 'app-ticket-discount-edit',
   templateUrl: './ticket-discount-edit.component.html',
   styleUrls: ['./ticket-discount-edit.component.scss'],
   
 })

 export class TicketDiscountEditComponent {

  @ViewChild('search') search: any;

  allDesignationSicop:string [] = [];

  filteredDesignationSicop: Observable<any[]>;

  designationControlSicop = new FormControl();

  cols = [
    { title: 'ID CIRCUITO', prop: 'id' },
    { title: 'DESIGNAÇÃO', prop: 'designation' },
    { title: 'DATA ATIVAÇÃO', prop: 'activationDate' },
    { title: 'DATA DESATIVAÇÃO', prop: 'deactivationDate' },
    { title: 'STATUS CIRCUITO', prop: 'circuitCode' },
  ];

  actions = [
    {
      action: 'actions',

      subActions: [
        {
          title: 'Selecionar Circuito',

          action: 'selecionar',

          icon: { name: 'done' }

        }
      ]
    }
  ];

    constructor(
        public validate: FwValidateService,
        private formBuilder: FormBuilder,
        private messageService: MessageService,
        private ticketService: TicketService,
        public dialogRef: MatDialogRef<TicketDiscountEditComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    form: FormGroup;
    hideSpinner:boolean=true;
    designation:String;
    time:String;
    idSicop:number;

    ngOnInit() {
        this.designation = this.data.ticket.designationNV3;
        this.time = this.data.ticket.attributableTime;
        this.recuperarIdSicop(this.data.ticket.ticketNV3)
        this.createForm();
        this.renderDesignationSicop();
        this.search.filters.designationSICOP= this.data.ticket.designationNV3;
    }  

    recuperarIdSicop(ticket : any){
      this.ticketService.retrieveIdSicop(ticket).subscribe((resp) => {
      this.data.ticket.idSicop = resp
    });
    }

    createForm(){
        this.form = this.formBuilder.group({
            desgNV3: [{value:this.data.ticket.designationNV3, disabled:true}, Validators.required],
            time: [this.data.ticket.attributableTime, Validators.required],
            idSicop: [{value:this.data.ticket.idSicop, disabled:true}],
        });
    }

public execute(event : any){

  if(event.action.action == 'selecionar'){
    this.data.ticket.idSicop = event.line.id;
    this.data.ticket.designationNV3 = event.line.designation;
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


    edit() {
      var hs = this.data.ticket.attributableTime.replace(":", "").replace(":", "");
      var hora = hs.substring(0,2), min = hs.substring(2,4), seg = hs.substring(4,6);
      if(this.form.valid && min <= 59 && seg <= 59){
        if(!this.data.ticket.attributableTime.includes(":")){
          this.data.ticket.attributableTime = hora + ":" + min + ":" + seg;
        }
        this.hideSpinner = false;
          this.ticketService.editTicket(this.data.ticket).subscribe(
              () => {
                this.reprocessUniqueDiscountTicket(this.data.ticket.id);
                this.data.search.search(true);
              },
              (e) => {
                this.messageService.dealWithError(e);
              }
            );
          this.dialogRef.close({ status: 'ok' });
      }else{
        this.messageService.error('INV-E067');
      }
    }

    reprocessUniqueDiscountTicket(ticketId: number) {
      this.ticketService.reprocessDiscount(ticketId).subscribe((resp) => {
        resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E062');
        this.data.search.search(true);
      },
        (e) => {
          this.messageService.dealWithError(e);
        });
    }

    close(): void {
        this.data.ticket.designationNV3 = this.designation;
        this.data.ticket.attributableTime = this.time;
        this.dialogRef.close({ status: 'cancel' });
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
}




