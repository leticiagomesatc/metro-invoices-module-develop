import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatDialog, MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl } from '@angular/forms';
import { InvoiceService } from 'src/app/invoice/services/invoice.service';
import { ActivatedRoute } from '@angular/router';
import { formatCurrency } from '@angular/common';
import { Observable } from 'rxjs';
import { CircuitService } from 'src/app/invoice/services/circuit.service';
import { finalize, startWith, map } from 'rxjs/operators';
import { InvoiceCalcService } from 'src/app/invoice/services/invoice-calc.service';
import moment from 'moment-timezone';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { forkJoin } from 'rxjs';
import { MessageService } from 'src/app/shared/communication/message.service';
import * as _ from 'lodash';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { StringUtil } from 'src/app/shared/util/string.util';
import 'rxjs/add/operator/first';

const MSG_CIRCUIT_DISABLED: string = 'O circuito selecionado encontra-se desativado, tem certeza que deseja inclui-lo na lista?';
const MSG_ATTACHED_SERVICE: string = 'Este {0} possui o{3} {1}{3} {2} associado. Deseja incluir este {1}?';
@Component({
  selector: 'app-invoice-calc-detail',
  templateUrl: './invoice-calc-detail.component.html',
  styleUrls: ['./invoice-calc-detail.component.scss']
})
export class InvoiceCalcDetailComponent implements OnInit {

  form : FormGroup;

  deletedItems: Array<any>;

  itemEditFirstState: any;
  itemEditCurrentState: any;

  generalTotal: number = 0;
  generalTotalStr: string;

  penaltyDiscountAmountView: string;
  penaltyDiscountAmount: any = 0;
  penaltyDiscountAmountGross: number = 0;
  grossAmountOfAutomaticPenaltyDiscount: number = 0;
  automaticPenaltyDiscount: string;
  penaltyDiscountAmountGrossStr: string;
  discountTypeYes: Boolean;
  discountType: any[];
  discountTypeId: number = null;

  dialogRef: MatDialogRef<any>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  designationControl = new FormControl();

  exbDisabled = new FormControl();

  crtdControl: FormControl;
  crtdControlCancel: FormControl;
  crtdControlDeact: FormControl;

  dataSource = new MatTableDataSource<any>();
  designation: any;
  allCircuitDisabled = new Array<any>();

  OBJ_EMPTY = {
    activationInstallment: "",
    activationValue: "",
    activationValueBrut: 0,
    activationValueLiq: 0,
    customer: "",
    dateActivation: null,
    dateCancelation: null,
    dateDeactivation: null,
    firstCollectionDay: null,
    lastCollectionDay: null,
    designation: "",
    edit: false,
    editLine: false,
    id: null,
    idCircuit: null,
    idInvoice: null,
    monthlyValue: "",
    monthlyValueBrut: 0,
    monthlyValueLiq: "",
    osDescription: "",
    quantityDayProRata: 0,
    total: 0,
    typeService: ""
  }

  public filteredCircuit: Observable<{name: string, id: number, disabled: boolean}[]>;
  public allCircuit: {name: string, id: number, disabled: boolean}[] = [];

  displayedColumns: string[] = ['customer', 'os_description', 'designation'
  , 'typeService', 'dateActivation', 'monthlyValueView'
  , 'activationValueView', 'activationInstallment'
  , 'dateDeactivation', 'dateCancelation', 'quantityDayProRata', 'firstCollectionDay', 'lastCollectionDay', 'monthlyValueLiqView'
  , 'monthlyValueBrut', 'activationValueLiq', 'activationValueBrut'
  , 'total', 'action'];

  LOCALE = 'pt-BR';

  @ViewChild('edit') edit : any;

  constructor(
    private builder: FormBuilder,
    private invoiceService: InvoiceService,
    private invoiceCalcService: InvoiceCalcService,
    private route: ActivatedRoute,
    private circuitService: CircuitService,
    private dialog: MatDialog,
    public messageService : MessageService) {
    this.form = this.builder.group({
      penaltyDiscountAmountView: [null, null],
      penaltyDiscountAmountGross: [null, null],
      discountType: [null, null],
      grossAmountOfAutomaticPenaltyDiscount: [null, null]
    });
    this.renderDesignation(false);
    this.deletedItems = new Array<any>();
    this.itemEditFirstState = null;
    this.crtdControl = new FormControl(null, ValidatorsUtil.date);
    this.crtdControlCancel = new FormControl(null, ValidatorsUtil.date);
    this.crtdControlDeact = new FormControl(null, ValidatorsUtil.date);
    this.invoiceService.getInvoiceItems(+this.route.snapshot.queryParams['id'])
      .subscribe(resp => {
        this.createData(resp);
        this.calcTotalSum();
        this.dataSource._updateChangeSubscription();
        this.renderDiscountType();
      });
  }

  private createData(resp: any) {
    resp.forEach((item, index) => {
      item.monthlyValueLiqView = this.currencyConv(item.monthlyValueLiq);
      item.activationValueView = this.currencyConv(item.activationValue);
      item.monthlyValueView = this.currencyConv(item.monthlyValue);
      item.blockCheckDisabled = true;
      item.blockActivationTax = false;
      this.dataSource.data.push(item);
      this.addPenaltyDiscount(item);
      if (null !== item.discountTypeId && this.discountTypeId === null) {
        this.discountTypeId = item.discountTypeId;
      }
    });
  }

  parseDate(data: any){

    return moment(data).utc().add(1, 'days').format('YYYY-MM-DD');
  }

  private renderDiscountType(): void {
    this.invoiceService.getAllDiscountType().subscribe((data: any) => {
      this.discountType = data;
      if (this.discountTypeId !== null) {
        let discount = this.discountType.find(item => item.id === this.discountTypeId);
        this.form.get('discountType').setValue(discount);
      }
    });
  }

  addPenaltyDiscount(item: any) {
    if (item.penaltyDiscountAmount !== 0 && item.penaltyDiscountAmountGross !== 0) {
      if(!item.penaltyDiscountAmount.toString().includes('.')){
        item.penaltyDiscountAmount = item.penaltyDiscountAmount.toString().concat(',').concat('00');
      }
      this.form.get('penaltyDiscountAmountView').setValue(convertMoney(item.penaltyDiscountAmount));
      this.form.get('penaltyDiscountAmountGross').setValue(item.penaltyDiscountAmountGross);
      this.penaltyDiscountAmount = Number(convertValueForRequest(convertMoney(this.form.get('penaltyDiscountAmountView').value)));
      this.penaltyDiscountAmountGross = item.penaltyDiscountAmountGross;
    } else {
      this.form.get('penaltyDiscountAmountView').setValue(0);
      this.form.get('penaltyDiscountAmountGross').setValue(0);
    }
    
    if(item.grossAmountOfAutomaticPenaltyDiscount !== 0){
      this.form.get('grossAmountOfAutomaticPenaltyDiscount').setValue(item.grossAmountOfAutomaticPenaltyDiscount);
      this.grossAmountOfAutomaticPenaltyDiscount = item.grossAmountOfAutomaticPenaltyDiscount;
    }else{ 
      this.form.get('grossAmountOfAutomaticPenaltyDiscount').setValue(0);
    }
  }

  calculatePenaltyDiscountAmountGross() {
    const idInvoice = +this.route.snapshot.queryParams['id'];
    this.penaltyDiscountAmount = Number(convertValueForRequest(convertMoney(this.form.get('penaltyDiscountAmountView').value)));
    this.invoiceService.getPenaltyDiscountAmountGross(idInvoice, this.penaltyDiscountAmount)
    .subscribe(resp => {
      this.penaltyDiscountAmountGross = resp;
      this.penaltyDiscountAmountGrossStr = this.currencyConvLocale(this.penaltyDiscountAmountGross);
      this.form.get('penaltyDiscountAmountGross').setValue(this.penaltyDiscountAmountGross);
      this.calcTotalSum();
    });
  }

  calcTotalSum(_this: any = this) {
    let sum = 0;
    _this.dataSource.data.forEach(item=>{
      sum = sum + item.total;
    });
    if(_this.penaltyDiscountAmountGross > 0) {
      sum = sum - _this.penaltyDiscountAmountGross;
    }
    if(_this.grossAmountOfAutomaticPenaltyDiscount > 0) {
      sum = sum - _this.grossAmountOfAutomaticPenaltyDiscount;
    }
    _this.generalTotalStr = _this.currencyConvLocale(sum);
    _this.penaltyDiscountAmountGrossStr = _this.currencyConvLocale(this.penaltyDiscountAmountGross);
    _this.automaticPenaltyDiscount = _this.currencyConvLocale(this.grossAmountOfAutomaticPenaltyDiscount);
    _this.discountTypeYes = _this.penaltyDiscountAmount > 0;
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
  }

  openConfirmDeleteItem(element: any) {
      this.showConfirmMessage('Deseja excluir este item da memória de cálculo?', result=> {
        if (!!result && result.status == 'ok') {
          this.onDeleteItem(element);
        }
      })
  }

  onDeleteItem(element: any): void {
    let itens = this.dataSource.data;
    if (itens.length > 0) {
      const indexEl = itens.indexOf(element);
      if (indexEl > -1) {
        this.dataSource.data.splice(indexEl, 1);
        this.dataSource._updateChangeSubscription();
        this.deletedItems.push(element);
      }
    }
    this.calcTotalSum();
  }

  async onEditItem(element: any) {
    let itens = this.getItensArrayEdit(this.dataSource.data);
    if (itens.length !== 0) {
      await this.saveCurrentItem(false);
    }
    this.beginEditItem(element);
    this.designation = { id: undefined, name: element.designation };
  }

  async saveCurrentItem(cleanStates: boolean) {
    if (this.itemEditCurrentState) {
      await this.onSaveItem(this.itemEditCurrentState, cleanStates);
    }
  }

  async onSaveItem(element: any, cleanStates: boolean) {
    const idInvoice = +this.route.snapshot.queryParams['id'];
    element.edit = false;
    await this.recalculateGrossValues(element, idInvoice, cleanStates);
  }

  getItensArrayEdit(data: Array<any>): Array<any> {
    return data.filter(d => d.edit);
  }

  onSavePromise(escopoDaTela: any): Promise<any> {
    let _this = escopoDaTela;
    let element = _this.itemEditCurrentState;
    var fieldCollectionInvalid = _this.dataSource.data.some(x => x.firstCollectionDay === null || x.lastCollectionDay === null);
      if(fieldCollectionInvalid){
        this.messageService.error('INV-E079')
       return;
    }
    return new Promise(
      function(resolve, reject) {
        const idInvoice = +_this.route.snapshot.queryParams['id'];
        if(element) _this.recalculateGrossValuesPromise(element, idInvoice, true, _this).then(()=>resolve());
        else resolve()
      });
  }
  private recalculateGrossValuesPromise(element: any, idInvoice: number, cleanStates: boolean, forceActivationRecalc: boolean = false, _this: any = this) {
    return new Promise(function(resolve, reject){
      let { observables, containsObservableTax, containsObservableAmount } = _this.prepareStateForRecalc(element, forceActivationRecalc, idInvoice, cleanStates, _this);
      if (observables.length > 0) {
        forkJoin(observables).subscribe((values) => {
          let sequence = 0;
          if (containsObservableTax) {
            element.activationValueBrut = values[sequence];
            sequence++;
          }
          if (containsObservableAmount) {
            element.monthlyValueBrut = values[sequence];
          }
          element.total = element.monthlyValueBrut + element.activationValueBrut;
          _this.calcTotalSum();
          resolve('success');
        },(e)=> reject(e));
      }
    });

  }


  private prepareStateForRecalc(element: any, forceActivationRecalc: boolean, idInvoice: number, cleanStates: boolean, _this: any) {
    let observables = [];
    let containsObservableTax = false;
    let containsObservableAmount = false;
    if (element.activationValue !== _this.itemEditFirstState.activationValue || forceActivationRecalc) {
      if (typeof element.activationValue === "string") {
         element.activationValueLiq = element.activationValue;
      }
      if (element.activationInstallment && element.activationInstallment.includes('/')) {
        let activationSplitted = element.activationInstallment.split('/');
        if (_this.isInteger(activationSplitted[activationSplitted.length - 1])) {
          element.activationValueLiq = element.activationValueLiq / activationSplitted[activationSplitted.length - 1];
        }
      }
      containsObservableTax = true;
      observables.push(_this.invoiceService.getGrossActivationTax(idInvoice, element.activationValueLiq));
    }
    if (element.monthlyValueLiq !== _this.itemEditFirstState.monthlyValueLiq) {
      containsObservableAmount = true;
      observables.push(_this.invoiceService.getGrossAmountInvoiced(idInvoice, element.monthlyValueLiq));
    }
    if (cleanStates) {
      _this.itemEditFirstState = null;
      _this.itemEditCurrentState = null;
    }
    return { observables, containsObservableTax, containsObservableAmount };
  }

  private async recalculateGrossValues(element: any, idInvoice: number, cleanStates: boolean, forceActivationRecalc: boolean = false, _this: any = this) {
    let { observables, containsObservableTax, containsObservableAmount } = _this.prepareStateForRecalc(element, forceActivationRecalc, idInvoice, cleanStates, _this);
    if (observables.length > 0) {
      let values = await Promise.all(observables.map(obs => obs.first().toPromise()));

      let sequence = 0;
      if (containsObservableTax) {
        element.activationValueBrut = values[sequence];
        sequence++;
      }
      if (containsObservableAmount) {
        element.monthlyValueBrut = values[sequence];
      }
      element.total = element.monthlyValueBrut + element.activationValueBrut;
      _this.calcTotalSum();
    }
  }

  private isInteger(activationSplitted: any) {
    return /^\d+$/.test(activationSplitted);
  }

  onCancelItem(element: any): void {
    if (element.edit && element.id) {
      this.dataSource.data[this.dataSource.data.indexOf(element)] = Object.assign({}, this.itemEditFirstState);
    } else {
      this.dataSource.data.splice(this.dataSource.data.indexOf(element), 1);
    }
    this.dataSource._updateChangeSubscription();
    this.itemEditFirstState = null;
    this.itemEditCurrentState = null;
  }

  async newInvoiceItem(editNewItem:boolean=true) {
    await this.saveCurrentItem(false);
    let newItem = Object.assign({}, this.OBJ_EMPTY);
    this.dataSource.data.unshift(newItem);
    this.designation = undefined;
    if(editNewItem) await this.beginEditItem(newItem);
  }

  private beginEditItem(element: any) {
    this.itemEditFirstState = Object.assign({}, element);
    this.itemEditCurrentState = element;
    element.edit = true;
    this.exbDisabled.setValue(null);
    if (!element.id) {
      element.blockCheckDisabled = false;
      this.designationControl.setValue(null);
    }
    if (element.typeService) {
      if (element.typeService !== "Circuito") {
        element.blockActivationTax = true;
      }
    }

    this.dataSource._updateChangeSubscription();
  }

  onSaveInvoice() {
    this.edit.novoEscopo = this;
    this.edit.form = this.builder.group(
      { 'persist': this.builder.array(this.dataSource.data),
        'delete': this.builder.array(this.deletedItems),
        'id': this.builder.control(this.route.snapshot.queryParams['id']),
        'penaltyDiscountAmount': this.builder.control(convertValueForRequest(this.form.get('penaltyDiscountAmountView').value)),
        'discountType': this.builder.control(this.form.value.discountType)
      });
  }

  validateForm(escopo: any) {
    let invalidFields = [];

    if (escopo.form.value.discountType === null && Number(convertValue(escopo.form.value.penaltyDiscountAmount)) > 0) {
      invalidFields.push('Tipo de desconto/penalidade');
      escopo.form.get('discountType').setValidators(Validators.required)
      escopo.form.get('discountType').markAsTouched()
      escopo.form.get('discountType').updateValueAndValidity()
    } else {
      escopo.form.get('discountType').clearValidators();
    } 
    return invalidFields.length === 0;
  }

  serializeFn(entity: any) {
    entity.persist.forEach(item=>{
      item.activationValue = +item.activationValue;
      item.activationValueBrut = +item.activationValueBrut;
      item.activationValueLiq = +item.activationValueLiq;
      item.monthlyValue = +item.monthlyValue;
      item.monthlyValueBrut = +item.monthlyValueBrut;
      item.monthlyValueLiq = +item.monthlyValueLiq;
      item.penaltyDiscountAmount = +item.penaltyDiscountAmount;
      item.penaltyDiscountAmountGross = +item.penaltyDiscountAmountGross;
      item.quantityDayProRata = +item.quantityDayProRata;
      item.total = +item.total;
      if(item.dateDeactivation)
      item.dateDeactivation = moment(item.dateDeactivation).toDate();
      if(item.dateActivation)
      item.dateActivation = moment(item.dateActivation).toDate()
      if(item.dateCancelation)
      item.dateCancelation = moment(item.dateCancelation).toDate()
      if(item.firstCollectionDay)
      item.firstCollectionDay = moment(item.firstCollectionDay).toDate()
      if(item.lastCollectionDay)
      item.lastCollectionDay = moment(item.lastCollectionDay).toDate()
    });
    return {
      id: +entity.id,
      deleted: entity.delete,
      items: entity.persist,
      discount: entity.penaltyDiscountAmount,
      discountType: entity.discountType ? Number(entity.discountType.id) : undefined
    };
  }

  selectDesignation(designation: any) {
    this.selectDisabledDesignation(designation);
  }

  selectDisabledDesignation(designation: any) {
    let findCircuit = this.findDesignationInList(designation.id, this.allCircuit);
    if (findCircuit) {
      this.showConfirmMessage(MSG_CIRCUIT_DISABLED, result=> {
        if (result.status == "ok") {
          this.selectDesignationWithAttachedService(designation);
        }
      });
    } else {
       this.selectDesignationWithAttachedService(designation);
    }
  }

  async selectDesignationWithAttachedService(designation: any) {
    let foundAttachedService = designation.containsAttachedService;
    if (foundAttachedService) {
      this.showConfirmMessage(StringUtil.format(MSG_ATTACHED_SERVICE, ... this.defineVariables(designation)), async result=> {
        await this.findDesignationInfo(designation);
        if (result.status == "ok") {
          for (const element of designation.attachedIds) {
            await this.findDesignationInfo({ id: element }, true);
          }
        }
      });
    } else {
       this.findDesignationInfo(designation);
    }
  }

  private defineVariables(designation: any) {
    let first = 'circuito';
    let second = 'serviço';
    if (designation.name.charAt(0) === 'S') {
      first = 'serviço';
      second = 'circuito';
    }
    let third = designation.attachedServices;
    let fourth = designation.multipleAttachedServices ? 's' : '';
    return [first, second, third, fourth];
  }

  private async findDesignationInfo(designation: any, addNewItem: boolean = false) {
    if(addNewItem) {
      await this.newInvoiceItem()
    }
    let resp = await this.invoiceCalcService.getCircuitInfo(this.route.snapshot.queryParams['id'], designation.id).first().toPromise();
    if (resp.dateActivation)
      this.itemEditCurrentState.dateActivation = moment(resp.dateActivation).add(1, 'days').format('YYYY-MM-DD');
    if (resp.dateCancelation)
      this.itemEditCurrentState.dateCancelation = moment(resp.dateCancelation).add(1, 'days').format('YYYY-MM-DD');
    if (resp.dateDeactivation)
      this.itemEditCurrentState.dateDeactivation = moment(resp.dateDeactivation).add(1, 'days').format('YYYY-MM-DD');
    this.itemEditCurrentState.monthlyValue = resp.monthlyValue;
    this.itemEditCurrentState.monthlyValueLiq = resp.monthlyValueLiq;
    this.itemEditCurrentState.activationValue = resp.activationValue;
    this.itemEditCurrentState.activationInstallment = resp.activationInstallment;
    this.itemEditCurrentState.total = resp.total;
    this.itemEditCurrentState.customer = resp.customer;
    this.itemEditCurrentState.osDescription = resp.osDescription;
    this.itemEditCurrentState.typeService = resp.typeService;
    if(!designation.name) {
      this.designation = this.allCircuit.filter(circuit => circuit.id === designation.id)[0]
    }
    this.itemEditCurrentState.designation = this.designation.name;
    this.itemEditCurrentState.designationCode = this.designation.id;
    this.itemEditCurrentState.activationValue = convertValueForRequest(this.itemEditCurrentState.activationValue);
    this.itemEditCurrentState.monthlyValue = convertValueForRequest(this.itemEditCurrentState.monthlyValue);
    this.itemEditCurrentState.blockCheckDisabled = true;
    if (designation.id.toString().charAt(0) === 'S') {
      this.itemEditCurrentState.blockActivationTax = true;
    }
    this.dataSource._updateChangeSubscription();
  }

  changeUnitValue(formControlName: string) {
    this.form.get(formControlName).setValue(convertMoney(this.form.get(formControlName).value));
    this.calculatePenaltyDiscountAmountGross();
  }

  currencyConv(value: any) : string {
    if(!value) return '0,00'
    return formatCurrency(value, this.LOCALE, '').trim();
  }

  currencyConvLocale(value: any) : string {
    if(!value) value = 0
    return formatCurrency(value, this.LOCALE, 'R$').trim();
  }

  displayDesignation(designation:any) {
    if (!designation) {
      return null;
    }
    return designation.name;
  }

  public renderDesignation(disable: boolean) {
    this.designation = null;
    this.designationControl.disable();
    this.circuitService.findAutocompleteCircuitInvoiceIdAndInactive(this.route.snapshot.queryParams['id'], disable)
    .pipe(finalize(() => {
      this.designationControl.enable();
      this.filteredCircuit = this.designationControl.valueChanges.pipe(
        startWith(''),
        map(s => s ? this.filterCircuits(s) : this.allCircuit.slice())
      );
    }))
    .subscribe((result: any[]) =>{
      this.allCircuit = result;
      if(disable){
        this.allCircuitDisabled = result;
      }
    });
  }

  private isNotString(value: any): boolean {
    return typeof value !== "string";
  }

  private filterCircuits(value: string | any): {id: number, name: string, disabled: boolean}[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();

      this.dataSource
        .data
        .filter(element => element.edit)
        .forEach(el => {
          el.blockCheckDisabled = false;
        });
      this.dataSource._updateChangeSubscription();

      return this.allCircuit
        .filter(circuit => circuit.name)
        .filter(circuit => circuit.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.allCircuit
        .filter(circ => circ.name)
        .filter(circuit => circuit.name.toLowerCase().indexOf(value.dsc) === 0);
    }
  }

  chosenYearHandlerCrtd(normalizedYear: any, element: any) {
    let ctrlValue = this.crtdControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControl.setValue(ctrlValue);
    element.dateActivation = ctrlValue;
  }

  chosenMonthHandlerCrtd(normalizedMonth: any, element: any) {
    const ctrlValue = this.crtdControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControl.setValue(ctrlValue);
    element.dateActivation = ctrlValue;
  }

  chosenYearHandlerFirstCollection(normalizedYear: any, element: any) {
    let ctrlValue = this.crtdControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControl.setValue(ctrlValue);
    element.firstCollectionDay = ctrlValue;
  }


  chosenMonthHandlerFirstCollection(normalizedMonth: any, element: any) {
    const ctrlValue = this.crtdControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControl.setValue(ctrlValue);
    element.firstCollectionDay = ctrlValue;
  }

  chosenYearHandlerLastCollection(normalizedYear: any, element: any) {
    let ctrlValue = this.crtdControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControl.setValue(ctrlValue);
    element.lastCollectionDay = ctrlValue;
  }

  chosenMonthHandlerLastCollection(normalizedMonth: any, element: any) {
    const ctrlValue = this.crtdControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControl.setValue(ctrlValue);
    element.lastCollectionDay = ctrlValue;
  }

  chosenYearHandlerCrtdDeact(normalizedYear: any, element: any) {
    let ctrlValue = this.crtdControlDeact.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControlDeact.setValue(ctrlValue);
    element.dateDeactivation = ctrlValue;
  }

  chosenMonthHandlerCrtdDeact(normalizedMonth: any, element: any) {
    const ctrlValue = this.crtdControlDeact.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControlDeact.setValue(ctrlValue);
    element.dateDeactivation = ctrlValue;
  }

  chosenYearHandlerCrtdCancel(normalizedYear: any, element: any) {
    let ctrlValue = this.crtdControlCancel.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControlCancel.setValue(ctrlValue);
    element.dateCancelation = ctrlValue;
  }

  chosenMonthHandlerCrtdCancel(normalizedMonth: any, element: any) {
    const ctrlValue = this.crtdControlCancel.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControlCancel.setValue(ctrlValue);
    element.dateCancelation = ctrlValue;
  }

  chosenDateHandlerCrtdCancel(event: any, element: any) {
    const ctrlValue = event.value;
    if (ctrlValue) {
      element.dateCancelation = ctrlValue;
    }
  }

  chosenDateHandlerCrtd(event: any, element: any) {
    const ctrlValue = event.value;
    if (ctrlValue) {
      element.dateActivation = ctrlValue;
    }
  }

  chosenDateHandlerCrtdDeact(event: any, element: any) {
    const ctrlValue = event.value;
    if (ctrlValue) {
      element.dateDeactivation = ctrlValue;
    }
  }

  chosenDateHandlerCrtdFirstCollection(event: any, element: any) {
    const ctrlValue = event.value;
    if (ctrlValue) {
      element.firstCollectionDay = ctrlValue;
    }
  }

  chosenDateHandlerCrtdLastCollection(event: any, element: any) {
    const ctrlValue = event.value;
    if (ctrlValue) {
      element.lastCollectionDay = ctrlValue;
    }
  }

  showConfirmMessage(msg: string, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(ConfirmComponent,{ data: { msg: msg }, width:'350px' });

    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      action(result);
    })
  }

  findDesignationInList(idDesignation: number, list: any[]): boolean {
    let res = false;
    if (list.length > 0) {
      let desigs = list.filter(des => des.disabled && des.id === idDesignation) ;
      if (desigs.length > 0) {
        res = true;
      }
    }
    return res;
  }

  filterDisabled(event: any) {
    if (event.checked) {
      if(this.allCircuitDisabled.length === 0){
        this.renderDesignation(true)
      }else{
        this.allCircuit = this.allCircuitDisabled;
      }
    } else {
      this.allCircuit = this.allCircuit.filter(circuit => !circuit.disabled);
    }

    this.allCircuit.sort(function(a,b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    this.filteredCircuit = this.designationControl.valueChanges.pipe(
      startWith(''),
      map(s => s ? this.filterCircuits(s) : this.allCircuit.slice())
    );

  }

  async onChangeActivationInstallment(event:any) {
    await this.recalculateGrossValues(this.itemEditCurrentState, Number(this.route.snapshot.queryParams['id']), false, true);
  }

  convertMonthlyValue(value: string){
    this.itemEditCurrentState.monthlyValueView = convertMoney(value);
    this.itemEditCurrentState.monthlyValue = convertValueForRequest(this.itemEditCurrentState.monthlyValueView);
  }

  convertActivationValue(value: string){
    this.itemEditCurrentState.activationValueView = convertMoney(value);
    this.itemEditCurrentState.activationValue = convertValueForRequest(this.itemEditCurrentState.activationValueView);
  }

  convertMonthValueLiq(value: string){
    this.itemEditCurrentState.monthlyValueLiqView = convertMoney(value);
    this.itemEditCurrentState.monthlyValueLiq = convertValueForRequest(this.itemEditCurrentState.monthlyValueLiqView);
  }
}

function convertMoney(value: string) : string {
  let part;
  let part1;
  let valorString = value.toString().replace(/\D/g, '');
  if(valorString.length >= 10){
    valorString = valorString.substring(1, valorString.length);
  }

  if(valorString.length >= 3){
    part = valorString.substring(0, valorString.length -2);
    part1 = valorString.substring(valorString.length -2, valorString.length);
    part = part.toString().concat('.').concat(part1.toString());
    value = (Number(part)).toLocaleString('pt-BR');
    if(valorString.substring(valorString.length -2, valorString.length) != '00'){
      if(valorString.substring(valorString.length -1, valorString.length) == '0'){
        value = value.concat('0');
      }
    } else {
      value = value.concat(',').concat('00');
    }
  } else if(valorString.length == 0){
    value = '0,00';
  }
  return value;
}

function convertValue(value: string) : string {
  return value ? value.toString().replace('.', '').replace(',', '.') : '0';
}

function validateObject(value: any) {
  if (value == null || value == undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return {required:true};
  }

  return null;

}

function convertValueForRequest(value: string){
  value = value.toString().replace(/\D/g, '');
  let entirePartValue = value.substring(0, value.length -2);
  let partDecimalValue = value.substring(value.length -2, value.length);
  return entirePartValue.toString().concat('.').concat(partDecimalValue.toString());
}