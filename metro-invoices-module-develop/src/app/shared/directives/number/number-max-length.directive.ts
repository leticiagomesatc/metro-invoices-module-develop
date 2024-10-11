import { Directive, Input, HostListener, Renderer2, ElementRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Directive({
	selector: '[numberMaxLength]'
})
export class NumberMaxLengthDirective implements ControlValueAccessor, OnInit {

	@Input() numberMaxLength: number;
	@Input() onlyInt: boolean;
	@Input() maxFractionDigits: number;

	onChange: any;
	onTouched: any;
	numberOfDotsAllowed: number = 1;

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer2,
		private control: NgControl
	) {}

	ngOnInit() {

		this.numberMaxLength = isNaN(this.numberMaxLength) ? 9 : this.numberMaxLength;

	}

	writeValue(value: any): void {

		this.control.control.setValue(value);
   		this.renderer.setProperty(this.elementRef.nativeElement, 'value', value);

	}

	removeNonNumbers(value: string, removeDot?: boolean): string {

		return removeDot ? value.replace(/\D/g, '') : value.replace(/[^0-9\.]/g, '');

	}

	@HostListener('input', ['$event.target.value']) oninput(value: string) {

		if(value) {

			if(this.onlyInt) {

				value = this.removeNonNumbers(value, true);

				if(value && value.length > this.numberMaxLength) {

					value = value.slice(0, this.numberMaxLength);

				}

			} else {

				let numberOfDots = (value.match(/\./g) || []).length;

				if(numberOfDots > this.numberOfDotsAllowed) {

					const firstIndexOf = value.indexOf('.');
					const firstSlice = value.slice(0, firstIndexOf + 1);
					const secondSlice = value.slice(firstIndexOf + 1);

					numberOfDots = this.numberOfDotsAllowed;
					value = firstSlice + this.removeNonNumbers(secondSlice, true);

				}

				value = value.length === 1 ? this.removeNonNumbers(value, true) :  this.removeNonNumbers(value);

				if(value && value.length > this.numberMaxLength + numberOfDots) {

					value = value.slice(0, this.numberMaxLength + numberOfDots);

				}

			}

			this.writeValue(value);

		}

	}

	registerOnChange(fn: any): void {

		this.onChange = fn;

	}

	registerOnTouched(fn: any): void {

		this.onTouched = fn;

	}

	setDisabledState?(isDisabled: boolean): void {

		throw new Error('Method not implemented.');

	}

}
