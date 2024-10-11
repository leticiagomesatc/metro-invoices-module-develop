import { ChangeDetectorRef, Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { from, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { FormUtils } from 'src/app/shared/util/form-utils';
import { Pageable } from 'src/app/shared/util/pageable';
import { userRoles } from 'src/app/shared/util/user-roles';
import { CustomerService } from 'src/app/invoice/services/customer.service';


@Component({
  selector: 'app-debit-note-template-edit',
  templateUrl: './debit-note-template-edit.component.html',
  styleUrls: ['./debit-note-template-edit.component.scss'],
})
export class DebitNoteTemplateEdit {

  form : FormGroup;

  taxes = [
    {name: 'PIS', showTribbuted: true},
    {name: 'COFINS', showTribbuted: true},
    {name: 'CSLL', showTribbuted: false},
    {name: 'IRRF', showTribbuted: false}
  ];

  fields = 
   'id,description,type,taxes[id[tax],tributed,sourceRetained],inactive,customer[id,sapCode,name],product[id,name],monthlyAmout,dueDateDay,'+
   'emissionDay,businessLocal[id,name],issueStart,issueEnd,emissionsCount,dischargeNotice,noteImportRecord[id]';
 

  taxesDataSource : MatTableDataSource<any>;
  disableTaxes = false;
  disableImport: boolean = false;

  filteredCustomers: Observable<any[]>;

  constructor(
    private builder : FormBuilder, 
    public validate : FwValidateService,
    private messageService : MessageService,
    private cd : ChangeDetectorRef,
    private route: ActivatedRoute,
    public authService: AuthService,
    private customerService: CustomerService){

    this.taxesDataSource = new MatTableDataSource(this.taxes);

  }

  paramId: string;

  continueEdit: boolean = false;

  requiredRolesToInclude: string = userRoles.dbTemplateInclude;
  requiredRolesToEdit: string = userRoles.dbTemplateUpdate;

  ngOnInit() {
    this.continueEdit = false
    const _this = this;
    let sb = this.route.paramMap.subscribe(
        (params)=> {
          this.paramId = params.get('id')
          if(this.paramId) {
            //EDIT
            _this.authService.checkAuthorization(_this.requiredRolesToEdit, _this.initComponent, _this);
          }else {
            //INCLUIR
            _this.authService.checkAuthorization(_this.requiredRolesToInclude, _this.initComponent, _this);
          }
        },
        (error)=> this.messageService.dealWithError(error)
    );
  }

  private initComponent(_this: any) {
    _this.form = _this.builder.group({
      id : [],
      description : [null, [Validators.required, Validators.maxLength(255)]],
      inactive : [false],
      businessLocal : [null, Validators.required],
      customer : [null, Validators.required],
      product : [null, Validators.required],
      monthlyAmout : [null, [Validators.required, Validators.min(0)]],
      dueDateDay : [null, [Validators.required, Validators.min(1),, Validators.max(31)]],
      emissionDay : [null, [Validators.required, Validators.min(1),, Validators.max(31)]],
      type: [null, Validators.required],
      issueStart: [null, Validators.required],
      issueEnd: [null, Validators.required],
      dischargeNotice : [null, Validators.maxLength(255)],
      taxes : _this.builder.array([]),
      noteImportRecord: [null]
    });

      _this.filteredCustomers = _this.form.get('customer').valueChanges
    .pipe(startWith(''), debounceTime(250), filter((value: any) => !!value && value.length > 2), distinctUntilChanged(), switchMap(value => value ?
      from(_this.customerService.search({ name: value, customerSapCode: value, activeDunnings: true }, new Pageable(0, 10)))
      : from(Promise.resolve({ content: [] }))), map((a: any) => a.content.map(item => {
        delete item.finalBalance;
        delete item.interestFines;
        return item;
      })));
  }

  serializeFn(entity: any) {
    entity.customer = this.form.controls.customer.value
    entity.businessLocal = this.form.controls.businessLocal.value
    entity.type = this.form.controls.type.value
    entity.product = this.form.controls.product.value
    entity.monthlyAmout = this.form.controls.monthlyAmout.value
    entity.taxes = this.form.controls.taxes.value
    return entity;
  }

  deserializeFn(entity: any) {
    delete entity.customer.contacts;
    return entity
  }
 
  validateForm(form: FormGroup) {

    let invalidFields = [];

    if (!form.controls['customer'].disabled && validateObject(form.value.customer) !== null ) {
      
      invalidFields.push('Grupo de Faturamento');
    }

    if (!form.controls['businessLocal'].disabled && validateObject(form.value.businessLocal) !== null) {
      
      invalidFields.push('Local de Negócio');
    } 

    if (!form.controls['product'].disabled && validateObject(form.value.product) !== null ) {
      invalidFields.push('Produto');
    }

    if (invalidFields.length > 0) {
      this.messageService.error('INV-E012',_.join(invalidFields, ', '));
    }

    return invalidFields.length === 0;
  }

  onLoad(event : any) {
    const cache : any = {};
    _(event.taxes).each(tax=>{
      cache[tax.id.tax] = this.addTax(tax.id.tax, tax.sourceRetained, tax.tributed);
    });
      
    _(this.taxes).filter(tax => !!cache[tax.name]).each( tax => {
      tax.group = cache[tax.name];
    });

    if (!! event.emissionsCount && event.emissionsCount > 0) {
      const controls = FormUtils.getAllControls(this.form, 'businessLocal','customer','product','monthlyAmout','type','taxes');
      FormUtils.disableAll(controls);
      this.disableTaxes = true;
      if (this.form.controls.noteImportRecord.value !== null) {
        const controlsImport = FormUtils.getAllControls(this.form, 'description', 'emissionDay', 'dueDateDay', 'issueStart', 'issueEnd', 'inactive', 'dischargeNotice');
        FormUtils.disableAll(controlsImport);
        this.disableImport = true;
      }
    }
    this.cd.detectChanges();
  }

  onTaxChange(event: any, tax : any, taxType: string) {
    const taxesCtrl = this.form.get('taxes') as FormArray;
    const anyIndex = _.findIndex(taxesCtrl.value, t=> t.id.tax == tax.name)
    if (anyIndex < 0) {
      tax.group = this.addTax(tax.name, taxType == 'sourceRetained' ? true : false, taxType != 'sourceRetained' ? true : false);
    } else {
      _(this.taxes).filter(t=> t.name === tax.name).each(t=> t.group[taxType] = event.checked);
      taxesCtrl.value[anyIndex][taxType] = event.checked;
    }
    this.cd.detectChanges();
  }

  addTax(taxName:string, sourceRetained : boolean = false, tributed : boolean = false ) {
    const taxesCtrl = this.form.get('taxes') as FormArray;
    const group = this.builder.group({
      id : this.builder.group({
        tax : [taxName, Validators.required]
      }),
      sourceRetained : [sourceRetained],
      tributed: [tributed]
    });
    taxesCtrl.push(group);
    return group;
  }

  removeTax(index : number) {
    const taxesCtrl = this.form.get('taxes') as FormArray;
    taxesCtrl.removeAt(index);
  }

  displayCustomer(customer: any) {
    if (!customer) {
      return null;
    }
    return customer.sapCode + ' - ' + customer.name;
  }
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

