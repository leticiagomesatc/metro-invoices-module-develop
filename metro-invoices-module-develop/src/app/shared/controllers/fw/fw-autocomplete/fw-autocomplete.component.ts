import { Component, Input, Output, OnInit, EventEmitter, Host, Inject, forwardRef, Optional } from '@angular/core';
import { FormControl } from '@angular/forms';

import { MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform, PlatformModule } from '@angular/cdk/platform';
import { Observable, from, Subject, Subscription } from 'rxjs';

import { startWith, map, flatMap, filter, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {FwSearchService} from '../fw-search/fw-search.service';
import { Pageable } from '../../../util/pageable';
import { FwController } from '../fw-controller';
import { FwValidateService } from '../fw-validate/fw-validate.service';

@Component({
    selector: 'fw-autocomplete',
    template: `
    <mat-form-field fxFlex="{{flex}}">
        <input matInput type="text" 
            placeholder="{{label}}" 
            [formControl]="control"
            [matAutocomplete]="auto" autocomplete="off">

        <mat-autocomplete #auto="matAutocomplete" 
            (optionSelected)='onSelect($event.option.value)' 
            [displayWith]="displayField" >

            <mat-option *ngFor="let option of matches | async" [value]="option">
                {{renderOption(option)}}
            </mat-option>

        </mat-autocomplete>
        <mat-error>{{validate.message(control)}}</mat-error>
    </mat-form-field>
`
})
export class FwAutocompleteComponent {


    @Input()
    flex: string;

    @Input()
    label : string;

    @Input()
    fields: string = 'id,name,description';

    @Input()
    path : string;

    @Input()
    control = new FormControl();

    @Input()
    displayFn : Function = tryDisplayName;

    @Input()
    matchesDisplayFn : Function = tryDisplayName;
    
    @Input()
    value: any;

    @Output()
    valueChange: EventEmitter<any> = new EventEmitter();


    @Input()
    onSelectEmmit : string | Function = 'object';

    @Input()
    mapAs: string;

       
    matches: Observable<any[]>;

    @Input()
    subscribeTo : any | any[];


    private subcriptions : Subscription[] = [];

    constructor(
        private fwService : FwSearchService,
        public validate : FwValidateService) {
        
    }

    onSelect(value: any) {
        let valueToEmit;

    
        if (this.onSelectEmmit == 'object') {
            valueToEmit = value;
            if (!!this.mapAs) {
                valueToEmit._mapAs = this.mapAs;
            }
        } else if (typeof this.onSelectEmmit === 'string'){
            valueToEmit = value[this.onSelectEmmit.toString()];
        } else if (this.onSelectEmmit instanceof Function){
            valueToEmit = this.onSelectEmmit(value);
        }


        this.valueChange.emit(valueToEmit);
    }

    onParentEvent(evt : any) {
        if (evt.name === 'clear') {
            this.value = null;
            this.control.reset();
        }
    }

    private trySubscribeTo(object : any) {
        if ( object.subject && object.subject instanceof Subject) {
            this.subscribe(<Subject<any>> object.subject);
        } else if (object instanceof Subject) {
            this.subscribe(<Subject<any>> object);
        }else if (object instanceof Array) {
            (<Array<any>>object).forEach(item=> this.trySubscribeTo(item));
        }
    }
     
    private subscribe(subject : Subject<any>) {
        const sb = subject.subscribe(
            evt => this.onParentEvent(evt)
        );

        this.subcriptions.push(sb);
    }

    ngOnInit() {
        
        if (!!this.subscribeTo) {
            this.trySubscribeTo(this.subscribeTo);
        }

        this.matches = this.control.valueChanges
            .pipe(
                startWith(''),

                debounceTime(250),
                filter(value => !!value && value.length > 2),
                distinctUntilChanged(),
                switchMap(value => value ?
                    from(this.fwService.search(this.path, { name: value, fields : this.fields }, new Pageable(0, 10), null))
                    : from(Promise.resolve({ content: [] }))
                ),
                map(a => a.content)
            );

    }

    displayField(line : any) {
        return tryDisplayName(line);
    }

    renderOption(line : any) {
        return tryDisplayName(line);
    }

}

function tryDisplayName(line : any) : string {
    if (!line) {
        return null;
    }
    if (line.name) {
        return line.name;
    }
    if (line.description) {
        return line.description;
    }
    
    return null;
}