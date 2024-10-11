import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {InvoiceList} from './components/invoice-list/invoice-list.component';
import {DebitNoteTemplateList} from './components/debit-note/debit-note-template/debit-note-template-list/debit-note-template-list.component';
import {DebitNoteIssuesList} from './components/debit-note/issues/debit-note-issues-list.component';

import { AuthGuard } from '../shared/security/guards/auth.guard';
import { DebitNoteTemplateEdit } from './components/debit-note/debit-note-template/debit-note-template-edit/debit-note-template-edit.component';
import { RemittancesList } from './components/remittances/remittances-list.component';
import { InvoiceImport } from './components/invoice-import/invoice-import.component';
import { IssuanceCalendar } from './components/issuance-calendar/issuance-calendar.component';
import { AccountingFiles } from './components/accounting-files/accounting-files.component';
import { CnabImport } from './components/cnab-import/cnab-import.component';
import { CovenantFileList } from './components/covenant-file/list/covenant-file-list.component';
import { ClientBalanceList } from './components/client-balance/list/client-balance-list.component';
import { DunningList } from './components/dunning/dunning-list/dunning-list.component';
import { CreateBilletDowningEdit } from './components/client-balance/create-billet-downing/create-billet-downing-edit.component';
import { ShowBilletDowningView } from './components/client-balance/show-billet-downing/show-billet-downing-edit.component';
import { DunningEdit } from './components/dunning/dunning-edit/dunning-edit.component';
import { OverduePanel } from './components/overdue-panel/overdue-panel.component';
import { ChargeStatusComponent } from './components/overdue-panel/charge-status/charge-status.component';
import { BillingHistory } from './components/billing-history/billing-history.component';
import { InvoicingReport } from './components/invoice-report/invoicing-report.component';
import { Unauthorized } from './components/unauthorized/unauthorized.component';
import { InvoiceCalcComponent } from './components/invoice-calc/list/invoice-calc.component';
import { InvoiceCalcEditComponent } from './components/invoice-calc/create/invoice-calc-edit.component';
import { InvoiceCalcReopenComponent } from './components/invoice-calc/reopen/invoice-calc-reopen.component';
import { NoteBilletImportComponent } from './components/note-billet-import/note-billet-import.component';
import { InvoiceCalcDetailComponent } from './components/invoice-calc/detail/invoice-calc-detail.component';
import { ImportCalcComponent } from './components/import-calc/import-calc/import-calc.component';
import { IntegrationHistoryComponent } from './components/integration-history/integration-history.component';
import { SituationImport } from './components/situation-import/situation-import.component';
import { CustomersComponent } from './components/customers-integration/customers-integration.component';
import { ContactComponent } from './components/contact/contact.component';
import { StatusIntegrationCustomer } from './components/status-integration-customer/status-integration-customer.component';
import { StatusIntegrationContact } from './components/status-integration-contact/status-integration-contact.component';
import { CustomersIntegrationHistoryComponent } from './components/customers-integration-history/customers-integration-history.component';
import { ContactIntegrationHistoryComponent } from './components/contact-integration-history/contact-integration-history.component';
import { BaseOsComponent } from './components/base-os/base-os.component';
import { TicketDiscountComponent } from './components/ticket-discount/list/ticket-discount.component';
import { TicketDiscountCalcComponent } from './components/ticket-discount-calc/list/ticket-discount-calc.component';
import { DiscountFinancialApprovalComponent } from './components/discount-financial-approval/discount-financial-approval.component';
import { StateInformationComponent } from './components/state-information/list/state-information.component';

const routes: Routes = [

  {
    path: 'invoices',
    component: InvoiceList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title: 'Listar Faturas',
      menuConfig: {
        id: 'invoice_listing',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'customers-integration',
    component: CustomersComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Grupo de faturamento',
      menuConfig: {
        id: 'customers-integration',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'contact',
    component: ContactComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Contato',
      menuConfig: {
        id: 'contact',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'situation-import',
    component: SituationImport,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Importar Situação de Memória de Cálculo',
      menuConfig: {
        id: 'situation-import',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'status-integration-customer',
    component: StatusIntegrationCustomer,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Importar Status Integração Cliente',
      menuConfig: {
        id: 'status-integration-customer',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'status-integration-contact',
    component: StatusIntegrationContact,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Importar Status Integração Contato',
      menuConfig: {
        id: 'status-integration-contact',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'integration-history-customer',
    component: CustomersIntegrationHistoryComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Histórico de integração de Clientes',
      menuConfig: {
        id: 'integration-history-customer',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'integration-history-contact',
    component: ContactIntegrationHistoryComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Histórico de integração de Contato',
      menuConfig: {
        id: 'integration-history-contact',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },


  {
    path: 'debit-notes/issues',
    component: DebitNoteIssuesList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title : 'Manter Templates de Notas de Débito',
      menuConfig: {
        id:'debit_note_listing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'debit-notes/templates',
    component: DebitNoteTemplateList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title : 'Manter Templates de Notas de Débito',
      menuConfig: {
        id:'debit_note_listing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'debit-notes/templates/new',
    component: DebitNoteTemplateEdit,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title : 'Cadastrar Template de Nota de Débito',
      menuConfig: {
        id:'debit_note_insert',
        module: 'invoice',
        exclude: ['','@path']
      }
    },



  },
  {
    path: 'debit-notes/templates/:id',
    component: DebitNoteTemplateEdit,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title : 'Editar Template de Nota de Débito',
      menuConfig: {
        id:'debit_note_update',
        module: 'invoice',
        exclude: ['','@path']
      }
    },



  },
  {
    path: 'invoice-import',
    component: InvoiceImport,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Importar arquivo para gerar fatura',
      menuConfig: {
        id:'invoice_import',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'remittances',
    component: RemittancesList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      // hasRole: 'ROLE_PROCESSAMENTO_VIABILIDADE_LOTE_VISUALIZAR',
      title : 'Listar remessas',
      menuConfig: {
        id:'remittances_list',
        module: 'invoice',
        exclude: ['','@path']
      }
    },
  },
  {
    path: 'issuance-calendar',
    component: IssuanceCalendar,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
        title : 'Consultar Calendário de emissão/envio',
      menuConfig: {
        id:'issuance_calendar',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'accounting-files',
    component: AccountingFiles,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
        title : 'Arquivos Contábeis',
      menuConfig: {
        id:'accounting_files',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'cnab-import',
    component: CnabImport,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Receber CNAB',
      menuConfig: {
        id:'cnab_import',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  }, {
    path: 'covenant-files',
    component: CovenantFileList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Arquivos Convênio 115',
      menuConfig: {
        id:'covenant_files',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  }, {
    path: 'client-balance',
    component: ClientBalanceList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Controle de Saldos',
      menuConfig: {
        id:'client_balance',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },{
    path: 'create-billet-downing',
    component: CreateBilletDowningEdit,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Gerar Boleto(s) Saldo(s) do Cliente',
      menuConfig: {
        id:'create_billet_downing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },{
    path: 'show-billet-downing',
    component: ShowBilletDowningView,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Visualizar boleto(s) do saldo devedor',
      menuConfig: {
        id:'show_billet_downing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  }, {
    path: 'dunning',
    component: DunningList,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Régua de Cobrança',
      menuConfig: {
        id:'dunning',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  }, {
    path: 'unauthorized',
    component: Unauthorized,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Acesso Negado',
      menuConfig: {
        id:'unauthorized',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },

  {
    path: 'dunning/new',
    component: DunningEdit,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Cadastrar Régua de Cobrança',
      menuConfig: {
        id:'dunning_insert',
        module: 'invoice',
        exclude: ['','@path']
      }
    },
  },
  {
    path: 'dunning/:id',
    component: DunningEdit,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Editar Régua de Cobrança',
      menuConfig: {
        id:'dunning_update',
        module: 'invoice',
        exclude: ['','@path']
      }
    },
  },
  {
    path: 'overdue-panel',
    component: OverduePanel,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Painel de Inadimplência',
      menuConfig: {
        id:'overdue-panel',
        module: 'invoice',
        exclude: ['','@path']
      }
    },
  },
  {
    path: 'charge-status/:id',
    component: ChargeStatusComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Informar Status de Cobrança',
      menuConfig: {
        id:'charge-status',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'billing-history',
    component: BillingHistory,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Histórico de Faturamento',
      menuConfig: {
        id:'billing-history',
        module: 'invoice',
        exclude: ['','@path']
      }
    },
  }, {
    path: 'invoicing-report',
    component: InvoicingReport,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Relatório de Faturamento',
      menuConfig: {
        id:'invoicing_report',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  }, {
    path: 'invoice-calc',
    component: InvoiceCalcComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Memória de Cálculo',
      menuConfig: {
        id: 'invoicing_calculing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },{
    path: 'invoice-calc/reopen',
    component: InvoiceCalcReopenComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Reabrir memória de nota fiscal cancelada',
      menuConfig: {
        id: 'Reopen_invoicing_calculing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },{
    path: 'invoice-calc/new',
    component: InvoiceCalcEditComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Gerar Memória de Cálculo',
      menuConfig: {
        id: 'create_invoicing_calculing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },{
    path: 'invoice-calc/edit',
    component: InvoiceCalcDetailComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Editar Memória de Cálculo',
      menuConfig: {
        id: 'edit_invoicing_calculing',
        module: 'invoice',
        exclude: ['','@path']
      }
    }
  },

  {
    path: 'note-billet-import',
    component: NoteBilletImportComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title : 'Importação de Notas e Boletos',
      menuConfig: {
        id:'notebillet_import',
        module: 'noteBilletImport',
        exclude: ['','@path']
      }
    }
  },
  {
    path: 'import-calc',
    component: ImportCalcComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Importação de memória de cálculo',
      menuConfig: {
        id: 'import_calc',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'integration-history',
    component: IntegrationHistoryComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Histórico de Integração',
      menuConfig: {
        id: 'integration_history',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'export-report',
    component: BaseOsComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Relatório Base de OS',
      menuConfig: {
        id: 'report_base_os',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'tickets-discount',
    component: TicketDiscountComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Tickets Processados Aguardando Análise',
      menuConfig: {
        id: 'tickets_discount',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'tickets-discount-calc',
    component: TicketDiscountCalcComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Descontos por interrupção calculados',
      menuConfig: {
        id: 'tickets_discount_calc',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'discount-finan-apprv',
    component: DiscountFinancialApprovalComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Descontos Aguardando Aprovação Financeira',
      menuConfig: {
        id: 'discount_finan_apprv',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },
  {
    path: 'state-information',
    component: StateInformationComponent,
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    data: {
      title: 'Informações de Estado',
      menuConfig: {
        id: 'state_information',
        module: 'invoice',
        exclude: ['', '@path']
      }
    }
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class InvoiceModuleRoutingModule { }
