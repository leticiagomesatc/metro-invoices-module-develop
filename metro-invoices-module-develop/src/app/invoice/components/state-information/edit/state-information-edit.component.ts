import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TicketService } from 'src/app/invoice/services/ticket-discount.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { TicketServiceCalc } from 'src/app/invoice/services/ticket-discount-calc.service';
import { StateInformationService } from 'src/app/invoice/services/state-information.service';

@Component({
  selector: 'app-state-information-edit-edit',
  templateUrl: './state-information-edit.component.html',
  styleUrls: ['./state-information-edit.component.scss'],
})
export class StateInformationEditComponent {

   constructor(
       public validate: FwValidateService,
       private formBuilder: FormBuilder,
       private messageService: MessageService,
       private stateInformationService: StateInformationService,
       public dialogRef: MatDialogRef<StateInformationEditComponent>,
       @Inject(MAT_DIALOG_DATA) public data: any
   ) { }

   form: FormGroup;
   hideSpinner:boolean=true;
   icms:string;
   pis: string;
   cofins: string;
   other: string;
   stateId: string;

  ngOnInit() {
       this.icms = this.data.aliq.icms;
       this.pis = this.data.aliq.pis;
       this.cofins = this.data.aliq.cofins;
       this.other = this.data.aliq.other;
       this.stateId = this.data.aliq.stateId;
       this.createForm()
  }  

  createForm(){
       this.form = this.formBuilder.group({
          icms: [this.data.aliq.icms, Validators.required],
          pis: [this.data.aliq.pis, Validators.required],
          cofins: [this.data.aliq.cofins, Validators.required],
          other: [this.data.aliq.other, Validators.required],
          stateId: [this.data.aliq.stateId, Validators.required],
       });
   }

  validateDate(input: any){
      let extractedFte = input.replace("^[+-]?((\d+|\d{1,3}(\.\d{3})+)(\,\d*)?|\,\d+)$ ^[-+]?([0-9]*\,[0-9]+|[0-9]+)$", '')
      this.data.aliq.icms = extractedFte;
  }

  edit() {
    this.stateInformationService.updateAliquots(this.form.value).subscribe();
    this.messageService.success('INV-E078');
    this.dialogRef.close({ status: 'ok' });
   
  }

  close(): void {
    this.data.aliq.icms = this.icms
    this.pis = this.data.aliq.pis = this.pis
    this.data.aliq.cofins = this.cofins
    this.data.aliq.other = this.other
    this.dialogRef.close({ status: 'cancel' });
  }

  emailFormControl = new FormControl( '' , [Validators.required, Validators.email]);

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