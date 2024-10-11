import { FormArray, FormControl, FormGroup, AbstractControl } from '@angular/forms';
import * as _ from 'lodash';

export class FormUtils {

	static markChildrenAsDirty(formItem: AbstractControl) {

		if (formItem instanceof FormGroup) {

			const keys = Object.keys(formItem.controls);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const item = formItem.get(key);
				FormUtils.markChildrenAsDirty(item);
			}

		} else if (formItem instanceof FormArray) {

			for (let j = 0; j < formItem.controls.length; j++) {

				FormUtils.markChildrenAsDirty(formItem.controls[j]);

			}

		} else if (formItem instanceof FormControl) {

			formItem.markAsDirty();
			formItem.markAsTouched();

		}

	}

	static setCheckbokDefault(object: any, property: string) {
		if (!object[property]) {
			object[property] = false;
		}
	}

	static enableAndValidate(control: AbstractControl, validators?: any) {

		control.enable();
		control.setValidators(validators);
		control.updateValueAndValidity();
	}

	static enableAndValidateAll(controls: AbstractControl[], validators?: any) {

		controls.forEach(control => FormUtils.enableAndValidate(control, validators));

	}

	static disableAndClear(control: AbstractControl) {

		control.reset();
		control.disable();
		control.clearValidators();
	}

	static disableAndClearAll(controls: AbstractControl[]) {

		controls.forEach(control => FormUtils.disableAndClear(control));

	}

	static disable(control: AbstractControl) {

		
		control.disable();

		if (control instanceof FormGroup) {
			const fg = control as FormGroup;

			const keys = Object.keys(fg.controls);

			keys.forEach(key => {
				FormUtils.disable(fg.get(key));
			});
		}

		if (control instanceof FormArray) {
			const fg = control as FormArray;

			const keys = Object.keys(fg.controls);

			keys.forEach(key => {
				FormUtils.disable(fg.get(key));
			});
		}
		
	}

	static disableAll(controls: AbstractControl[]) {

		
		controls.forEach(control => FormUtils.disable(control));
		
	}

	static patch(form: FormGroup, valuePatch: any) {

		form.patchValue(valuePatch);

		FormUtils.patchArrays(form, valuePatch, '');
	}

	static patchArrays(form: FormGroup, valuePatch: any, prefix: string) {

		Object.keys(valuePatch).forEach((key: any) => {
			if ((valuePatch[key] instanceof Array)) {
				if (valuePatch[key].length > 0) {

					const formArray = (form.get(prefix + key) as FormArray);
					if (formArray && formArray.controls.length === 0) {
						valuePatch[key].forEach((value, index) => formArray.setControl(index, new FormControl()));

						formArray.patchValue(valuePatch[key]);

						form.get(prefix + key).patchValue(formArray.value);
					}

				}
			} else if ((valuePatch[key] instanceof Object)) {
				FormUtils.patchArrays(form, valuePatch[key], prefix + key + '.');
			}

		});
	}

	static validateFormRecursivelyRequired(form: FormGroup, controlsToIgnore: string[], errorType?: string): boolean {

		const keys = Object.keys(form.controls);

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const item = form.get(key);

			if (item instanceof FormGroup) {

				if (FormUtils.validateFormRecursivelyRequired(item, controlsToIgnore, errorType)) {
					return true;
				}

			} else if (item instanceof FormArray) {

				const itemArray = item as FormArray;

				for (let j = 0; j < itemArray.controls.length; j++) {
					if (itemArray.controls[j].invalid
						&& (itemArray.controls[j].hasError(errorType) || FormUtils.hasErrorPrefix(itemArray.controls[j], errorType))) {
						return true;
					}
				}

			} else if (!controlsToIgnore.includes(key)) {

				if (item.invalid && (item.hasError(errorType) || FormUtils.hasErrorPrefix(item, errorType))) {
					return true;
				}

			}

		}

		return false;

	}

	static hasErrorPrefix(control: AbstractControl, prefix: string): boolean {

		if (!control.errors) {
			return false;
		}

		const keys = Object.keys(control.errors);

		for (let i = 0; i < keys.length; i++) {
			if (keys[i].indexOf(prefix) !== -1) {
				return true;
			}
		}

		return false;
	}

	static resetValues(form: FormGroup, pathList: string[]) {

		pathList.forEach((path) => form.get(path).reset());

	}

	static getAllFieldsRecursively(form: FormGroup, pathList?: string[], prefix: string = ''): FormControl[] {
		let array = [];

		if (!form.controls) {
			return array;
		}

		const keys = Object.keys(form.controls);

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const item = form.get(key);
			if (item instanceof FormGroup) {

				array = array.concat(FormUtils.getAllFieldsRecursively(item, pathList, `${prefix}${key}.`));

			} else if (item instanceof FormArray) {

				continue;

			} else if (!pathList || pathList.includes(prefix + key)) {

				array.push(item);

			}
		}

		return array;
	}

	static getAllControls(form: FormGroup, ... pathList: string[]): AbstractControl[] {

		return _(pathList).map(path => form.get(path)).value();

	}

	static resetValuesExclude(form: FormGroup, pathList: string[], prefix ?: string) {

		if (!prefix) {
			prefix = '';
		}

		Object.keys(form.controls).forEach(key => {

			const item = form.get(key);

			if (item instanceof FormGroup) {

				FormUtils.resetValuesExclude(item, pathList, `${prefix + key}.`);

			}

			if (!pathList.includes(prefix + key)) {

				item.reset();

			}

		});

	}

}
