import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'map' })
export class MapPipe implements PipeTransform {
    transform(value: any, prop: string): any {
        if (!prop || !value) {
            return value;
        }

        if (value instanceof Array) {
            return value.map(v=>v[prop]); 
        } else {
            return value[prop];
        }
    }
}