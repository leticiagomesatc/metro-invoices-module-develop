import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { InvoiceList } from './components/invoice-list/invoice-list.component';
import { DebitNoteTemplateList } from './components/debit-note/debit-note-template/debit-note-template-list/debit-note-template-list.component';
import { DebitNoteTemplateEdit } from './components/debit-note/debit-note-template/debit-note-template-edit/debit-note-template-edit.component';
import { AppRoutingModule } from '../app-routing.module';
import { InvoiceService } from './services/invoice.service';
import { DebitNoteService } from './services/debit-note.service';
import { CustomerService } from './services/customer.service';
import { RemittanceService } from './services/remittance.service';
import { MatDatepickerModule, MatFormFieldModule, MatSelectModule, MatLineModule, MatNativeDateModule, MatInputModule, MatToolbarModule, MatSidenavModule, MatCheckboxModule, MatButtonModule, MatAutocomplete, MatAutocompleteModule, MatIconModule, MatCardModule, MatTableModule, MatTooltipModule, MatExpansionModule, MatRadioButton, MatRadioModule, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_DATA, MatDialogRef, MatProgressSpinnerModule, MatPaginatorModule, MatListItem, MatListModule, MatSliderModule, MatSlideToggleModule, MatTabsModule, MatBadgeModule } from '@angular/material';
import { MatMenuModule,  MatOptionModule } from '@angular/material';

import { SharedModule } from '../shared/shared.module';
import { FwModule } from '../shared/controllers/fw/fw.module';
import { DebitNoteIssuesList } from './components/debit-note/issues/debit-note-issues-list.component';
import { DebitNoteCreateIssueComponent } from './components/debit-note/issues/emit-dialog/debit-note-new-issue.component';
import { RemittancesList } from './components/remittances/remittances-list.component';

import {MAT_DATE_LOCALE} from '@angular/material/core';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
// export const MY_FORMATS = {
//   parse: {
//     dateInput: 'MM/YYYY',
//   },
//   display: {
//     dateInput: 'MM/YYYY',
//     monthYearLabel: 'MMM YYYY',
//     dateA11yLabel: 'LL',
//     monthYearA11yLabel: 'MMMM YYYY',
//   },
// };

import {NgxMaskModule, IConfig, MaskPipe} from 'ngx-mask';
import { FlexLayoutModule } from '@angular/flex-layout';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ContactService } from './services/contact.service';
import { InvoiceImport } from './components/invoice-import/invoice-import.component';
import { InputFileConfig, InputFileModule } from 'ngx-input-file';
import { FileService } from './services/file.service';
import { IssuanceCalendar } from './components/issuance-calendar/issuance-calendar.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { IssuanceDetails } from './components/issuance-calendar/issuance-details/issuance-details.component';
import { AccountingFiles } from './components/accounting-files/accounting-files.component';
import { CnabImport } from './components/cnab-import/cnab-import.component';
import { CovenantFileList } from './components/covenant-file/list/covenant-file-list.component';
import { BusinessLocalService } from './services/business-local.service';
import { CompanyBranchService } from './services/company-branch.service';
import { CovenantFileService } from './services/covenant-file.service';
import { ClientBalanceList } from './components/client-balance/list/client-balance-list.component';
import { BalanceService } from './services/balance.service';
import { CreateDowningComponent } from './components/client-balance/create-downing-dialog/create-downing.component';
import { DecreaseBilletService } from './services/decrease-billet.service';
import { DunningList } from './components/dunning/dunning-list/dunning-list.component';
import { CreateBilletDowningEdit } from './components/client-balance/create-billet-downing/create-billet-downing-edit.component';
import { ShowBilletDowningView } from './components/client-balance/show-billet-downing/show-billet-downing-edit.component';
import { DunningEdit } from './components/dunning/dunning-edit/dunning-edit.component';
import { OverduePanel } from './components/overdue-panel/overdue-panel.component';
import { ChargeStatusComponent } from './components/overdue-panel/charge-status/charge-status.component';
import { ChargeService } from './services/charge.service';
import { BillingHistory } from './components/billing-history/billing-history.component';
import { InvoicingReportService } from './services/invoicing-report.service';
import { InvoicingReport } from './components/invoice-report/invoicing-report.component';
import { Unauthorized } from './components/unauthorized/unauthorized.component';
import { InvoiceCalcComponent } from './components/invoice-calc/list/invoice-calc.component';
import { InvoiceCalcEditComponent } from './components/invoice-calc/create/invoice-calc-edit.component';
import { InvoiceCalcReopenComponent } from './components/invoice-calc/reopen/invoice-calc-reopen.component';
import { OperatorService } from './services/operator.service';
import { NoteBilletImportComponent } from './components/note-billet-import/note-billet-import.component';
import { InvoiceCalcDetailComponent } from './components/invoice-calc/detail/invoice-calc-detail.component';
import { CircuitService } from './services/circuit.service';
import { ImportCalcComponent } from './components/import-calc/import-calc/import-calc.component';
import { IntegrationHistoryComponent } from './components/integration-history/integration-history.component';
import { SituationImport } from './components/situation-import/situation-import.component';
import { ContactComponent } from './components/contact/contact.component';
import { CustomersComponent } from './components/customers-integration/customers-integration.component';
import { StatusIntegrationCustomer } from './components/status-integration-customer/status-integration-customer.component';
import { StatusIntegrationContact } from './components/status-integration-contact/status-integration-contact.component';
import { CustomersIntegrationHistoryComponent } from './components/customers-integration-history/customers-integration-history.component';
import { ContactIntegrationHistoryComponent } from './components/contact-integration-history/contact-integration-history.component';
import { BaseOsComponent } from './components/base-os/base-os.component';
import { TicketDiscountComponent } from './components/ticket-discount/list/ticket-discount.component';
import { TicketDiscountEditComponent } from './components/ticket-discount/edit/ticket-discount-edit.component';
import { TicketService } from './services/ticket-discount.service';
import { TicketDiscountCalcComponent } from './components/ticket-discount-calc/list/ticket-discount-calc.component';
import { TicketServiceCalc } from './services/ticket-discount-calc.service';
import { TicketDiscountCalcEditComponent } from './components/ticket-discount-calc/edit/ticket-discount-calc-edit.component';
import { DiscountFinancialApprovalComponent } from './components/discount-financial-approval/discount-financial-approval.component';
import { DiscountFinancialApprovalService } from './services/discount-financial-approval.service';
import { StateInformationComponent } from './components/state-information/list/state-information.component';
import { StateInformationService } from './services/state-information.service';
import { StateInformationEditComponent } from './components/state-information/edit/state-information-edit.component';

const config: InputFileConfig = {
  fileAccept: 'text/plain',
  fileLimit: 2147483647
};

registerLocaleData(localePt);
@NgModule({
  declarations: [
    InvoiceList,
    BaseOsComponent,
    StateInformationComponent,
    StateInformationEditComponent,
    TicketDiscountComponent,
    TicketDiscountEditComponent,
    TicketDiscountCalcComponent,
    TicketDiscountCalcEditComponent,
    DebitNoteIssuesList,
    DiscountFinancialApprovalComponent,
    DebitNoteTemplateList,
    DebitNoteTemplateEdit,
    DebitNoteCreateIssueComponent,
    RemittancesList,
    InvoiceImport,
    IssuanceCalendar,
    IssuanceDetails,
    AccountingFiles,
    CnabImport,
    CovenantFileList,
    ClientBalanceList,
    CreateDowningComponent,
    DunningList,
    DunningEdit,
    CreateBilletDowningEdit,
    ShowBilletDowningView,
    OverduePanel,
    ChargeStatusComponent,
    BillingHistory,
    InvoicingReport,
    Unauthorized,
    InvoiceCalcComponent,
    InvoiceCalcEditComponent,
    InvoiceCalcReopenComponent,
    NoteBilletImportComponent,
    InvoiceCalcDetailComponent,
    ImportCalcComponent,
    IntegrationHistoryComponent,
    SituationImport,
    CustomersComponent,
    ContactComponent,
	StatusIntegrationCustomer,
	StatusIntegrationContact,
	CustomersIntegrationHistoryComponent,
	ContactIntegrationHistoryComponent
  ],
  entryComponents: [
    DebitNoteCreateIssueComponent,
    IssuanceDetails,
    CreateDowningComponent,
  ],
  providers: [
    TicketService,
    TicketServiceCalc,
    StateInformationService,
    CustomerService,
    InvoiceService,
    DebitNoteService,
    RemittanceService,
    ContactService,
    DiscountFinancialApprovalService,
    FileService,
    BusinessLocalService,
    CompanyBranchService,
    BalanceService,
    CovenantFileService,
    DecreaseBilletService,
    ChargeService,
    InvoicingReportService,
    MatDatepickerModule,
    OperatorService,
    CircuitService,
    {provide: MAT_DATE_LOCALE, useValue: 'pt-BR'},
    // {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    // {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    DatePipe,
    DecimalPipe,
    MaskPipe,

    { provide: LOCALE_ID, useValue: 'pt-BR' },
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}},
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    FlexLayoutModule,
    SharedModule,
    FwModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatToolbarModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatLineModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatTableModule,
    MatExpansionModule,
    MatRadioModule,
    MatTableModule,
    MatMenuModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatSlideToggleModule,
    MatTabsModule,
    NgxMaskModule.forChild(),
    InputFileModule.forRoot(config),
    ToastrModule.forRoot({
      easeTime: 100,
      closeButton: true,
      timeOut: 20000,
      positionClass: 'toast-top-right'
    }),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    }),
    MatPaginatorModule,
    MatBadgeModule

  ]
})
export class InvoiceModule { }
