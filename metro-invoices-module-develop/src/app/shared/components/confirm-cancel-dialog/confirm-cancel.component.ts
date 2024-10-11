import { Component, Inject, Input, ViewChild } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { InputFileComponent } from 'ngx-input-file';
import { MessageService } from '../../communication/message.service';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { FwValidateService } from '../../controllers/fw/fw-validate/fw-validate.service';

@Component({
    selector: 'app-confirm-cancel',
    templateUrl: 'confirm-cancel.component.html',
    styleUrls : ['./confirm-cancel.component.scss']
})
export class ConfirmCancelComponent {

    @ViewChild('inputComponent') inputComponent: InputFileComponent

    form : FormGroup;

    fileNameString:string;
    fileSize:number;

    inputFileRejectedReason: any = {
        badFile: 0,
        limitReached: 1,
        sizeReached: 2
    }

    constructor(
        public dialogRef: MatDialogRef<ConfirmCancelComponent>,
        private messageService: MessageService,
        private builder: FormBuilder,
        public validate : FwValidateService,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit() {
        this.form = this.builder.group({
            justification : [null, Validators.required],
            attachments : [[],]
        });
    }
    confirm() {
        if(this.form.status == 'VALID' && (this.data.outOfPeriod == false ||  (this.data.outOfPeriod == true && this.form.get('attachments').value.length > 0))) {
            this.dialogRef.close(this.createForm())
        }else {
            if(this.form.get('attachments').value.length == 0 && this.data.outOfPeriod == true){
                 this.messageService.error('INV-E036');
            }
        }
    }
    close(): void {
        this.dialogRef.close({status:'cancel'});
    }

    createForm() {
        return {status:'ok', files: this.form.get('attachments').value, justificationId: this.form.get('justification').value.id};
    }

    invokeUploadModal() {
        this.inputComponent.fileInput.nativeElement.click();
    }

    acceptFile(file) {
        this.fileSize = this.form.get('attachments').value.length + 1;
        this.fileNameString = this.form.get('attachments').value.map(file=> file.file.name).join(';\r')
        this.fileNameString = this.fileNameString ? this.fileNameString.concat(';\r').concat(file.file.name) : file.file.name
    }
    
    removeAllAttachments() {
        this.fileSize = undefined
        this.fileNameString = undefined
        while(this.form.get('attachments').value.length > 0) this.inputComponent.onDeleteFile(0)
    }
    
    rejectFile(problem) {
        switch(problem.reason) {
            case this.inputFileRejectedReason.badFile:
                this.messageService.error('INV-EF01'); break;
            case this.inputFileRejectedReason.limitReached:
                this.messageService.error('INV-EF02'); break;
            case this.inputFileRejectedReason.sizeReached:
                this.messageService.error('INV-EF03'); break;
        }
    }

}