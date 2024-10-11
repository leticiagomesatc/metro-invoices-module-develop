import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TicketService } from 'src/app/invoice/services/ticket-discount.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { TicketServiceCalc } from 'src/app/invoice/services/ticket-discount-calc.service';

@Component({
  selector: 'app-ticket-discount-calc-edit',
  templateUrl: './ticket-discount-calc-edit.component.html',
  styleUrls: ['./ticket-discount-calc-edit.component.scss'],
})
export class TicketDiscountCalcEditComponent {

   constructor(
       public validate: FwValidateService,
       private formBuilder: FormBuilder,
       private messageService: MessageService,
       private ticketCalcService: TicketServiceCalc,
       private ticketService: TicketService,
       public dialogRef: MatDialogRef<TicketDiscountCalcEditComponent>,
       @Inject(MAT_DIALOG_DATA) public data: any
   ) { }

   form: FormGroup;
   hideSpinner:boolean=true;
   designation:String;
   time:String;

   ngOnInit() {
       this.time = this.data.ticket.attributableTime;
       this.createForm()
   }  

   createForm(){
       this.form = this.formBuilder.group({
           time: [this.data.ticket.attributableTime, Validators.required],
       });
   }

   edit() {
     var hs = this.data.ticket.attributableTime.replace(":", "").replace(":", "");
     var hora = hs.substring(0,2), min = hs.substring(2,4), seg = hs.substring(4,6);
     if(this.form.valid && min <= 59 && seg <= 59){
       if(!this.data.ticket.attributableTime.includes(":")){
         this.data.ticket.attributableTime = hora + ":" + min + ":" + seg;
       }
       this.hideSpinner = false;
         this.ticketCalcService.editTicket(this.data.ticket).subscribe(
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




