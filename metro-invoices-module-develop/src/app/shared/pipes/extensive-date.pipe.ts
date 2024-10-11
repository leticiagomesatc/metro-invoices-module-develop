import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({ name: 'extensiveDate' })
export class ExtensiveDatePipe implements PipeTransform {

    transform(date: Date, method: string, locale: string) {
        this[method](date, locale)
    }

    public monthAsTitle(date, locale): string {
        return new DatePipe(locale).transform(date, 'MMM y', locale);
    }

}