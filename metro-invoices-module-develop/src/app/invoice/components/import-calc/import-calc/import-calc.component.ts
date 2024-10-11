import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { InputFileComponent, InputFile } from 'ngx-input-file';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize, startWith, map } from 'rxjs/operators';
import { FileService } from './../../../services/file.service';

@Component({
  selector: 'app-import-calc',
  templateUrl: './import-calc.component.html',
  styleUrls: ['./import-calc.component.scss']
})


export class ImportCalcComponent implements OnInit {

  @ViewChild('search') search: any;
  @ViewChild('inputComponent') inputComponent: InputFileComponent
  @ViewChild('fileName') fileName: ElementRef;

  hideSpinner: boolean = false;
  inputFileModel: InputFile[];
  requiredRolesToView: string = ""; // userRoles.inImportFileInclude
  hasFile: Boolean = false;
  customers: { name: string, id: number, selected: boolean }[] = [];
  filteredList: { name: string, id: number, selected: boolean }[] = [];
  filteredCustomers: Observable<{ name: string, id: number, selected: boolean }[]>;

  customerControl = new FormControl();
  customerSelect: boolean = false;
  customerSelectId: number;

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }

  constructor(
    public authService: AuthService,
    private messageService: MessageService,
    private customerService: CustomerService,
    private fileService: FileService
  ) { }

  ngOnInit() {
    this.getCustumers();
    this.search.filters.continueSearch = false;
    // this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
    this.inputComponent.onSelectFile = (fileList, button) => {
      if (!this.inputComponent.disabled) {
        var files_1 = [];
        Array.from(fileList).forEach(function (file) {
          var inputFile = { file: file };
          if (this.fileGuard(this, files_1, inputFile)) {
            files_1.push(inputFile);
            this.acceptFile(inputFile);
          }
        });
        this.inputComponent.writeValue(files_1);
        this.inputComponent.fileInput.nativeElement.value = '';
      }
    };
  }

  filterCustomers(value: string | any): { id: number, name: string, selected: boolean }[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.customers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.customers.filter(customer => customer.name.toLowerCase().indexOf(value.name) === 0);
    }
  }

  getCustumers(): void {
    this.customerControl.disable();
    this.customerService.findAutocompleteCustomersInactive(false)
      .pipe(finalize(() => {
        this.customerControl.enable();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterCustomers(s) : this.customers.slice())
        );
      }))
      .subscribe((result: any[]) => {
        this.customers = result;
        this.filteredList = this.customers;
      });
  }

  acceptFile(file) {
    this.fileName.nativeElement.value = file.file.name;
    this.hasFile = true;
  }

  deleteFile(index) {
    this.fileName.nativeElement.value = '';
    this.hasFile = false;
  }

  rejectFile(_this, problem) {
    switch (problem.reason) {
      case _this.inputFileRejectedReason.badFile:
        _this.messageService.error('INV-EF01'); break;
      case _this.inputFileRejectedReason.limitReached:
        _this.messageService.error('INV-EF02'); break;
      case _this.inputFileRejectedReason.sizeReached:
        _this.messageService.error('INV-EF03'); break;
    }
  }

  rejectFileSimple(problem) {
    switch (problem.reason) {
      case this.inputFileRejectedReason.badFile:
        this.messageService.error('INV-EF01'); break;
      case this.inputFileRejectedReason.limitReached:
        this.messageService.error('INV-EF02'); break;
      case this.inputFileRejectedReason.sizeReached:
        this.messageService.error('INV-EF03'); break;
    }
  }

  invokeUploadModal() {
    this.inputComponent.fileInput.nativeElement.click();
  }

  cleanFilterCustomer() {
    this.search.filters.customer = null;
    this.search.filters.customerId = null;
  }

  upload() {
    this.hideSpinner = true;
    this.customerControl.disable();
    let file = this.inputFileModel[this.inputFileModel.length - 1].file;
    this.fileService.importMemoryCalc(file, this.customerSelectId.toString()).subscribe(_ => {
      this.messageService.success('IMP-INVOICE-CALC');
      this.hideSpinner = false;
      this.customerControl.enable();
    },
      (e) => {
        if (e.error.message) {
          e.error.message == 'Arquivo incorreto' ?
            this.messageService.error('INV-E060') :
            this.messageService.error('IMP-INV_CALC_FIELDS', e.error.message);
        } else {
          this.messageService.dealWithError(e);
        }
        this.hideSpinner = false;
        this.customerControl.enable();
      }
    );
  }

  remove() {
    this.inputComponent.onDeleteFile(0);
  }

  displayCustomer(customer: any) {
    if (!customer) {
      return null;
    }
    return customer.name;
  }

  selectAutocomplete(evento): void {
    let select = this.customerControl.value;
    this.filteredList = this.customers.filter(x => {
      return x.id == select.id
    });
  }

  selectCustomerList(item): void {
    this.customerSelect = item;
    if (item && item.id) {
      this.customerSelectId = item.id
    }
  }

  // Método para resetar is itens da lista, qdo limpar o campo de autocomplete
  cleanList() {
    if (this.customerControl.value == "") {
      this.customerSelect = false;
      this.customerSelectId = null;
      this.filteredList = this.customers;
      this.deleteFile(null);
      // Limpar a classe que mantem o grupo selecionado
      let checked = document.querySelector('.mat-radio-checked');
      checked ? checked.classList.remove('mat-radio-checked') : null;
    }
  }

}

function hintCondition(element: any) {
  return !!element.buildErrorHint.length;
}
