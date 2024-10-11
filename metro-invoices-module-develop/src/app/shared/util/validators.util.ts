import { FormControl } from '@angular/forms';

export class ValidatorsUtil {
   
    static DATE_PATTERN =  /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g;

   static date(control: FormControl): { [key: string]: any } | null {
       if (!control.value || !(control.value instanceof String) ) {
           return null;
       }

       if (!control.value.match(ValidatorsUtil.DATE_PATTERN))
           return { "date": true };

       return null;
   }

   static usDate(control: FormControl): { [key: string]: any } | null {
       let usDatePattern = /^02\/(?:[01]\d|2\d)\/(?:19|20)(?:0[048]|[13579][26]|[2468][048])|(?:0[13578]|10|12)\/(?:[0-2]\d|3[01])\/(?:19|20)\d{2}|(?:0[469]|11)\/(?:[0-2]\d|30)\/(?:19|20)\d{2}|02\/(?:[0-1]\d|2[0-8])\/(?:19|20)\d{2}$/;

       if (!control.value.match(usDatePattern))
           return { "usDate": true };

       return null;
   }

   static email(control: FormControl): { [key: string]: any } | null {
        let emailPattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

        if (control.value && !control.value.match(emailPattern))
            return { "email": true };

        return null;
    }

    static minArrayLength(min: number, object: string): {[key: string]:any} | null {
        return function (control) {
            if(!ValidatorsUtil.isArray(control.value)) return null;
            var length = control.value ? control.value.length : 0;
            (control.value.length < min) ?  { "minArray": { 'requiredLength': min, 'actualLength': length, object: object } } : null
        };
    }

    static maxArrayLength(max:number, object: string): {[key: string]:any} | null {
        return function (control) {
            if(!ValidatorsUtil.isArray(control.value)) return null;
            var length = control.value ? control.value.length : 0;
            (control.value.length > max) ?  { "maxArray": { 'requiredLength': max, 'actualLength': length, object: object } } : null
        };
     }

     static isArray(value: any) : boolean {
        return value && Array.isArray(value);
     }


     
   
}

export const MASKCLIENT: string = '9999999999999999999999999999999999999999999999';