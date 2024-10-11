import { Component, Inject, Input } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-confirm',
    templateUrl: 'confirm.component.html',
    styleUrls : ['./confirm.component.scss']
})
export class ConfirmComponent {

    @Input()
    msg: string;

    constructor(
        public dialogRef: MatDialogRef<ConfirmComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    confirm() {
        this.dialogRef.close({status:'ok'})
    }

    close(): void {
        this.dialogRef.close({status:'cancel'});
    }

}
