import { Component, ViewChild, Inject, Input, EventEmitter, Output } from '@angular/core';
import {  FormGroup, FormBuilder, Validators,  } from '@angular/forms';
import {  formatCurrency } from '@angular/common';
import {  MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DebitNoteService } from 'src/app/invoice/services/debit-note.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';



const LOCALE = 'pt-BR';

@Component({
    selector: 'app-debit-note-create-issue',
    templateUrl: 'debit-note-new-issue.component.html',
    styleUrls: ['debit-note-new-issue.component.scss'],
})
export class DebitNoteCreateIssueComponent {

    cols = [

        { title: 'Código do Cliente', prop: 'customer.sapCode' },
        { title: 'Grupo de Faturamento', prop: 'customer.name' },
        { title: 'Produto', prop: 'product.name' },
        { title: 'Tipo da Nota', prop: 'type', converter: debitNoteTypeConv },
        { title: 'Valor mensal liquido', prop: 'monthlyAmout', converter: currencyConv },

    ];

    @ViewChild('search') search: any;
   
    constructor(
        public validate: FwValidateService,
        private formBuilder: FormBuilder,
        private messageService: MessageService,
        public dialogRef: MatDialogRef<DebitNoteCreateIssueComponent>,
        private debitNoteService: DebitNoteService,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    form: FormGroup;

    hideSpinner:boolean=true;

    ngOnInit() {
                  
        this.search.filters.active = true;
        this.search.filters.onlyCurrent = true;
        this.form = this.formBuilder.group({
            templateId: [null],
            period: [null, Validators.required],
        
        });

    }

    chosenYearHandler(normalizedYear: any) {
        let ctrlValue = this.form.get('period').value;
        if (!ctrlValue) {
            ctrlValue = new Date();

        }
        ctrlValue.setYear(normalizedYear.getFullYear());
        this.form.get('period').setValue(ctrlValue);
    }

    chosenMonthHandler(normalizedMonth: any, datepicker: any) {
        const ctrlValue = this.form.get('period').value;
        ctrlValue.setMonth(normalizedMonth.getMonth());
        ctrlValue.setDate(1);
        this.form.get('period').setValue(ctrlValue);
        datepicker.close();
    }

    issue() {
        if (!this.search.selectionList.length) {
            this.messageService.error('INV-E023');

        } else {
            if (this.form.invalid) {
                this.messageService.error('INV-E025');
            } else {
                this.prepareToIssue()
                this.issueDebitNote();
            }
        }
    }

    issueDebitNote() {
        let value = this.form.get('period').value;

        let request = this.search.selectionList.map(item => createTemplateSelectionElement(item, value))
        this.debitNoteService.issueNote(request)
            .subscribe(
                () => this.dealWithSuccess(),
                (e) => this.dealWithError(e)
            )
    }

    close(): void {

        this.dialogRef.close({ status: 'cancel' });
    }

    withFilter(event: any){
        this.search.filters.active = true;
        this.search.filters.onlyCurrent = true;
    }

    prepareToIssue() {
        this.hideSpinner = false;
    }

    dealWithSuccess() {
        this.messageService.success('INV-S002');
        this.dialogRef.close({ status: 'ok' });
        this.prepareToReleaseFile()
      }
    
    dealWithError(e) {
        this.messageService.dealWithError(e);
        this.prepareToReleaseFile();
    }

    prepareToReleaseFile() {
        this.hideSpinner = true;
    }

}
function createTemplateSelectionElement(element: any, value) {
    return {
        templateId: element.id,
        period: value

    }
}

function debitNoteTypeConv(params: string) {
    switch (params) {
        case 'ACCOUNTS_MEETING': return 'Encontro de contas';
        case 'PAYMENT': return 'Pagamento';
        case 'PREPAYMENT': return 'Pagamento Antecipado';
        case 'FINE': return 'Multa';
        default: return 'Indefinida';
    }
}

function currencyConv(value: any) {
    return formatCurrency(value, LOCALE, 'R$');
}

