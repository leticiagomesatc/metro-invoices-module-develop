import { Component, Inject, ViewChild, ElementRef, OnInit, Renderer2, EventEmitter } from '@angular/core';
import { InputFile, InputFileComponent } from 'ngx-input-file';
import { FormGroup, FormBuilder, Validators, ValidatorFn, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource } from '@angular/material';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { ValidatorsUtil } from '../../util/validators.util';
import { MessageService } from '../../communication/message.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { toDate } from '@angular/common/src/i18n/format_date';
import { BalanceService } from 'src/app/invoice/services/balance.service';
import { formatCurrency } from '@angular/common';




@Component({
  selector: 'app-billet-duplicate-dialog',
  templateUrl: './billet-duplicate.component.html',
  styleUrls: ['./billet-duplicate.component.scss']
})
export class BilletDuplicateComponent {

  displayedColumns: string[] = []

  balances = new MatTableDataSource<any>();

  addCols: any[] = ['isBalance', 'operationType'];

  cols = [
    { title: 'Boleto',            prop: 'noteNumber' },
    { title: 'Saldo',             prop: 'balanceValueOperationalType' },
    { title: 'Saldo a utilizar',  prop: 'balanceValue', input: { name:'downingValue', mask: 'dot_separator.2', prefix: renderCurrencyPrefix, prefixParam: 'operationType' } } 
  ]

  finalBalance: number = 0

  appliedBalances: any[] = []

  hasPendingBalance: boolean

  hasFineOrInterest: boolean // ultimo boleto tem juros ou multa?

  constructor(
    
    public validate : FwValidateService,
    private builder : FormBuilder, 
    private messageService : MessageService,
    private dialogRef: MatDialogRef<BilletDuplicateComponent>,
    private balanceService: BalanceService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  form : FormGroup;
  minDate : Date;
 
  ngOnInit() {    
    
    this.form = this.builder.group({
      dueDate : [null, Validators.required],
      sendEmail : [false],
      keepFineAndInterest : [null],
      interestApplication : [null],
      interestRate : [null, Validators.required],
      interestPercentage : [null, Validators.required],
      fineApplication : [null],
      fineRate : [null, [Validators.required]],
      finePercentage : [null, [Validators.required]]
    });

    this.createSideValidation('keepFineAndInterest')
    this.createValidation('interest');
    this.createValidation('fine');   

    this.minDate = moment(new Date()).add(1, 'days').toDate();

    this.configDatasource();
  }

  configDatasource() {
    this.displayedColumns = this.displayedColumns.concat(_(this.cols).map(col=>col.prop).value())
    
    this.data.filter = {
      customerNationalCompanyNumber: this.data.customerNationalCompanyNumber,
      noteType: this.data.source,
      noteNumber: this.data.noteNumber,
    }

    this.balanceService.checkLastBilletHasFineOrInterest(this.data.filter.noteNumber, this.data.filter.noteType)
      .subscribe(
        (p) => {
          this.hasFineOrInterest = <boolean> p;
        },
        (e) => this.messageService.dealWithError(e));

    this.balanceService.confirmPendingBalance(this.data.filter).subscribe(
      (p) => {
        this.hasPendingBalance = p;
        if(p) {
          this.balanceService.searchPendingAndInNeedOfBalanceBillets(this.data.filter)
          .subscribe(
            (p) => this.balances.data = p.content,
            (e) => this.messageService.dealWithError(e)
          )
        }
      },
      (e) => this.messageService.dealWithError(e)
    )
    
  }

  generateDuplicateBillet() {  
     if(this.form.status == 'VALID'){
       let okApplied = true;
       this.appliedBalances.forEach(item => {
         if(Number(item.initialValue) < Number(item.value)) {
           okApplied = false
         }
       });
       if(okApplied) {       
        this.dialogRef.close(
          { 
            dueDate: this.form.value.dueDate, 
            sendEmail: this.form.value.sendEmail, 
            keepFineAndInterest : this.form.value.keepFineAndInterest,
            interestApplication: this.form.value.interestApplication, 
            interestRate: this.form.value.interestRate,
            interestPercentage: this.isNumber(this.form.value.interestPercentage) ? +this.form.value.interestPercentage.toString().replace(',', '.') : null, 
            fineApplication: this.form.value.fineApplication, 
            fineRate: this.form.value.fineRate, 
            finePercentage: this.isNumber(this.form.value.finePercentage) ? +this.form.value.finePercentage.toString().replace(',', '.') : null, 
            finalBalance: this.finalBalance,
            appliedBalances: this.appliedBalances});
       } else {
        this.messageService.error('INV-E039');
       }

          
     }
  }
  isNumber(value: any): Boolean {
    if(!value) {
      return false;
    }
    let arr = Array.from(value);    
    if (arr) {        
      let isnum = [];      
      arr.forEach(a => { 
        const num = a;
        let num2 = +num;       
        if(typeof num2 === 'number') {
          isnum.push(num2);
        }
      });
      const arrFinal = isnum.filter(n => n > 0);
      return arrFinal.length > 0;     
    } else {
      return false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  createSideValidation(name: string) {
    this.form.get(name).valueChanges.subscribe(evento=>{

      let list: string[] = ['interest', 'fine']

      for (let type of list) {
        const check = this.form.get(type + 'Application')

        check.enable()

        if(evento) {
          check.setValue(false);
          check.disable()
        }
      }
    });
  }

  createValidation(name: string) {
    if (!this.form.get(name+'Rate').value) {
      this.form.get(name+'Rate').disable();
    }

    if (!this.form.get(name+'Percentage').value) {    
      this.form.get(name+'Percentage').disable();
    }    
    this.form.get(name+'Application').valueChanges.subscribe(evento=>{      
      
      const rate = this.form.get(name+'Rate')
      const percentage = this.form.get(name+'Percentage')

      rate.setValidators(null);
      rate.disable()
      percentage.setValidators(null);
      percentage.disable()     

      if(evento) {
        rate.setValidators([Validators.required]);
        rate.enable()
        percentage.setValidators([Validators.required]);
        percentage.enable()
      }
      this.updateValuesFineInterest(name+'Application', !evento);

      rate.updateValueAndValidity();
      percentage.updateValueAndValidity();
      
    });
  }
  
  updateValuesFineInterest(application: String, nullable: Boolean) {
    switch(application) { 
      case 'interestApplication': { 
         this.updateValuesInterest(nullable); 
         break; 
      } 
      case 'fineApplication': { 
         this.updateValuesFine(nullable);
         break; 
      }
   } 
  }
  updateValuesFine(nullable: Boolean) {
    let finePercentageFinal = null;
    if (!nullable && this.data.fineRateType && this.data.fineRatePct && +this.data.fineRatePct > 0.00) {
      finePercentageFinal = this.data.fineRatePct.toString().replace('.', ',');
      if (finePercentageFinal.indexOf(',') === -1) {
        finePercentageFinal = finePercentageFinal.concat(',00');
      }  
      this.form.get('fineRate').setValue(this.data.fineRateType);
      this.form.get('finePercentage').setValue(finePercentageFinal);
    } else {
      this.form.get('fineRate').setValue(null);
      this.form.get('finePercentage').setValue(null);
    }
  }

  updateValuesInterest(nullable: Boolean) {
    let interestPercentageFinal = null;    
    if (!nullable && this.data.interestRateType && this.data.interestRatePct && +this.data.interestRatePct > 0.00) {      
      interestPercentageFinal = this.data.interestRatePct.toString().replace('.', ',');  
      if (interestPercentageFinal.indexOf(',') === -1) {       
        interestPercentageFinal = interestPercentageFinal.concat(',00');        
       }
       this.form.get('interestRate').setValue(this.data.interestRateType);
       this.form.get('interestPercentage').setValue(interestPercentageFinal);
    } else {
      this.form.get('interestRate').setValue(null);
      this.form.get('interestPercentage').setValue(null);
    }    
  }



  calcFinalBalance(element: any, event: any) {
    const initialValue = element.balanceValue;
    element.balanceValue = Number(event.target.value.split('.').join('').replace(',', '.'));
    const balance = this.appliedBalances.filter(bl=>bl.billetId == element.billetId)
    if(balance.length == 0) this.appliedBalances.push({initialValue: initialValue, value:element.balanceValue, operationType: element.operationType, billetId: element.billetId})
    else balance[0].value = element.balanceValue

    this.finalBalance = 0
    this.appliedBalances.forEach(appliedBalance => {
      if(appliedBalance.operationType == 'DEBIT') {
        this.finalBalance = this.finalBalance + appliedBalance.value;
      } else {
        this.finalBalance = this.finalBalance - appliedBalance.value;
      }
    });
  }

  renderColValue(col : any, line : any, index:number, type : string = 'col') {
    if (!col) {
        throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (!line) {
        return null;
    }
  
    if(col.enableHint) {
        return null;
    } else if (type === 'col') {
  
        let val = !!col.prop ? _.get(line,col.prop) : line.toString();
        if (!!col.converter && col.converter instanceof Function) {
            val = col.converter(val, {line : line, index : index});
        }
        return val;
    } else if (col.actionByValue === true) {
        return this.renderColValue(col, line, index, 'col');
    } else if (!!col.icon && col.icon.iconOnly === true) {
        return null;
    } else {
        return col.title;
    }
  }

  currencyConv(value: any) {
    return formatCurrency(Math.abs(value), 'pt-BR', 'R$');
  }

  hasInterestOrFine() {
    return this.hasFineOrInterest;
  }
}

function renderCurrencyPrefix(line, operation) {
  return (line && line[operation] && line[operation] === 'CREDIT' ? '-' : '') + 'R$';
}
