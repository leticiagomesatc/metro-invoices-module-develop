import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl} from '@angular/forms';
import { formatDate, formatCurrency } from '@angular/common';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { BalanceService } from 'src/app/invoice/services/balance.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import {Location} from '@angular/common';
import { MatRadioChange, MatTableDataSource, MatSelectChange } from '@angular/material';

import * as _ from 'lodash';
import * as moment from 'moment';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { BilletDowningService } from 'src/app/invoice/services/billet-downing.service';
import { StringUtil } from 'src/app/shared/util/string.util';

const LOCALE = 'pt-BR';

@Component({
  selector:     'app-create-billet-downing',
  templateUrl:  './create-billet-downing-edit.component.html',
  styleUrls: [  './create-billet-downing-edit.component.scss'],
})
export class CreateBilletDowningEdit   {
  
  creationMethods: any[] = [{ description: 'Definir vencimento por datas', key: 'DATE'}, { description: 'Definir vencimento por período', key: 'PERIOD' }]

  cols = [
    { title: 'Boleto',                prop: 'docNumber' },
    { title: 'Valor bruto',           prop: 'billetAmountValue',            converter: currencyConv },
    { title: 'Data de emissão',       prop: 'createdOn',                    converter: formatSimpleDate},
    { title: 'Vencimento',            prop: 'dueDate',                      converter: formatSimpleDate},
    { title: 'Pagamento',             prop: 'payedDate',                    converter: formatSimpleDate },
    { title: 'Valor Pago',            prop: 'payedValue',                   converter: currencyConv },
    { title: 'Atraso',                prop: 'dueDays',                      converter: dayConv },
    { title: 'Saldo',                 prop: 'balanceValueOperationalType' },
  ];

  form: FormGroup;

  finalBalance: string;

  finalBilletValue:number;

  customerName:any
  customerSapCode:any
  customerNationalCompanyNumber:any
  today:Date = new Date();

  isDateMethod: boolean = true

  data: any

  dataSource = new MatTableDataSource<any>();

  selectionList: any[] = [];
  displayedColumns: string[] = [];

  addCols: any[] = ['billetId'];

  constructor(
    private route: ActivatedRoute,
    public validate : FwValidateService,
    public balanceService: BalanceService,
    private builder: FormBuilder,
    private messageService: MessageService,
    private billetDowningService: BilletDowningService,
    private location: Location,
    private router: Router
    ) {}

  ngOnInit() {
    this.defineParamsFromRoute(()=>{
      this.defineDisplayedColumns()
      this.createForm()
      this.searchBalanceBillets()
      this.today.setDate(this.today.getDate() + 1);
    })
  }

  defineDisplayedColumns() {
    this.displayedColumns = ['selection'];
    this.displayedColumns = this.displayedColumns.concat(
      _(this.cols).map(col => col.prop).value())
  }

  createForm() {
    this.form = this.builder.group({
      selectedBillets: this.builder.array([], ValidatorsUtil.minArrayLength(1, 'boletos')),
      billetQuantity: [null, [Validators.required, Validators.min(1)]],
      billetCreationMethod: ['DATE', Validators.required],
      dates: this.builder.array([]),
      period:[null],
      dueDate:[null],
      finalBalance: [null, Validators.required]
    });
  }

  defineParamsFromRoute(resolve: any) {
    this.route.paramMap.pipe(map(() => window.history.state)).subscribe((state:any)=>{
      if(state.data) {
        this.customerNationalCompanyNumber = state.data.customerNationalCompanyNumber;
  
        this.customerName = state.data.showValue.customerName;
        this.customerSapCode = state.data.showValue.customerSapCode;
  
        delete state.data.showValue;
        this.data = state.data;
        resolve();
      } else {
        this.goBack();
      }
    })
  }

  searchBalanceBillets () {
    this.balanceService.search(undefined, this.data, undefined, null)
      .subscribe(
        (page) => {
          this.dataSource.data = page.content;
        },
        (error) => {
          this.messageService.dealWithError(error);
        }
      );
  }

  isDevMode() {
    return false;
  }

  executeAction(event : any) {
    if(event.action.action == 'create_downing_client') {
    }
  }

  createBillets() {
    if (this.form.value.selectedBillets && this.form.value.selectedBillets.length <= 0) {
      this.messageService.error('INV-E023');
    } else if (this.form.valid){
      this.form.value.dates = this.form.value.dates.map(content => content.date)
      this.billetDowningService.generateBillets(this.form.value).subscribe(content =>{
        const data = {showValue: {
          customerNationalCompanyNumber: this.customerNationalCompanyNumber,
          customerName: this.customerName,
          customerSapCode: this.customerSapCode
        }, billetList:content}
        this.router.navigate(['show-billet-downing'], { state: { data } });
      });
    }
    this.form.get('billetQuantity').markAsTouched();
  }
  
  goBack() {
    this.location.back();
  }

  changeBilletQuantity(event:any) {
    if(this.isDateMethod) {
      let dates = this.clearDateFormArray();
      for (let index = 0; index < event.target.value; index++) {
        dates.push(this.createDateItem());
      }
    }
  }

  changeBilletCreationMethod(event:MatRadioChange) {

    this.isDateMethod = event.value === 'DATE'
    if(!this.isDateMethod) {
      this.clearDateFormArray()
      this.form.get('period').setValidators(Validators.required);
    }
    else { 
      this.changeBilletQuantity({target:{value: this.form.get('billetQuantity').value}})
      this.form.get('period').clearValidators();
    }
  }

  clearDateFormArray() {
    let dates = this.form.get('dates') as FormArray;
    while (dates.length) {
      dates.removeAt(0);
    }
    return dates;
  }

  createDateItem(): FormGroup {
    return this.builder.group({date: new FormControl(null, [Validators.required])})
  }

  resolveDatePlaceholder(test:any) {
    return 'Data Boleto ' + (test + 1) + (this.form.get('finalBalance').value && this.form.get('finalBalance').value > 0  ? ' - ' + currencyConv(this.form.get('finalBalance').value / this.form.get('billetQuantity').value):'');
  }

  changePeriod(event:MatSelectChange) {
    this.form.get('dueDate').clearValidators();
    if(this.form.controls.period.value === 'MONTHLY') {
      this.form.get('dueDate').setValidators([Validators.required, Validators.min(1)]);
    }
    this.form.get('dueDate').updateValueAndValidity();
  }

  renderColTitle(col: any, type: string = 'col'): string {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (col.enableHint) {
      return '';
    }
    if (type === 'col') {
      return col.title || col.prop || '?';
    } else {
      return col.title;
    }
  }

  renderColValue(col: any, line: any, index: number, type: string = 'col') {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (!line) {
      return null;
    }

    if (col.enableHint) {
      return null;
    } else if (type === 'col') {

      let val = !!col.prop ? _.get(line, col.prop) : line.toString();
      if (!!col.converter && col.converter instanceof Function) {
        val = col.converter(val, {line: line, index: index});
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

  selectItem(element: any, event: any) {
    element.checked = event.checked;
    if (!element.checked) {
      this.selectionList = _.remove(this.selectionList, value => value.billetId !== element.billetId);
    } else {
      this.selectionList.push(element);
    }
    this.writeFinalBalance()
  }

  checkUncheckAll(event: any) {
    this.dataSource.data.forEach(elem => elem.checked = event.checked);

    this.dataSource.data.forEach(element => {
      this.selectionList = _.remove(this.selectionList, value => value.billetId !== element.billetId);
    });

    if (event.checked) {
      this.dataSource.data.forEach(element => this.selectionList.push(element));
    }
    this.writeFinalBalance()
  }

  writeFinalBalance() {
    
    const selectedBilletsArray = this.form.controls['selectedBillets'] as FormArray
    
    while (selectedBilletsArray.length) {
      selectedBilletsArray.removeAt(0);
    }

    let finalBalance = 0;
    this.setFinalBalance();

    this.selectionList.forEach(item=>{
      finalBalance = finalBalance + item.balanceValue
      selectedBilletsArray.push(new FormControl(item.billetId));
    })
    if(finalBalance > 0) {
      this.setFinalBalance(finalBalance, currencyConv(finalBalance));

    }
  }
  
  setFinalBalance(value: number = undefined, formattedValue: string = undefined) {
    this.form.get('finalBalance').setValue(value);
    this.finalBalance = formattedValue;
  }

}

function formatSimpleDate(object : any){
  if (!object) {
    return '-';
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}

function currencyConv(value: any) {
  if (!value) {
    return '-';
  }
  return formatCurrency(value, LOCALE, 'R$');
}

function dayConv(object : any){
  return StringUtil.retroactiveDaysIn(object);
}

function nationalCompanyNumberConv(params: any) {
  return params.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}
function formatDateInverse(){
  return formatDate(new Date(), 'ddMMyyyy-HHmmSS','pt-BR');
}
