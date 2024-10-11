import { Component, Inject, ChangeDetectorRef } from '@angular/core';

import { FormGroup, FormBuilder, Validators, ValidatorFn, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource } from '@angular/material';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { ValidatorsUtil } from '../../util/validators.util';
import { MessageService } from '../../communication/message.service';

@Component({
    selector: 'app-billet-email',
    templateUrl: 'billet-email.component.html',
    styleUrls : ['./billet-email.component.scss']
})
export class BilletEmailComponent {

    emailList = new MatTableDataSource<any>();
    emailAddList = new MatTableDataSource<any>();
    
    emailColumns: string[] = ['email']

    constructor(
        public validate : FwValidateService,
        private formBuilder: FormBuilder,
        private messageService : MessageService,
        private dialogRef: MatDialogRef<BilletEmailComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    form: FormGroup;

    title: string;

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: [null, [Validators.required, ValidatorsUtil.email]]
        });
        this.data.emailList.forEach(item=>{
            if(item.email !=null){
                this.emailList.data.push(item)
                this.title = this.data.title;
            }
        });
        
    }

    addEmail(){
        if (this.form.dirty && this.form.valid) {
            this.emailList.data.push({email: this.form.controls.email.value})
            this.emailList._updateChangeSubscription()
            this.emailAddList.data.push({email: this.form.controls.email.value})
            this.emailAddList._updateChangeSubscription()
        }
    }

    sendEmails() {
        if(this.emailList.data.length != 0){
            this.dialogRef.close({emails : this.emailList.data.map(item=>item.email), invoiceId : this.data.id, emailsAdd : this.emailAddList.data.map(item=>item.email)});
        }else{
            this.messageService.error('INV-E019');
        }
        
    }

    close(): void {
        this.dialogRef.close();
    }

}
