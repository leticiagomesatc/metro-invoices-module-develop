import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { InvoiceCalcService } from '../../../services/invoice-calc.service';
import { MessageService } from '../../../../shared/communication/message.service';

@Component({
  selector: 'app-invoice-calc-reopen',
  templateUrl: 'invoice-calc-reopen.component.html',
  styleUrls: ['./invoice-calc-reopen.component.scss']
})
export class InvoiceCalcReopenComponent {
  form: FormGroup;
  cmpControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<InvoiceCalcReopenComponent>,
    private formBuilder: FormBuilder,
    private invoiceCalcService: InvoiceCalcService,
    private messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.cmpControl = new FormControl();
    this.form = this.formBuilder.group({
      billingGroupName: [''],
      period: this.cmpControl
    });
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

  confirm(event: MouseEvent) {
    const billingGroupName = this.form.value.billingGroupName ? this.form.value.billingGroupName.trim().toLowerCase() : '';
    const billingGroupNameReopen = this.data.customerName ? this.data.customerName.trim().toLowerCase() : '';
    const selectedPeriod: Date = this.form.value.period;

    if (!billingGroupName || !this.form.value.period) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      event.preventDefault();
      return;
    }

    const dataPeriod: Date = this.extractMonthAndYearFromDateStr(this.data.period);
    const selectedPeriodFormatted = new Date(selectedPeriod.getFullYear(), selectedPeriod.getMonth(), 1);

    if (billingGroupName === billingGroupNameReopen &&
      selectedPeriodFormatted.getTime() === dataPeriod.getTime()) {
      this.invoiceCalcService.check(this.data.invoiceId)
        .subscribe(response => {
            this.dialogRef.close('reopen');
            this.messageService.success('INV-E080');
          });
    } else {
      event.preventDefault();
      alert("Os dados informados da memória de cálculo não correspondem à memória que deseja reabrir. Tente novamente.");
    }
  }

  extractMonthAndYearFromDateStr(dateStr: string): Date {
    const dateParts = dateStr.split('/');
    const month = parseInt(dateParts[0], 10) - 1; // subtraímos 1 porque os meses em JavaScript são indexados a partir de 0
    const year = parseInt(dateParts[1], 10);
    return new Date(year, month);
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    this.dialogRef.close();
  }
}
