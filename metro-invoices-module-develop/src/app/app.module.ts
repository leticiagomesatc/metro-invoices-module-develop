import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SharedModule } from './shared/shared.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {MatButtonModule, MatCheckboxModule, MatSidenavModule, MatMenuModule, MatToolbar, MatToolbarModule, MatIconModule, MatListModule, MatExpansionModule, MatTableModule} from '@angular/material';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InvoiceModule } from './invoice/invoice.module';
import { HttpConfigInterceptor } from './shared/security/interceptor/http-cofing.interceptor';

import * as _ from 'lodash';

const LOCALE = 'pt-br';

import {NgxMaskModule} from 'ngx-mask';
import * as moment from 'moment';



@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    MatTableModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    InvoiceModule,
    NgxMaskModule.forRoot()
  ],
  providers: [
    HttpClientModule,
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

moment.updateLocale(LOCALE, {
  relativeTime : {
    future : '%s',
    past : '%s',
    s : 'poucos segundos',
    ss : '%d segundos',
    m : '1 minuto',
    mm : '%d minutos',
    h : '1 hora',
    hh : '%d horas',
    d : '1 dia',
    dd : '%d dias',
    M : '1 mês',
    MM : '%d meses',
    y : '1 ano',
    yy : '%d anos'
  },
});

moment.locale(LOCALE)
