import { Directive, Input } from '@angular/core';

@Directive({
    selector: 'ngInit',
    exportAs: 'ngInit'
})
export class NgInit {

    @Input() val: any = {};

    @Input() obj : any;
    @Input() prop : string;

    @Input() ngInit;

    ngOnInit() {
        if (this.ngInit) { this.ngInit(); }

        if (this.obj && this.prop && this.val) {
            this.obj[this.prop] = this.val;
        }
    }
}