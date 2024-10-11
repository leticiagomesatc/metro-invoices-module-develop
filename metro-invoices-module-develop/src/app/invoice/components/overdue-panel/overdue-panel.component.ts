import { formatCurrency, formatDate } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatSelect } from '@angular/material';
import { Router } from '@angular/router';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { ChargeService } from '../../services/charge.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { AuthService } from 'src/app/shared/security/auth/auth.service';

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-overdue-panel',
  templateUrl: './overdue-panel.component.html',
  styleUrls: ['./overdue-panel.component.scss'],
})
export class OverduePanel {

  cols = [
    { title: 'CÓDIGO CLIENTE', prop: 'customerSapCode' },
    { title: 'CNPJ', prop: 'customerCnpj', converter: nationalCompanyNumberConv },
    { title: 'GRUPO DE FATURAMENTO', prop: 'customerName' },
    { title: 'Nº BOLETO', prop: 'billetNumber' },
    { title: 'NOTA(S) (EMISSÃO)', prop: 'noteNumberDate' },
    { title: 'DIA(S) VENCIDO', prop: 'dueDays' },
    { title: 'VALOR FATURADO BRUTO', prop: 'grossAmount', converter: currencyConv },
    { title: 'VALOR EM ABERTO (BOLETO)', prop: 'openValue', converter: currencyConv },
    { title: 'VALOR JUROS/MULTA', prop: 'fineInterestAmount', converter: currencyConv },
  ];

  actions = [
    {
      action: 'actions',
      subActions: [
        {
          action: 'edit-charge',
          title: 'Informar Status de Cobrança',
          icon: { name: 'edit' },
          role: userRoles.overduePanelInclude,
        }
      ]
    }
  ];
  
  @ViewChild('search') search: any;

  @ViewChild('statusInput') statusInput: MatSelect;

  formOnSearchMoment:any;

  disableExportBtn:boolean = false;

  requiredRolesToView: string = userRoles.overduePanelView;

  constructor(
    private router: Router,
    private chargeService: ChargeService,
    private messageService: MessageService,
    public authService: AuthService) {}
    
  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, (comp) => true, undefined);
  }

  execute(event:any) {
    const action = event.action.action;

    if(action === 'edit-charge') {
      this.router.navigate(['/charge-status/' + event.line.billetId]);
    }
  }
  
  onSearch() {
    delete this.search.filters.status;
    if (this.search.filters.customer) {
      this.search.filters.customerId = this.search.filters.customer.id;
      delete this.search.filters.customer;
    }
    if(this.statusInput.value) {
      this.search.filters.status = this.statusInput.value
    }

    this.formOnSearchMoment = this.search.filters
  }

  executeClear(previousFilters:any) {
    this.statusInput.value = null;
  }

  
  export(){
    const billetIds = this.search.dataSource.data.map(line => line.billetId)
    if(billetIds.length > 0) {
      this.disableExportBtn = true
      Object.keys(this.formOnSearchMoment).forEach(property=> {
        if(this.formOnSearchMoment[property] === null || this.formOnSearchMoment[property] === undefined) delete this.formOnSearchMoment[property]
      })
      this.chargeService.export(this.formOnSearchMoment)
      .subscribe(
        content=> {
          BlobUtil.startDownload(
            `ATC_STATUS_COBRANCAS_${formatDateInverse()}.xls`,
            content,
            'text/plain'
          );
          this.disableExportBtn = false;
        },
        (e)=> {
          this.messageService.dealWithError(e)
          this.disableExportBtn = false;
          }
        );
    } else this.messageService.error('INV-E042')
  }
}

function currencyConv(value: any) {
  if (!value) {
    return '-';
  }
  return formatCurrency(value, LOCALE, 'R$');
}

function nationalCompanyNumberConv(params: any) {
  return params.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

function formatDateInverse(){
  return formatDate(new Date(), 'ddMMyyyy_HHmm','pt-BR');
}