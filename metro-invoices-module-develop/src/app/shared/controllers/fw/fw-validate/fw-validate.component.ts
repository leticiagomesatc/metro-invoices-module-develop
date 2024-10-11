import { Component, Input, Directive, ElementRef } from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';



import * as _ from 'lodash';


const DEFAULT_INVLAD = { name: 'invalid', message: 'Campo inválido.' };

const ERRORS = [

    { name: 'required', message: 'Campo obrigatório.' },
    { name: 'requiredTrue', message: 'Campo obrigatório.' },
    { name: 'min', message: _.template('Valor deve ser maior ou igual a {{min}}.') },//{min: 3, actual: 2}
    { name: 'max', message: _.template('Valor deve ser menor ou igual a {{max}}.') },//{max: 3, actual: 2}
    { name: 'email', message: 'E-mail inválido.' },
    { name: 'date', message: 'Data inválida.' },
    { name: 'dateformat', message: 'Data inválida. Formato esperado \'{{dateFormat}}\'.' },
    { name: 'matdatepicker', message: 'Data inválida.' },
    { name: 'number', message: 'Número inválido.' },
    { name: 'integer', message: 'Número inválido.' },
    { name: 'decimal', message: 'Número inválido.' },
    { name: 'minlength', message: _.template('O valor mínimo para este campo é de {{requiredLength}} caracteres.') }, //{requiredLength: 3, actualLength: 2}
    { name: 'maxlength', message: _.template('O valor máximo para este campo é de {{requiredLength}} caracteres.') }, //{requiredLength: 3, actualLength: 2}
    { name: 'minArray', message: _.template('Por favor, selecione no mínimo {{minSize}} {{object}}.') }, //{requiredLength: 3, actualLength: 2}
    { name: 'maxArray', message: _.template('Por favor, selecione no máximo {{maxSize}} {{object}}') }, //{requiredLength: 3, actualLength: 2}
    { name: 'pattern', message: 'Expressão inválida.' },
    { name: 'minsize', message: 'Por favor, insira no mínimo {{minSize}} na lista.' },
    { name: 'maxsize', message: 'Por favor, insira no máximo {{maxSize}} na lista.' },
    DEFAULT_INVLAD

];



@Directive({
    selector: '[fw-validate]'
})
export class FwValidate {


    @Input()
    control: FormControl;

    @Input()
    newEntries : {name: string, message: any} | {name: string, message: any}[];

    @Input()
    validators : ValidatorFn[];

    constructor(el: ElementRef) {
        el.nativeElement.style.backgroundColor = 'yellow';
    }

    ngOnInit() {
        if (!!this.control && !!this.validators) {
            this.control.setValidators(this.validators);
        }
    }

    getErrorMessage(): string {
        if (!this.control) {
            return null;
        }

        if (!!this.newEntries) {

            if (this.newEntries instanceof Array) {
                const first = this.getFirst(this.newEntries);
                if (!!first) {
                    return first;
                }
            } else if (typeof this.newEntries === 'object') {
                if (!!this.newEntries.name && this.control.hasError(this.newEntries.name)) {
                    return FwValidate.render(this.newEntries.message, this.control.getError(this.newEntries.name))
                }
            }

        }

        const first = this.getFirst(ERRORS);
        if (!!first) {
            return first;
        }

        const keys = _.keys(this.control.errors)
        const defaultMsg = DEFAULT_INVLAD.message;
        console.warn(`Message not found for validation errors ${keys}`);

        return `${defaultMsg} ${keys}`;
    }

    private getFirst(list : any[]) {
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            if (this.control.hasError(element.name)) {
                return FwValidate.render(element.message, this.control.getError(element.name))
            }
        }
        return null;
    }

    private static render(message: any, params: any) {
        if (!message) {
            return `${DEFAULT_INVLAD.message} [msg: ???]`;
        }

        if (typeof message === 'string') {
            return message;
        } else if (typeof message === 'function') {
            return message(params);
        } else {
            return message;
        }
    }


}