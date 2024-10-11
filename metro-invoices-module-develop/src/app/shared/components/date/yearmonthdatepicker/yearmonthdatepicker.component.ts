import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

import {  MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {Platform, PlatformModule} from '@angular/cdk/platform';


// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
    parse: {
        dateInput: 'MM/YYYY',
    },
    display: {
        dateInput: 'MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
    }
};

/** @title Datepicker emulating a Year and month picker */
@Component({
    selector: 'fw-year-month',
    template: `
    <mat-form-field [fxFlex]="flex"> 
        <input  matInput name="comp" [placeholder]="label"
            [matDatepicker]="dp" autocomplete="off" readonly [formControl]="date">
        <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
        <mat-datepicker #dp startView="multi-year" disabled="false"
        (yearSelected)="chosenYearHandler($event)"
        (monthSelected)="chosenMonthHandler($event, dp)" >
        </mat-datepicker>
        <button *ngIf="!!date.value " mat-icon-button matSuffix (click)="date.setValue(null)" >
            <mat-icon>delete</mat-icon>
        </button>
    </mat-form-field>
  
  `,
    providers: [
        // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
        // application's root module. We provide it at the component level here, due to limitations of
        // our example generation script.
        
        { provide: DateAdapter, useClass: NativeDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
    ],
})
export class YearMonthDatePicker implements OnInit {

    date = new FormControl();
    @Input()
    label: string;

    @Input()
    value: any;

    @Output()
    valueChange: EventEmitter<any> = new EventEmitter();

    @Input()
    flex : string;

    ngOnInit(): void {
        if (!!this.value) {
            this.date.setValue(this.value);
        }
    }

    chosenYearHandler(normalizedYear: any) {
        let ctrlValue = this.date.value;
        if (!ctrlValue) {
            ctrlValue = new Date();

        }
        ctrlValue.setYear(normalizedYear.getFullYear());
        this.date.setValue(ctrlValue);
    }

    chosenMonthHandler(normalizedMonth: any, datepicker: any) {
        const ctrlValue = this.date.value;
        ctrlValue.setMonth(normalizedMonth.getMonth());
        ctrlValue.setDate(1);
        this.date.setValue(ctrlValue);

        this.valueChange.emit(ctrlValue);
        datepicker.close();
    }

}