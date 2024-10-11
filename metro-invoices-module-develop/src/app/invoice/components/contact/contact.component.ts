import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { ContactIntegrationService } from '../../services/contact-integration.service';
import { Observable, from } from 'rxjs';
import { startWith, map, finalize } from 'rxjs/operators';
import { OperatorService } from 'src/app/invoice/services/operator.service';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { ContactService } from '../../services/contact.service';

const NAO_SINCRONIZADO = 'Não Sincronizado';
const ERRO_SINCRONIZACAO = 'Erro de Sincronização';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  cols = [
    { title: 'Operadora', prop: 'operatorName' },
    { title: 'Grupo de Faturamento', prop: 'customerName' },
    { title: 'Nome', prop: 'contactName' },
    { title: 'E-mail', prop: 'email' },
    { title: 'Telefone', prop: 'fone' },
    { title: 'Tipo', prop: 'contactType' },
    { title: 'Usuário', prop: 'userName' },
    { title: 'Data/Hora Registro', prop: 'dateTimeRecords' },
    { title: 'Situação Integração', prop: 'statusIntegration' },
    { title: '', prop: 'buildErrorHint', hintCondition: hintCondition, enableHint: true },
  ];

  actions = [
    {
      // title : 'Ações',
      action: 'actions',
      subActions: [
        {
          title: 'Gerar arquivo de integração',
          condition: generateIntegrationCondition,
          action: 'generate_integration_contact_file',
          // role: userRoles.invoiceCalcGenerateIntegration,
          icon: { name: 'done' }
        }
      ]
    }
  ];

  @ViewChild('search') search: any;

  hideSpinner = false;
  requiredRolesToView = ''; // userRoles.inImportFileInclude

  customerControl = new FormControl();
  operatorControl = new FormControl();

  customers: { name: string, id: number, selected: boolean }[] = [];
  filteredList: { name: string, id: number, selected: boolean }[] = [];
  allOperators: { name: string, id: number, selected: boolean }[] = [];
  allContactType: { id: number, descricao: string}[] = [];

  //public allOperatorsFilter: { name: string, id: number, selected: boolean }[] = [];
  public allCustomers: { name: string, id: number, selected: boolean }[] = [];
  public filteredOperators: Observable<{ name: string, id: number, selected: boolean }[]>;
  public filteredCustomers: Observable<{ name: string, id: number, selected: boolean }[]>;

  typeControl = new FormControl();

  idsNotProcessed = [];

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  };

  constructor(
    public authService: AuthService,
    private messageService: MessageService,
    private contactIntegrationService: ContactIntegrationService,
    private customerService: CustomerService,
    private contactService: ContactService,
    private operatorService: OperatorService
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.types();
    this.renderOperators();
    this.renderCustomers();
  }

  isNotString(value: any): boolean {
    return typeof value !== 'string';
  }

  setType(value): void {
    this.search.filters.contactType = value;
  }

  executeSearch() {
    this.search.filters.idContactOperator = this.search.filters.operator ? this.search.filters.operator.id : null;
    this.search.filters.customerId = this.search.filters.customer ? this.search.filters.customer.id : null;
    this.getContactTypeFromId(this.search.filters.contactType);
    this.search.filters.continueSearch = true;
  }

  getContactTypeFromId(value:any):any{
    if(value != null){
      this.search.filters.contactTypeId = [];
      value.forEach(element => {
        this.search.filters.contactTypeId.push(element.id);
      });
    }
  }

  executeAction(event: any) {
    if (event.action.action === 'generate_integration_contact_file') {
      this.generateUniqueContact(event.line.id);
    }
  }

  selectionCondition(item: any) {
    return true;
  }

  onlyNumbers(event: Event) {
    const inputData = (event.target as HTMLInputElement).value;
    let extractedFte = inputData.replace(/[^0-9.]/g, '').replace('.', 'x')
      .replace(/\./g, '').replace('x', '.');

    extractedFte = extractedFte.replace(/^(\d+.?\d{0,2})\d*$/, '$1');
    (event.target as HTMLInputElement).value = extractedFte;
  }

  clearType() {
    this.typeControl.reset();
  }

  messageResultArray(value: any) {
    value.forEach(element => {
      this.showMessageSuccess(element);
      this.showMessageError(element);
    });
  }

  showMessageSuccess(element: any) {
    if (element.type === 'SUCCESS') {
      this.messageService.showInlineMessage(Severity.INFO, element.message);
    }
  }

  showMessageError(element: any) {
    if (element.type === 'ERROR') {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }

  generateUniqueContact(contactId: number) {
    this.search.hideSpinnerMenu = false;
    this.contactIntegrationService.generateFileContact(contactId).subscribe((resp) => {
      resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E056');
      this.search.hideSpinnerMenu = true;
      this.search.search(true);
    },
      (e) => {
        this.messageService.dealWithError(e);
        this.search.hideSpinnerMenu = true;
        this.search.search(true);
      },
      () => this.search.hideSpinnerMenu = true
    );
  }

  generateContacts() {
    this.idsNotProcessed = [];
    if (!this.search.selectionList || !this.search.selectionList.length) {
      this.messageService.error('INT-E001');
    } else {
      this.search.hideSpinnerMenu = false;
      const idsContacts = this.search.selectionList.map(item => item.id);

      if (idsContacts.length > 0) {
        this.contactIntegrationService.generateFileContacts(idsContacts).subscribe((resp) => {
          resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E061');
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        },
          (e) => {
            this.messageService.dealWithError(e);
            this.search.hideSpinnerMenu = true;
            this.search.search(true);
          },
          () => this.search.hideSpinnerMenu = true);
      }

    }
  }

  public renderOperators() {
    this.search.filters.operator = null;
    this.operatorControl.disable();
    this.operatorService.findAutocompleteOperatorsInactive(true)
    .pipe(finalize(() => {
      this.operatorControl.enable();
      this.filteredOperators = this.operatorControl.valueChanges.pipe(
        startWith(''),
        map(s => s ? this.filterOperators(s) : this.allOperators.slice())
      );
    }))
    .subscribe((result: any) =>{
      this.allOperators = result;
    });
  }

  private filterOperators(value: string | any): {id: number, name: string, selected: boolean}[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allOperators.filter(operator => operator.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.allOperators.filter(operator => operator.id === value.id);
    }
  }

  displayOperator(operator:any) {
    if (!operator) {
      return null;
    }
    return operator.name;
  }  

  public types(): void{
      this.contactService.getContactsType('type').subscribe((result: any) =>{
        this.allContactType = result;
      });
  }


  public renderCustomers() {
    this.search.filters.customer = null;
    this.customerControl.disable();
    if (this.search.filters.operator != null && this.isNotString(this.search.filters.operator)) {
      this.customerService.findAutocompleteCustomersIdOperatorAndInactive(this.search.filters.operator.id, true)
      .pipe(finalize(() => {
        this.customerControl.enable();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterCustomers(s) : this.allCustomers.slice())
        );
      }))
      .subscribe((result: any[]) =>{
        this.allCustomers = result;
      });
    } else {
      this.customerService.findAutocompleteCustomersInactive(true)
      .pipe(finalize(() => {
        this.customerControl.enable();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterCustomers(s) : this.allCustomers.slice())
        );
      }))
      .subscribe((result: any[]) =>{
        if(this.search.filters.operator == null){
          this.allCustomers = result;
        }
      });
    }

  }

  private filterCustomers(value: string | any): {id: number, name: string, selected: boolean}[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.allCustomers.filter(customer => customer.name.toLowerCase().indexOf(value.name) === 0);
    }
  }

  displayCustomer(customer:any) {
    if (!customer) {
      return null;
    }
    return customer.name;
  }


}

function generateIntegrationCondition(element: any) {
  return element && (element.statusIntegration === NAO_SINCRONIZADO || element.statusIntegration === ERRO_SINCRONIZACAO);
}

function hintCondition(element: any) {
    return !!element.buildErrorHint.length && element.statusIntegration == ERRO_SINCRONIZACAO;
}
