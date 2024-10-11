import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import * as _ from 'lodash';
import { MatTableDataSource, MatSlideToggleChange } from '@angular/material';
import { Observable, from, empty } from 'rxjs';
import { startWith, debounceTime, filter, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { Pageable } from 'src/app/shared/util/pageable';
import { Location } from '@angular/common';
import { MessageService } from 'src/app/shared/communication/message.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { ActivatedRoute } from '@angular/router';
import { FwEdit } from 'src/app/shared/controllers/fw/fw-edit/fw-edit.component';

@Component({
  selector: 'app-dunning-edit',
  templateUrl: './dunning-edit.component.html',
  styleUrls: ['./dunning-edit.component.scss'],
})
export class DunningEdit {

  form: FormGroup;

  fields = `id,name,invoiceNoteApplied,debitNoteApplied,active,notification,notificationDueDays,duplicateBillet,duplicateBilletDueDays,duplicateBilletInterest,managerInCopy,emailsInCopy,letterNotification,letterNotificationDueDays,letterDuplicateBillet,letterDuplicateBilletDueDays,letterDuplicateBilletInterest,letterManagerInCopy,letterEmailsInCopy,suspensionActivated,suspensionDueDays,suspensionNotificationDay,suspensionNotificationManagerInCopy,deactivationActivated,deactivationDueDays,deactivationNotificationDay,deactivationNotificationManagerInCopy,negativationActivated,negativationDueDays,negativationNotificationDay,negativationNotificationManagerInCopy,emails,customers[id,name,cnpj,sapCode]`;

  filteredCustomers: Observable<any[]>;

  constructor(
    private route: ActivatedRoute,
    private builder: FormBuilder,
    public validate: FwValidateService,
    private customerService: CustomerService,
    private messageService: MessageService,
    public authService: AuthService) {
  }

  requiredRolesToInclude: string = userRoles.dunningInclude;
  requiredRolesToEdit: string = userRoles.dunningEdit;

  sourceAddedCustomers = new MatTableDataSource<any>();

  sourceAddedEmails: MatTableDataSource<Email> = new MatTableDataSource<Email>();

  paramId: string;

  continueEdit: boolean = false;

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
    _this.continueEdit = true
    _this.form = _this.builder.group({
      id: [],
      name: [null, Validators.required],
      invoiceNoteApplied: null,
      debitNoteApplied: null,
      inactive: null,
      customer: '',
      notification: null,
      notificationDueDays: null,
      duplicateBillet: null,
      duplicateBilletDueDays: null,
      duplicateBilletInterest: null,
      managerInCopy: null,
      emailsInCopy: null,
      letterNotification: null,
      letterNotificationDueDays: null,
      letterDuplicateBillet: null,
      letterDuplicateBilletDueDays: null,
      letterDuplicateBilletInterest: null,
      letterManagerInCopy: null,
      letterEmailsInCopy: null,
      suspensionActivated: null,
      suspensionDueDays: null,
      suspensionNotificationDay: null,
      suspensionNotificationManagerInCopy: null,
      deactivationActivated: null,
      deactivationDueDays: null,
      deactivationNotificationDay: null,
      deactivationNotificationManagerInCopy: null,
      negativationActivated: null,
      negativationDueDays: null,
      negativationNotificationDay: null,
      negativationNotificationManagerInCopy: null,
      emailToAdd: ['', Validators.email],
      emails: '',
      customers: []
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

  serializeFn(form: any) {
    form.active = !this.form.value.inactive
    
    for (const key in form) {
      if (key !== 'customers' && !this.fields.includes(key + ',')) {
        delete form[key]
      }
    }

    form.customers.forEach(element => {
      delete element.persisted
      for (const key in element) {
        if (!element[key] ||  element[key].length === 0) {
          delete element[key]
        }
      } 
    });

    return form;
  }

  deserializeFn(entity: any) {
    entity.inactive = !entity.active;
    delete entity.active;
    return entity
  }

  onLoad(entity: any) {
    if(entity.emails) { 
      this.sourceAddedEmails.data = entity.emails.split(';').map(item => { return { id: undefined, email: item } })
      this.form.value.emails = this.sourceAddedEmails.data.map(item => item.email).join(';');
    }
    this.sourceAddedCustomers.data = entity.customers
    this.organizeCustomers()
  }

  onSave() {
    this.organizeCustomers()
    this.form.value.emails = this.sourceAddedEmails.data.map(item => item.email).join(';');
  }

  addEmail() {
    const email = this.form.get('emailToAdd');
    email.updateValueAndValidity()
    if (email.value && email.valid) {
      if (!this.existsEmail()) {
        this.sourceAddedEmails.data.push({ id: undefined, email: this.form.value.emailToAdd })
        this.sourceAddedEmails._updateChangeSubscription()
        this.organizeEmails()
        email.reset()
      } else this.messageService.error('INV-E041', 'Email')
    }
  }

  deleteEmail(id: number) {
    if (this.existsEmail(id)) {
      this.sourceAddedEmails.data = _.remove(this.sourceAddedEmails.data, (n) => n.id !== id);
      this.sourceAddedEmails._updateChangeSubscription()
      this.organizeEmails();
    }
  }

  organizeEmails() {
    let idCount = 1
    this.sourceAddedEmails.data.forEach(item => item.id = idCount++);
  }

  existsEmail(id: number = undefined): boolean {
    return !!(this.sourceAddedEmails.data.find(element => element.email === this.form.value.emailToAdd || (id !== undefined && element.id === id)));
  }

  addCustomer() {
    const customer = this.form.get("customer")
    customer.updateValueAndValidity();
    if (customer.valid && this.form.value.customer.id) {
      const exists = !!(this.sourceAddedCustomers.data.find(element => element.id === this.form.value.customer.id));
      if (!exists) {
        this.sourceAddedCustomers.data.push(this.form.value.customer);
        this.sourceAddedCustomers._updateChangeSubscription();
        customer.reset();
      } else this.messageService.error('INV-E041', 'Grupo de Faturamento');
    }
  }

  deleteCustomer(id: any) {
    const exists = !!(this.sourceAddedCustomers.data.find(element => element.id === id));
    if (exists) {
      this.sourceAddedCustomers.data = _.remove(this.sourceAddedCustomers.data, (n) => id != n.id);
      this.sourceAddedCustomers._updateChangeSubscription();
    }
  }

  organizeCustomers() {
    this.form.value.customers = this.sourceAddedCustomers.data;
  }

  displayCustomer(customer: any) {
    if (!customer) {
      return null;
    }
    return customer.sapCode + ' - ' + customer.name;
  }

  changeToggle(field:string, event: MatSlideToggleChange) {
    const formField = this.form.get(field)
    
    formField.setValue(undefined)
    if(event.checked) {
      formField.setValidators([Validators.required, Validators.min(1)])
    } else {
      formField.clearValidators()
      formField.updateValueAndValidity()
    }
  }

}

function validateObject(value: any) {
  if (value == null || value == undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return { required: true };
  }

  return null;

}


export interface Email {
  id: number;
  email: string;
}