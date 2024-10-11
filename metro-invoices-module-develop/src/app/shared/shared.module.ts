import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthGuard } from './security/guards/auth.guard';
import { AuthService } from './security/auth/auth.service';
import { MessageService } from './communication/message.service';
import { ErrorHandlerService } from './communication/error-handler.service';
import { HomeComponent } from './navigation/home/home.component';
import { HeaderComponent } from './navigation/header/header.component';
import { MenuComponent } from './navigation/menu/menu.component';
import { FooterComponent } from './navigation/footer/footer.component';
import { HasRoleDirective, HideHasRoleDirective } from './security/auth/has-role.directive';
import { AppRoutingModule } from '../app-routing.module';
import { ChangePasswordComponent } from './security/components/change-password.component';
import { ChangePasswordService } from './security/components/change-password.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';
import { MatTableModule, MatExpansionModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatToolbarModule, MatFormFieldModule, MatDatepickerModule, MatInputModule, MatNativeDateModule, MatLineModule, MatSelect, MatSelectModule, MatDatepicker, MatDatepickerInput, MatIconModule, MatCardModule, MatTooltipModule, MatBadgeModule} from '@angular/material';
import { FwModule } from './controllers/fw/fw.module';
import {MapPipe} from './pipes/map.pipe';
import {YearMonthDatePicker} from './components/date/yearmonthdatepicker/yearmonthdatepicker.component';
import { FlexModule, FlexLayoutModule } from '@angular/flex-layout';
import {NgInit} from './directives/ng-int/ng-init.directive';
import {NumberMaxLengthDirective} from './directives/number/number-max-length.directive';
import { ConfirmComponent } from './components/confirm-dialog/confirm.component';
import { BilletEmailComponent } from './components/billet-email-dialog/billet-email.component';
import { ZipDialogComponent } from './components/zip-dialog/zip-dialog.component';
import { ExtensiveDatePipe } from './pipes/extensive-date.pipe';
import { BilletDuplicateComponent } from './components/billet-duplicate-dialog/billet-duplicate.component';
import {NgxMaskModule, IConfig} from 'ngx-mask';
import { ConfirmCancelComponent } from './components/confirm-cancel-dialog/confirm-cancel.component';

import { InputFileConfig, InputFileModule } from 'ngx-input-file';
import { MaterialModule } from './util/material-module';
import { TicketDiscountEditComponent } from '../invoice/components/ticket-discount/edit/ticket-discount-edit.component';
import { TicketDiscountCalcEditComponent } from '../invoice/components/ticket-discount-calc/edit/ticket-discount-calc-edit.component';
import { StateInformationEditComponent } from '../invoice/components/state-information/edit/state-information-edit.component';
import { TwoDigitDecimaNumberDirective } from './directives/number/two-digit-decima-number.directive';

const config: InputFileConfig = {
  fileAccept: '*',
  fileLimit: 2147483647
};

@NgModule({
  declarations: [

    HomeComponent,
    MenuComponent,
    HeaderComponent,
    FooterComponent,
    HasRoleDirective,
    HideHasRoleDirective,
    ChangePasswordComponent,
    YearMonthDatePicker,
    NgInit,
    NumberMaxLengthDirective,
    TwoDigitDecimaNumberDirective,
    ConfirmComponent,
    BilletEmailComponent,
    ZipDialogComponent,
    BilletDuplicateComponent,
    ConfirmCancelComponent,

    //pipes
    MapPipe,
    ExtensiveDatePipe,
    
  ],
  entryComponents: [

    HomeComponent,
    MenuComponent,
    HeaderComponent,
    FooterComponent,
    YearMonthDatePicker,
    ConfirmComponent,
    BilletEmailComponent,
    ZipDialogComponent,
    BilletDuplicateComponent,
    ConfirmCancelComponent,
    TicketDiscountEditComponent,
    StateInformationEditComponent,
    TicketDiscountCalcEditComponent
  ],
  providers: [
    AuthGuard,
    AuthService,
    MessageService,
    ErrorHandlerService,
    ChangePasswordService,
    CookieService,
    MatDatepickerModule
    
  ],
  exports: [
    MenuComponent,
    HomeComponent,

    HeaderComponent,
    FooterComponent,
    YearMonthDatePicker,
    ConfirmComponent,
    BilletEmailComponent,
    ZipDialogComponent,
    BilletDuplicateComponent,
    ConfirmCancelComponent,

    MapPipe,
    ExtensiveDatePipe,
    NgInit,
    NumberMaxLengthDirective
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FwModule,
    NgxMaskModule.forChild(),
    InputFileModule.forRoot(config),
  ]
})
export class SharedModule { }

