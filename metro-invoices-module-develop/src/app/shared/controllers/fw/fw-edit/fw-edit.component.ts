import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import * as _ from 'lodash';
import { MessageService } from '../../../communication/message.service';
import { Severity } from '../../../communication/severity.enum';

import { Subject, empty, Observable, TimeoutError } from 'rxjs';
import { FwController } from '../fw-controller';
import { FormGroup } from '@angular/forms';
import { FwEditService } from './fw-edit.service';
import { switchMap, map } from 'rxjs/operators';
import { FormUtils } from '../../../util/form-utils';
import { resolve } from 'url';
import { MatDialog, MatDialogRef } from '@angular/material';
import { InvoiceCalcService } from 'src/app/invoice/services/invoice-calc.service';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';


@Component({
  selector: 'fw-edit',
  templateUrl: './fw-edit.component.html',
  styleUrls : ['./fw-edit.component.scss']
})
export class FwEdit implements OnInit, FwController{

    @Input()
    options : any = {
        title : 'Edit',
        onCancel : 'redirectToPrevious',
        buttonSave: 'Salvar'        
    };

    subject : Subject<any> = new Subject();

    hideSpinnerEdit: boolean = true;
    
    @Input() 
    path :string;

    @Input()
    messageSave: string = 'AT-S002';

    @Input()
    messageErrorTimeout: string = 'Error time-out'

    @Input()
    saveButton: boolean = true;

    @Input()
    isResponseSave: boolean = false;

    @Input()
    overflowClass: boolean = false; 

    @Input()
    idCol :string = 'id';

    @Input()
    fields : string;

    @Input()
    form : FormGroup;

    @Input()
    routeTo : string;

    @Output()
    onClear = new EventEmitter<any>();

    @Output()
    onSave = new EventEmitter<any>();

    @Output()
    onLoad = new EventEmitter<any>();
    
    @Output()
    onSuccess = new EventEmitter<any>();
    
    @Input()
    isRedirectTo: boolean = true;

    @Input()
    hasDiscountInvoice: boolean = false;

    @Input()
    requestWithTimeout: boolean = false;

    @Input()
    validateFn : (formGroup : any) => any;

    @Input()
    serializeFn : (formGroup : any) => any;

    @Input()
    deserializeFn : (formGroup : any) => any;

    @Input()
    onSavePromise : (novoEscopo: any) => Promise<any>;
        
    private id : any; 
    
    novoEscopo: any;
    discountValid: Observable<any>

    dialogRef: MatDialogRef<any>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public dialog: MatDialog,
        private invoiceCalcService: InvoiceCalcService,
        private editService: FwEditService,
        private messageService : MessageService) {}

    ngOnInit(): void {
        if (this.path == null) {
            throw new Error("Define a path.");
        }

        if (this.form == null) {
            throw new Error("Define a form.");
        }

        let sb = this.route.paramMap.pipe(
            switchMap((params: any) => {
              this.id = params.get('id');
              return !this.id ? empty() : this.editService.load(this.path, this.id, this.fields)
            }),
            map(entity=> this.deserialize(entity))
        ).subscribe(
            (entity)=> {

                
                this.form.patchValue(entity);
                this.notifySuccessLoad(entity);
            },
            (error)=> this.dealWithError(error)
        );
    }

    protected deserialize(entity: any): { [key: string]: any; } {
        if (this.deserializeFn) {
            return this.deserializeFn(entity);
        }
        return entity;
    }
    
    protected serialize(entity: any): { [key: string]: any; } {
        if (this.serializeFn) {
            return this.serializeFn(entity);
        }
        return entity;
    }


    props(name: string) : any {


        if (!this.options || !this.options[name]) {
            const camelCaseName = 
                (!!this.id ? 'update' : 'insert') + 
                (name.length == 1? name.toUpperCase() : name.substring(0,1).toUpperCase() + name.substring(1) );

            if (!this.options[camelCaseName]) {
                return null;
            }

            return this.options[camelCaseName];
        }
        return this.options[name];
    }



    save() {
        this.onSave.emit();
        
        if(this.onSavePromise) {
            this.onSavePromise(this.novoEscopo).then(()=>{
                this.contentSave();
            })
        } else {
            this.contentSave();
        }
    }

    contentSave() {
        if (this.form.invalid || (!!this.validateFn && !this.validateFn(this.novoEscopo ? this.novoEscopo : this.form))) {
            this.messageService.error('AT-E002');
            FormUtils.markChildrenAsDirty(this.form);
            return;
        }
        
        this.hideSpinnerEdit = false;
        if(this.hasDiscountInvoice){
            this.validDiscountPending()
        }else{
            this.toRecord();
        }   
    }

    toRecord(){
        try {
            this.hideSpinnerEdit = false;
            if (!this.id) {
                this.editService.insert(this.path, this.serialize(this.form.value), this.requestWithTimeout)
                .subscribe(
                    (res) => this.notifySuccessInsert(res),
                    (error) => {
                        if (error instanceof TimeoutError) {
                            this.messageService.warning(this.messageErrorTimeout);
                            this.router.navigate([this.routeTo]);
                        }else{
                            this.dealWithError(error);
                        }
                        this.hideSpinnerEdit = true;
                    },
                    () => {
                        this.hideSpinnerEdit = this.hideSpinnerEdit = true;
                    }
                );
            } else {
                this.editService.update(this.path,this.id,this.serialize(this.form.value))
                    .subscribe(
                        (res)=> this.notifySuccessUpdate(res),
                        (error)=> { 
                            this.dealWithError(error);
                            this.hideSpinnerEdit = true;
                        },
                        () => { 
                             this.hideSpinnerEdit = true;
                        }
                    );
            }
        } catch (e) {
            this.messageService.error('AT-E001');
        }
    }

    validDiscountPending(): any{
        if(this.form.value.customerIds.length === 1 && this.form.value.tributeType != '2'){
            this.invoiceCalcService.getDiscountPending(this.form.value.customerIds[0], this.form.value.cmpControl).subscribe((valid: any) =>{
                if(valid){
                    this.showConfirmMessage('Existe um desconto calculado ainda pendente de aprovação para este cliente. Deseja prosseguir com a geração da memória de cálculo de \'Servico de Telecom\' sem esse desconto?', result => {
                       if(result.status == 'ok'){
                           this.toRecord();
                       }else{
                           if(this.form.value.tributeType === '0'){
                               this.form.value.generateICMSInvoice = false;
                               this.toRecord();
                           }else{
                               this.hideSpinnerEdit = true;
                           }
                       }
                    });
                }else{
                    this.toRecord();
                }
            });
        }else{
            this.toRecord();
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
      
    protected dealWithError(error : any) {
        this.messageService.dealWithError(error);
        
    }

    protected notifySuccessLoad(result : any) {
        this.onLoad.emit(result);
    }

    protected notifySuccessInsert(result : any) {
        if(this.onSuccess) {
            this.onSuccess.emit();
        }
        if (typeof result === "object" && this.isResponseSave) {
            this.messagesuccessArray(result);
        } else {
            this.messageSuccess();
        }
    }

    protected messageSuccess() {
      this.messageService.success(this.messageSave);
      if (this.routeTo && this.isRedirectTo) {
        this.router.navigate([this.routeTo]);
      }
    }

    protected messagesuccessArray(value: any) {
        value.forEach(element => {
            this.showMessageSuccess(element);
            this.showMessageError(element);
        });
        let redirOK = value.filter(v => v.redirectedTo === true);
        if (redirOK.length > 0 && this.isRedirectTo) {
            this.router.navigate([this.routeTo]);
        }
    }
    
    protected showMessageSuccess(element: any) {
        if (element.type === "SUCCESS") {
            this.messageService.showInlineMessage(Severity.INFO, element.message);
        }
    }

    protected showMessageError(element: any) {
        if (element.type === "ERROR") {
            this.messageService.showInlineMessage(Severity.ERROR, element.message);
        }
    }

    protected notifySuccessUpdate(result : any) {
        this.messageService.success('AT-S003');
        if (this.routeTo) {
            this.router.navigate([this.routeTo]);
        }
    }

    clear() {
        this.form.reset();

        this.subject.next({name:'clear'});

        this.onClear.emit();

    }

    cancel() {
        if (this.routeTo) {
            this.router.navigate([this.routeTo]);
        } else {
            this.router.navigate(this.route.parent.pathFromRoot);
        }
    }

   
        
}



