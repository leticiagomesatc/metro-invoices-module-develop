import { Component, Input, Injectable } from '@angular/core';
import { FormControl, ValidatorFn, AbstractControl } from '@angular/forms';



import * as _ from 'lodash';


const DEFAULT_INVLAD = { name: 'invalid', message: 'Campo inválido.' };
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g
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
    { name: 'pattern', message: 'Expressão inválida.' },
    { name: 'minsize', message: 'Por favor, insira no mínimo {{minSize}} na lista.' },
    { name: 'maxsize', message: 'Por favor, insira no máximo {{maxSize}} na lista.' },
    DEFAULT_INVLAD

];



@Injectable()
export class FwValidateService {


    messageA(control: AbstractControl): string {
        if (!control) {
            return null;
        }

        if (!control.invalid) {
            return null;
        }

        const first = this.getFirst(control, ERRORS);
        if (!!first) {
            return first;
        }

        const keys = _.keys(control.errors)
        const defaultMsg = DEFAULT_INVLAD.message;
        console.warn(`Message not found for validation errors ${keys}`);

        return `${defaultMsg} ${keys}`;
    }

    message(control: AbstractControl): string {
        if (!control) {
            return null;
        }

        if (!control.invalid) {
            return null;
        }

        const first = this.getFirst(control, ERRORS);
        if (!!first) {
            return first;
        }

        const keys = _.keys(control.errors)
        const defaultMsg = DEFAULT_INVLAD.message;
        console.warn(`Message not found for validation errors ${keys}`);

        return `${defaultMsg} ${keys}`;
    }

    private getFirst(control: AbstractControl, list : any[]) {
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            if (control.hasError(element.name)) {
                return FwValidateService.render(element.message, control.getError(element.name))
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