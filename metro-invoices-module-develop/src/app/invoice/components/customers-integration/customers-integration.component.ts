import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { InputFileComponent, InputFile } from 'ngx-input-file';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { CustomerService } from 'src/app/invoice/services/customer.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize, startWith, map } from 'rxjs/operators';
import { OperatorService } from './../../services/operator.service';
import { CustomerIntegrationService } from '../../services/customer-integration.service';
import { Severity } from 'src/app/shared/communication/severity.enum';


const NAO_SINCRONIZADO = 'Não Sincronizado';
const ERRO_SINCRONIZACAO = 'Erro de Sincronização';

@Component({
  selector: 'app-customers-integration',
  templateUrl: './customers-integration.component.html',
  styleUrls: ['./customers-integration.component.scss']
})


export class CustomersComponent implements OnInit {

  cols = [
    { title: 'Operadora', prop: 'operatorName' },
    { title: 'Grupo de Faturamento', prop: 'customerName' },
    { title: 'Código do Cliente', prop: 'customerSapCode' },
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
          action: 'generate_integration_customer_file',
          icon: { name: 'done' }
        }
      ]
    }
  ];

  

  @ViewChild('search') search: any;

  hideSpinner: boolean = false;
  requiredRolesToView: string = ""; // userRoles.inImportFileInclude
  customers: { name: string, id: number, selected: boolean }[] = [];
  filteredList: { name: string, id: number, selected: boolean }[] = [];
  filteredCustomers: Observable<{ name: string, id: number, selected: boolean }[]>;
  filteredOperators: Observable<{ name: string, id: number, selected: boolean }[]>;
  allOperators: { name: string, id: number, selected: boolean }[] = [];

  customerControl = new FormControl();
  operatorControl = new FormControl();
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
    private operatorService: OperatorService,
    private customerIntegrationService: CustomerIntegrationService
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.search.filters.inactiveCustomer = false;
    this.renderCustomers();
    this.renderOperators();
  }

  executeClear(previousFilters: any) {
    this.customerControl.reset;
    this.operatorControl.reset;
    this.renderOperators();
    this.renderCustomers();
  }

  isNotString(value: any): boolean {
    return typeof value !== "string";
  }

  public renderCustomers() {
    this.search.filters.customer = null;
    this.customerControl.disable();
    if (this.search.filters.operatorName != null && this.isNotString(this.search.filters.operatorName)) {
      this.customerService.findAutocompleteCustomersIdOperatorAndInactive(this.search.filters.operatorName.id, !this.search.filters.inactiveCustomer)
        .pipe(finalize(() => {
          this.customerControl.enable();
          this.filteredCustomers = this.customerControl.valueChanges.pipe(
            startWith(''),
            map(s => s ? this.filterCustomers(s) : this.customers.slice())
          );
        }))
        .subscribe((result: any[]) => {
          this.customers = result;
        });
    } else {
      this.customerService.findAutocompleteCustomersInactive(!this.search.filters.inactiveCustomer)
        .pipe(finalize(() => {
          this.customerControl.enable();
          this.filteredCustomers = this.customerControl.valueChanges.pipe(
            startWith(''),
            map(s => s ? this.filterCustomers(s) : this.customers.slice())
          );
        }))
        .subscribe((result: any[]) => {
          this.customers = result;
        });
    }

  }

  public renderOperators() {
    this.search.filters.operator = null;
    this.operatorControl.disable();
    this.operatorService.findAutocompleteOperatorsInactive(!this.search.filters.inactiveOperator)
      .pipe(finalize(() => {
        this.operatorControl.enable();
        this.filteredOperators = this.operatorControl.valueChanges.pipe(
          startWith(''),
          map(s => s ? this.filterOperators(s) : this.allOperators.slice())
        );
      }))
      .subscribe((result: any) => {
        this.allOperators = result;
      });
  }

  private filterOperators(value: string | any): { id: number, name: string, selected: boolean }[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.allOperators.filter(operator => operator.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.customers.filter(customer => customer.id === value.id);
    }
  }

  executeSearch() {
    this.search.filters.operatorId = this.search.filters.operatorName ? this.search.filters.operatorName.id : null;
    this.search.filters.customerId = this.search.filters.customerName ? this.search.filters.customerName.id : null;
    this.search.filters.continueSearch = true;
  }

  selectionCondition(item: any) {
    return true;
  }

  displayOperator(operator: any) {
    if (!operator) {
      return null;
    }
    return operator.name;
  }

  filterCustomers(value: string | any): { id: number, name: string, selected: boolean }[] {
    if (typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.customers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) === 0);
    } else {
      return this.customers.filter(customer => customer.name.toLowerCase().indexOf(value.name) === 0);
    }
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

  messageResultArray(value: any) {
    value.forEach(element => {
      this.showMessageSuccess(element);
      this.showMessageError(element);
    });
  }

  showMessageSuccess(element: any) {
    if (element.type === "SUCCESS") {
      this.messageService.showInlineMessage(Severity.INFO, element.message);
    }
  }

  showMessageError(element: any) {
    if (element.type === "ERROR") {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }

generateGroupIntegration() {
    
    if (!this.search.selectionList || !this.search.selectionList.length) {
      this.messageService.error('INT-E001');
    } else {
      this.search.hideSpinnerMenu = false;
      
      const ids = this.search.selectionList.map(list => list.id);
      if (ids && ids.length > 0) {
        this.customerIntegrationService.generateGroupIntegrationFile(ids)
          .subscribe(
            (resp) => {
              resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E056');
              this.search.hideSpinnerMenu = true;
              this.search.search(true);
            },
            (e) => {
              this.messageService.dealWithError(e);
              this.search.hideSpinnerMenu = true;
              this.search.search(true);
            },
            () => {
              this.search.hideSpinnerMenu = true;
            }
          )
      }
    }
  } 

  executeAction(event: any) {
    if (event.action.action === 'generate_integration_customer_file') {
      this.generateUniqueCustomer(event.line.id);
    }
  }

  generateUniqueCustomer(customerid: any) {
  this.search.hideSpinnerMenu = false;
    this.customerIntegrationService.generateIntegrationFile(customerid).subscribe((resp) => {
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
  
}

function generateIntegrationCondition(element: any) {
  return element && (element.statusIntegration === NAO_SINCRONIZADO || element.statusIntegration === ERRO_SINCRONIZACAO);
}

function hintCondition(element: any) {
    return !!element.buildErrorHint.length && element.statusIntegration == ERRO_SINCRONIZACAO;
}


