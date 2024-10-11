import { Component, OnInit, ChangeDetectorRef, ViewChild, ɵConsole } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { userRoles } from 'src/app/shared/util/user-roles';
import { InvoiceCalcService } from 'src/app/invoice/services/invoice-calc.service';
import { Observable } from 'rxjs';
import { startWith, map, finalize } from 'rxjs/operators';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { OperatorService } from 'src/app/invoice/services/operator.service';
import { InvoiceService } from 'src/app/invoice/services/invoice.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { isThisMinute } from 'date-fns';


const NUM_LIST_SIZE_PERIOD = 45;

export class Operator {
  constructor(public id: number, public name: string, public selected?: boolean) {
    if (selected === undefined) selected = false;
  }
}

@Component({
  selector: 'app-invoice-calc-edit',
  templateUrl: './invoice-calc-edit.component.html',
  styleUrls: ['./invoice-calc-edit.component.scss']
})
export class InvoiceCalcEditComponent implements OnInit {

  requiredRolesToInclude: string = userRoles.invoiceCalcEmit;
  yesNoStatus: any[] = [{ description: 'Sim', key: 'YES'}, { description: 'Não', key: 'NO' }];
  cmpControl: any;
  form : FormGroup;
  operatorControl = new FormControl();
  customerControl = new FormControl();
  sapCodecontrol  = new FormControl();
  discountTypeControl = new FormControl();
  @ViewChild('paginator') paginator: MatPaginator;
  
  operatorsAny: any;
  operators: Operator[] = new Array<Operator>();
  customers: any[]= new Array<any>();

  baseOperators: Observable<any>;

  @ViewChild('edit') search : any;

  selectedOperators: Operator[] = new Array<Operator>();
  selectedCustomers: any[] = new Array<any>();
  selectedSapCode: any[] = new Array<any>();

  filteredOperators: Observable<Operator[]>;
  filteredCustomers: Observable<any[]>;
  filteredSapCode: Observable<any[]>;

  lastFilter: string = '';
  lastFilterCustomer: string = '';
  lastFilterSapCode: string;

  operatorsList: any[];
  discountType: any[];
  discountTypeYes: Boolean;
  tributeType: any [];

  generateLot: Boolean;

  period: any = {};

  customerPeriod: any[] = Array<any[]>();
  
  hideSpinnerCustomerPeriod: boolean;

  memoryList = new MatTableDataSource<any>();
  memoryColumns: string[] = ['operadora', 'cliente', 'grupo', 'cnpj', 'acao'];
  periodColumns: string[] = ['Lote', 'execution', 'loading'];

  listSize: number;
  filteredList: any[] = [];
  
  @ViewChild('edit') edit : any;

  programmedCustomerDays: any[] = [];

  daysDisabled: boolean = false;
  
  
  dataSourceCustomerPeriod = new MatTableDataSource<any>();
  @ViewChild("paginatorCustomerPeriod") paginatorCustomerPeriod: MatPaginator;
  customerPeriodList: any[] = [];
  listSizeCustomerPeriod: number;
  selectedLot: any;

  constructor(
    private builder : FormBuilder, 
    public validate : FwValidateService,
    private messageService : MessageService,
    private cd : ChangeDetectorRef,
    private route: ActivatedRoute,
    public authService: AuthService,
    private customerService: CustomerService,
    private operatorService: OperatorService,
    private invoiceCalcService: InvoiceCalcService,
    private ref: ChangeDetectorRef,
    private router: Router,
    private invoiceService: InvoiceService){
      this.generateLot = false;
      this.operatorControl.disable();
      this.customerControl.disable();
      this.sapCodecontrol.disable();
      this.discountTypeYes = false;
    }

  ngOnInit() {
    const _this = this;
    _this.authService.checkAuthorization(_this.requiredRolesToInclude, _this.initComponent, _this);
  } 

  private renderDiscountType(): void {
    this.invoiceService.getAllDiscountType().subscribe((data: any) => {
      this.discountType = data;            
    });
  }

  private renderOperators(): void {
                         
    this.operatorService.findAutocompleteOperatorsInactive(true)
    .pipe(finalize(() => {
      this.operatorControl.enable();      
      this.filteredOperators = this.operatorControl.valueChanges.pipe(
        startWith<string | any[]>(''),
        map(value => typeof value === 'string' ? value : this.lastFilter),
        map(filter => this.filter(filter)));      
    }))
    .subscribe(result => { 
      this.operators = result;
    });
  }

  private renderCustomers(idNetworkOperatorList: Array<number>): void {
    this.customerService.findAutocompleteCustomersIdOperatorListAndInactive(idNetworkOperatorList)
    .pipe(finalize(() => {
      this.customerControl.enable();
      
      this.filteredCustomers = this.customerControl.valueChanges.pipe(
        startWith<string | any[]>(''),
        map(value => typeof value === 'string' ? value : this.lastFilterCustomer),
        map(filter => this.filterCustomer(filter)));

        this.sapCodecontrol.enable();
        this.filteredSapCode = this.sapCodecontrol.valueChanges.pipe(
          startWith<string | any[]>(''),
          map(value => typeof value === 'string' ? value : this.lastFilterSapCode),
          map(filter => this.filterSapCode(filter)));

    }))
    .subscribe(result => {
      this.customers = result;
    });
  }

  private initComponent(_this: any) {
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.form = _this.builder.group({
      generateInLote : ['NO', null],
      programmedDay: [null, null],
      operator: [null, null],
      fatMonthLast: ['YES', null],
      fineControl: [null, null],
      finePayControl: [null, null],
      discountControl:[null, null],
      cmpControl: [currentCmp, null],
      customerIds: [null, null],
      discountType: [null, null],
      operatorIds: [null, null],
      operatorsControlName: [null, null],
      customersControlName:[null, null],
      tributeType:['0',null],
      generateICMSInvoice:[null,null]
    });   
    _this.cmpControl = new FormControl(currentCmp, Validators.required)
    _this.operators = _this.invoiceCalcService.getOperators();
    _this.renderDiscountType();
    _this.renderOperators();
    const obj = new Array<number>();
    obj.push(0);
    _this.renderCustomers(obj);
  }

  filter(filter: string): Operator[] {
    let breakFilter = filter.split(',');
    filter = breakFilter[breakFilter.length - 1];
    filter = filter.trim();
    this.lastFilter = filter;
    if (filter) {
      return this.operators.filter(option => {
        return option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
      })
    } else {
      return this.operators.slice();
    }
  }

  filterCustomer(filter: string): Operator[] {
    let breakFilter = filter.split(',');
    filter = breakFilter[breakFilter.length - 1];
    filter = filter.trim();
    this.lastFilterCustomer = filter;
    if (filter) {
      return this.customers.filter(option => {
        return option.name.toLowerCase().indexOf(filter.toLocaleLowerCase()) >= 0;
      })
    } else {
      return this.customers.slice();
    }
  }

  filterSapCode(filter: string):  any[] {
    let breakFilter = filter.split(',');
    filter = breakFilter[breakFilter.length - 1];
    filter = filter.trim();
    this.lastFilterSapCode = filter;    
    if (filter) {
      return this.customers.filter(option => {
        if (option.sapCode) {
          return option.sapCode.indexOf(filter) >= 0;
        } 
      })
    } else {
      return this.customers.slice();
    }
  }

  displayFn(value: Operator[] | string): string | undefined {
    let displayValue: string;
    if (Array.isArray(value)) {
      value.forEach((user, index) => {
        if (index === 0) {
          displayValue = user.name;
        } else {
          displayValue += ', ' + user.name;
        }
      });
    } else {
      displayValue = value;
    }
    return displayValue;
  }

  
  displayFnCustomer(value: any[] | string): string | undefined {
    let displayValue: string;
    if (Array.isArray(value)) {
      value.forEach((user, index) => {
        if (index === 0) {
          displayValue = user.name;
        } else {
          displayValue += ', ' + user.name;
        }
      });
    } else {
      displayValue = value;
    }
    return displayValue;
  }

  displayFnSapCode(value: any[] | string): string | undefined {
    let displayValue: string;
    
    if (Array.isArray(value)) {
      value.forEach((user, index) => {
        if (index === 0) {
          displayValue = user.sapCode;
        } else {
          displayValue += ', ' + user.sapCode;
        }
      });
    } else {
      displayValue = value;
    }
    return displayValue;
  }

  optionClicked(event: Event, user: Operator) {
    event.stopPropagation();
    this.toggleSelection(user);
  }

  optionClickedCustomer(event, customer: any) {
    event.stopPropagation();
    this.toggleSelectionCustomer(customer);
  }

  optionClickedSapCode(event, sap: any) {
    event.stopPropagation();
    this.toggleSelectionSapCode(sap);
  }
  
  toggleSelectionSapCode(sap: any) {
    sap.selected = !sap.selected;
    if (sap.selected) {
      this.selectedSapCode.push(sap);   
      this.createCustomerList(sap);      
      const i = this.selectedCustomers.findIndex(value => value.id === sap.id && value.name === sap.name);
      if (i === -1) {
       this.selectedCustomers.push(sap);
       this.customerControl.setValue(this.selectedCustomers);
      }     
    } else {
      const i = this.selectedCustomers.findIndex(value => value.id === sap.id);
      this.selectedSapCode.splice(i, 1);
      sap.cliente = sap.sapCode;
      sap.grupo = sap.name;
      this.onDeleteCustomer(sap);
    }
    this.customerControl.setValue(this.selectedCustomers.length === 0 ? null : this.selectedCustomers);
    this.sapCodecontrol.setValue(this.selectedSapCode.length === 0 ? null : this.selectedSapCode);
  }

  createCustomerList(sap: any) {
    this.paginator.firstPage();
    this.customerService.getCustomerBySapCodeAndName(sap.sapCode, sap.name).subscribe((data: any) => {      
      this.filteredList.push({operadora: data.operatorName, cliente: data.sapCode, grupo: data.name, cnpj: data.cnpj});
      this.listSize = this.filteredList.length;
      this.updateTable(
        {pageIndex: 0, pageSize:5}, 
        this.filteredList
    )
   });
  } 

  onPageEvent(event : any) {
    this.updateTable(event, this.filteredList)
  }

  updateTable(event, completeList) {
    this.memoryList.data = []
    this.listSize = completeList.length
    let begin = event.pageIndex*event.pageSize;
    let end = begin + event.pageSize;
    completeList.slice(begin, end).forEach(item=>this.memoryList.data.push(item));
    this.memoryList._updateChangeSubscription();
  }

  onPageEventCustomerPeriod(event : any) {
    this.updateTableCustomerPeriod(event, this.customerPeriodList)
  }

  changeTributeType(value:any){
    if(parseInt(value)==2){
    
      this.form.get('discountControl').disable();
      this.form.get('fineControl').disable();
      this.form.get('finePayControl').disable();
      this.form.get('discountControl').setValue(null);
      this.form.get('fineControl').setValue(null);
      this.form.get('finePayControl').setValue(null);
      this.discountTypeYes = false;
    }else{
      this.form.get('discountControl').enable();
      this.form.get('fineControl').enable();
      this.form.get('finePayControl').enable();
    }
  }

  updateTableCustomerPeriod(event, completeList) {
    this.listSizeCustomerPeriod = completeList.length;
    let begin = event.pageIndex*event.pageSize;
    let end = begin + event.pageSize;
    this.dataSourceCustomerPeriod.data = [];
    completeList.slice(begin, end).forEach(item=>this.dataSourceCustomerPeriod.data.push(item));
    this.dataSourceCustomerPeriod._updateChangeSubscription();
  }

  toggleSelectionCustomer(customer: any) {
    customer.selected = !customer.selected;
    if (customer.selected) {
      this.selectedCustomers.push(customer);
      this.createCustomerList(customer);
      const i = this.selectedSapCode.findIndex(value => value.id === customer.id);
      if (i === -1) {
       this.selectedSapCode.push(customer);
       this.sapCodecontrol.setValue(this.selectedSapCode);
      }
    } else {
      const i = this.selectedCustomers.findIndex(value => value.id === customer.id && value.name === customer.name);
      this.selectedCustomers.splice(i, 1);
      customer.cliente = customer.sapCode;
      customer.grupo = customer.name;
      this.onDeleteCustomer(customer);
    }
    this.customerControl.setValue(this.selectedCustomers.length === 0 ? null : this.selectedCustomers);
    this.sapCodecontrol.setValue(this.selectedSapCode.length === 0 ? null : this.selectedSapCode);
  }

  toggleSelection(user: Operator) {
    user.selected = !user.selected;
    if (user.selected) {
      this.selectedOperators.push(user);
      this.form.get('operator').setValue(user);
    } else {
      const i = this.selectedOperators.findIndex(value => value.id === user.id && value.name === user.name);
      this.selectedOperators.splice(i, 1);
    }
    this.cleanSapCodeAndCustomers();
    this.renderCustomers(this.selectedOperators.map(obj => obj.id));

    this.operatorControl.setValue(this.selectedOperators.length === 0 ? null : this.selectedOperators);
  }

  private cleanSapCodeAndCustomers() {
    this.selectedSapCode = new Array<any>();
    this.selectedCustomers = new Array<any>();
    this.filteredSapCode = new Observable<any[]>();
    this.filteredCustomers = new Observable<any[]>();
    this.sapCodecontrol.setValue(null);
    this.customerControl.setValue(null);
    this.memoryList = new MatTableDataSource<any>();
    this.filteredList = new Array<any>();
  }

  chosenYearHandler(normalizedYear: any) {
    this.resetCustomerPeriodTable();
    let ctrlValue = this.cmpControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.cmpControl.setValue(ctrlValue);
  }

  private resetCustomerPeriodTable() {
    this.programmedCustomerDays = [];
    if(this.paginatorCustomerPeriod) {
      this.paginatorCustomerPeriod.firstPage();
    }
    this.dataSourceCustomerPeriod.data = [];
    this.customerPeriodList = [];
  }

  chosenMonthHandler(normalizedMonth: any, datepicker: any) {
    const ctrlValue = this.cmpControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    ctrlValue.setDate(1);
    this.cmpControl.setValue(ctrlValue);
    datepicker.close();
    this.retrieveProgrammedCustomerForPeriod();
  }

  radioChangeLote(value: any) {
    if(!this.selectedLot) {
      this.dataSourceCustomerPeriod.data = []
      if (value === 'YES') {
        this.generateLot = true;
        this.form.get('programmedDay').setValidators([Validators.required]);
        this.cleanForm('NO');
      } else {
        this.generateLot = false;
        this.form.get('programmedDay').setValue(null);
        this.form.get('programmedDay').setValidators(null);
        this.form.get('programmedDay').updateValueAndValidity();
        this.cleanForm('YES');
      }
    } else {
      this.form.controls.generateInLote.setValue('YES');
    }
  }

  generate() {
    this.validateCustomersAndOperators();
    this.form.get('cmpControl').setValue(this.cmpControl.value);
    this.form.get('programmedDay').updateValueAndValidity();
    this.form.get('customerIds').setValue(this.selectedCustomers.map(customer=>customer.id));
    this.form.get('operatorIds').setValue(this.selectedOperators.map(operator=>operator.id));
    this.form.get('customersControlName').setValue(this.selectedCustomers);
    this.form.get('operatorsControlName').setValue(this.selectedOperators);
    //this.form.get('discountType').setValue(this.discount);
  }

  cleanSelectedLot() {
    if(this.selectedLot) {
      this.selectedLot.hideSpinner = true;
      this.selectedLot = undefined;
    } 
  }

  validateCustomersAndOperators() {
    if (this.selectedCustomers.length === 0 && this.selectedOperators.length === 0 && this.form.get('generateInLote').value == 'NO') {
      this.form.get('customersControlName').setValidators([Validators.required]);
      this.form.get('operatorsControlName').setValidators([Validators.required]);
    } else {
      this.form.get('customersControlName').setValidators(null);
      this.form.get('operatorsControlName').setValidators(null);
    }
  }

  validValueDiscount() {    
    const discountForm = this.form.controls['discountControl'];    
    if (discountForm) {
      const discountValue = this.form.controls['discountControl'].value;    
    }
    return true;
  }

  onSearchChangedDiscount(value: string, formControlName: string): void {    
    console.log('onSearchChangedDiscount', value);
    

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
      this.discountTypeYes = arrFinal.length > 0;     
    } else {
      this.discountTypeYes = false;
    }

  }

  changeUnitValue(formControlName: string) {
    const value = this.form.get(formControlName).value;
    const values = value.split(',');

    if (values[0].length === 0) {
      values[0] = value;
    }

    values[0] = values[0].replace(/\D/g, '').replace(/\./g, '');

    if (values[0] && values[0].length > 3) {
      const count = Math.trunc(values[0].length / 3);
      const newArray = [];
      for (let i = 0; i <= count; i++) {
        newArray.push(values[0].substring((values[0].length - ((i + 1) * 3)), (values[0].length - (i * 3))));
      }
      values[0] = newArray.filter(item => item).reverse().map(item => item).join('.');
    }

    if (values[1] || values[1] === '') {
      values[1] = values[1].replace(/\D/g, '');
      this.form.get(formControlName).setValue(`${values[0]},${values[1].substring(0, 2)}`);
    } else {
      this.form.get(formControlName).setValue(`${values[0]}`);
    }
  }

  onDeleteCustomer(customer: any): void {
    this.customers.find(c => c.sapCode === customer.cliente && c.name === customer.grupo).selected = false;

    let customerDelete = this.filteredList.filter(c => c.grupo === customer.grupo)[0];
    this.filteredList.splice(this.filteredList.indexOf(customerDelete), 1);
    this.memoryList.data.splice(this.memoryList.data.indexOf(customerDelete), 1);
    this.listSize = this.filteredList.length;
    if(this.memoryList.data.length === 0){
      this.paginator.previousPage();
    }
    if(this.paginator.hasNextPage()){
      this.paginator.nextPage();
      this.paginator.previousPage();
    }
    this.memoryList._updateChangeSubscription();
    this.toggleNotSelectionSapCode(customer);
    this.toggleNotSelectionCustomer(customer);
    this.customerControl.setValue(this.selectedCustomers.length === 0 ? null : this.selectedCustomers);
    this.sapCodecontrol.setValue(this.selectedSapCode.length === 0 ? null : this.selectedSapCode);
  }

  clearPeriod() {
    this.resetCustomerPeriodTable();
    this.cmpControl.setValue(null);
    this.form.get('cmpControl').setValue(null);
    this.retrieveProgrammedCustomerForPeriod()
  }

  clearOperator() {
    this.cleanSapCodeAndCustomers();
    this.selectedOperators.forEach(operator => {
      operator.selected = false;
    });
    this.selectedOperators = new Array();
    this.operatorControl.setValue(null);
    this.form.get('operatorControl').setValue(null);
  }

  clearSapCodeAndCustomers() {
    this.selectedSapCode.forEach(sapCode => {
      sapCode.selected = false;
    });
    this.selectedCustomers.forEach(customer => {
      customer.selected = false;
    });
    this.selectedSapCode = new Array<any>();
    this.selectedCustomers = new Array<any>();
    this.sapCodecontrol.setValue(null);
    this.customerControl.setValue(null);
    this.memoryList = new MatTableDataSource<any>();
    this.filteredList = new Array<any>();
  }

  validateForm(form: FormGroup) {
    if (!this.form.value.cmpControl) {
      return false;
    }
    // if (!this.form.value.operator) {
    //   return false;
    // }
    return true;
  }

  toggleNotSelectionCustomer(customer: any) {    
    const i = this.selectedCustomers.findIndex(value => value.sapCode === customer.cliente && value.name === customer.grupo);
    if (i > -1) {       
      this.selectedCustomers.splice(i, 1);
      this.customerControl.setValue(this.selectedCustomers);      
    }    
  }

  toggleNotSelectionSapCode(customer: any) {       
    const i = this.selectedSapCode.findIndex(value => value.sapCode === customer.cliente && value.name === customer.grupo);
    if (i > -1) {      
      this.selectedSapCode.splice(i, 1);      
      this.sapCodecontrol.setValue(this.selectedSapCode);      
    }
  }

  cleanForm(type: string) {
    switch (type) {
      case 'YES':
        this.cleanFormNo();
        break;
      case 'NO':
        this.cleanFormYes();
        break;
      default: console.log('Type not found !!!');
    }
  }

  cleanFormYes(): void {
    this.discountTypeYes = false;
    this.listSize = 0;

    let keepValueOfControls = ['fatMonthLast', 'cmpControl'];

    Object.keys(this.form.controls).forEach(key => {
      if(!keepValueOfControls.includes(key)) {
        this.form.controls[key].setValue(null);
      }
    });
    
    this.selectedCustomers.length = 0;
    this.customerControl.setValue([]);

    this.selectedSapCode.length = 0;
    this.sapCodecontrol.setValue([]);

    this.selectedOperators.length = 0;
    this.operatorControl.setValue([]);

    this.memoryList.data.length = 0;    
    this.operators.forEach(o => {
      if (o.selected === true) {
        o.selected = false;
      }
    });    
    this.customers.forEach(c => {
      if (c.selected === true) {
        c.selected = false;
      }
    });    
    this.retrieveProgrammedCustomerForPeriod();
    this.form.controls['tributeType'].setValue('0');
  }

  cleanFormNo(): void {
    console.log('Type: NO');
    this.discountTypeYes = false;
    Object.keys(this.form.controls).forEach(key => {
      this.form.controls[key].setValue(null);
    });
    this.form.controls['fatMonthLast'].setValue('YES');
    this.form.controls['tributeType'].setValue('0');
  }

  serializeFn(entity: any) {
    let request: { [key: string]: any; };
    request = {
      generateInLote: entity.generateInLote === 'NO' ? false : true,
      programmedDay: entity.programmedDay,
      period: entity.cmpControl,
      discount: entity.discountControl ? convertValue(entity.discountControl) : null,
      discountTypeId: entity.discountType ? entity.discountType.id : null,
      fatMonthLast: entity.fatMonthLast === 'NO' ? false : true,
      fine: entity.fineControl ? convertValue(entity.fineControl) : null,
      finePay: entity.finePayControl ? convertValue(entity.finePayControl) : null,
      customerIds: entity.customerIds,
      operatorIds: entity.operatorIds,
      tributeTypeId: entity.tributeType ? entity.tributeType : null,
      generateICMSInvoice: entity.generateICMSInvoice

    }
    return request;
  }

  retrieveProgrammedCustomerForPeriod() {
    if(this.generateLot) {
      this.programmedCustomerDays = [];
      this.cleanSelectedLot();
      if(this.cmpControl.value) {
        this.daysDisabled = true;
        this.invoiceCalcService.retrieveProgrammedCustomerForPeriod(this.cmpControl.value).subscribe(
          programmedCustomers => {
            this.programmedCustomerDays = programmedCustomers;
            this.programmedCustomerDays.forEach(item=>item.renderDay = renderDay)
          },
          (e) => this.messageService.dealWithError(e),
          () => this.daysDisabled = false
        );
      }
    }
  }

  selectDays(event: any) {
    let val = event.source.value;
    if (val) {
      let findOne = this.programmedCustomerDays.filter(prog => prog.dayAsString === val);   
      if (findOne) {
        let arr = findOne[0].customers;
        this.dataSourceCustomerPeriod.data = [];
        let arrFinal = chunkArray(arr, NUM_LIST_SIZE_PERIOD);
        this.dataSourceCustomerPeriod._updateChangeSubscription();
        let i:number = 0;
        arrFinal = arrFinal.map(item=>{
          i++;
          return {customers: item, desc: `LOTE ${i} (${item.length} GRUPO${item.length > 1 ? 'S' : ''} DE FATURAMENTO)`, hideSpinner: true, activated: false};
        });
        console.log(arrFinal)
        this.customerPeriodList = arrFinal;
        this.onPageEventCustomerPeriod({pageIndex: 0, pageSize: 10});
      }
    }
  }

  saveCustomerPeriod(index: number) {
    let arr = this.dataSourceCustomerPeriod.data;
    let customers = arr[index].customers;
    if (customers.length > 0) {
      this.selectedLot = arr[index];
      this.selectedLot.hideSpinner = false;
      this.selectedLot.activated = true;
      this.selectedCustomers = customers;
      this.search.save();
    }
  }  
}

function convertValue(value: string) : string {
  return value.replace('.', '').replace(',', '.');
}

function renderDay() {
  return this.count > 0 ? ''.concat(this.dayAsInteger).concat(' (').concat(this.count).concat(' ').concat('grupo').concat(this.count > 1 ? 's' : '').concat(')') : ''.concat(this.dayAsInteger);
}

function chunkArray(myArray, chunk_size){
  let index = 0;
  let arrayLength = myArray.length;
  var tempArray = [];
  
  for (index = 0; index < arrayLength; index += chunk_size) {
      let myChunk = myArray.slice(index, index+chunk_size);
      tempArray.push(myChunk);
  }
  return tempArray;
}
