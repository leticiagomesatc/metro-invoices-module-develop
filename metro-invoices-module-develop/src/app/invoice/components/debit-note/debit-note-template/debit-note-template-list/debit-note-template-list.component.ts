import { Component, ViewChild } from '@angular/core';

import { FormControl } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import {formatDate, formatCurrency} from '@angular/common';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

const DATE_FORMAT = 'dd/MM/yyyy';
const LOCALE = 'pt-BR';

@Component({
  selector: 'app-debit-note-template-list',
  templateUrl: './debit-note-template-list.component.html',
  styleUrls: ['./debit-note-template-list.component.scss'],
})
export class DebitNoteTemplateList {

  userRoles = userRoles;

  cols = [
    { title: 'Código do Cliente', prop: 'customer.sapCode' },
    { title: 'Grupo de Faturamento', prop: 'customer.name' },
    { title: 'Tipo da Nota', prop: 'type', converter: debitNoteTypeConv },
    { title: 'Valor mensal liquido', prop: 'monthlyAmout', converter: currencyConv },
    { title: 'Vigência', prop: 'issueStart', converter: issueConv },
    { title: 'Produto', prop: 'product.name' },
    { title: 'Situação', prop: 'inactive', converter: inactiveConv },
  ];

  requiredRolesToView: string = userRoles.dbTemplateView;



  actions = [
    {
      // title : 'Ações', 
      action: 'actions',
      subActions: [
        {
          title: 'Editar', 
          action: 'edit', 
          command: {
            name : 'routeWithId',
            params: {
              route : '/debit-notes/templates/'
            }
          }, 
          role: userRoles.dbTemplateUpdate,
          icon: { name: 'edit' }
        },
        {
          title: 'Remover', 
          action: 'remove', 
          command: {
            name : 'searchAndDelete'
          }, 
          icon: { name: 'delete' }
        }
      ]
    }
  ];


  @ViewChild('search') search: any;

  constructor(public authService: AuthService) {}


  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);

  }

  private initComponent(_this: any) {
    _this.search.filters.continueSearch = true;
    _this.search.filters.active = true;
  }

  isDevMode() {
    return false;
  }




}


function debitNoteTypeConv(params: string) {
  switch (params) {
    case 'ACCOUNTS_MEETING': return 'Encontro de contas';
    case 'PAYMENT': return 'Pagamento';
    case 'PREPAYMENT': return 'Pagamento Antecipado';
    case 'FINE': return 'Multa';
    default: return 'Indefinida';
  }

}


function inactiveConv(params: boolean) {
  if (params === true) {
    return 'Inativa';
  } else if (params === false) {
    return 'Ativa';
  } else {
    return '?'
  }

}

function issueConv(params: string, ctx: any) {
  if (!!ctx && !!ctx.line) {
    const from = formatDate(ctx.line.issueStart, DATE_FORMAT, LOCALE);
    const to = formatDate(ctx.line.issueEnd, DATE_FORMAT, LOCALE);
    return `De ${from} a ${to}`;
  } else {
    return params;
  }

}

function currencyConv(value: any) {
  return formatCurrency(value, LOCALE, 'R$');
}
