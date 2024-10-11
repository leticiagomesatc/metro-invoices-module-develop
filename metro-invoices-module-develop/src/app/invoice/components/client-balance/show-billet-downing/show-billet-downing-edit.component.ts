import { Component } from '@angular/core';
import { formatDate, formatCurrency } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material';

import * as _ from 'lodash';
import * as moment from 'moment';
import { DecreaseBilletService } from 'src/app/invoice/services/decrease-billet.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { StringUtil } from 'src/app/shared/util/string.util';

const LOCALE = 'pt-BR';

@Component({
  selector:     'app-show-billet-downing',
  templateUrl:  './show-billet-downing-edit.component.html',
  styleUrls: [  './show-billet-downing-edit.component.scss'],
})
export class ShowBilletDowningView   {
  
  cols = [
    { title: 'Valor bruto',           prop: 'billetAmountValue',            converter: currencyConv },
    { title: 'Boleto',                prop: 'uniqueNumberIdentifier' },
    { title: 'Data de emissão',       prop: 'createdOn',                    converter: formatSimpleDate},
    { title: 'Vencimento',            prop: 'formatedDueDate'},
  ];

  customerName:any
  customerSapCode:any
  customerNationalCompanyNumber:any

  dataSource = new MatTableDataSource<any>();

  selectionList: any[] = [];
  displayedColumns: string[] = [];

  addCols: any[] = ['billetId'];

  constructor(private route: ActivatedRoute,
    private decreaseService: DecreaseBilletService,
    private messageService : MessageService) {}

  ngOnInit() {
    this.defineDisplayedColumns()
    this.defineParamsFromRoute()
  }

  defineDisplayedColumns() {
    this.displayedColumns = ['selection'];
    this.displayedColumns = this.displayedColumns.concat(
      _(this.cols).map(col => col.prop).value())
  }

  defineParamsFromRoute() {
    this.route.paramMap.pipe(map(() => window.history.state)).subscribe((state:any)=>{
      this.customerNationalCompanyNumber = state.data.showValue.customerNationalCompanyNumber;

      this.customerName = state.data.showValue.customerName;
      this.customerSapCode = state.data.showValue.customerSapCode;

      this.dataSource.data = state.data.billetList;
    })
  }

  isDevMode() {
    return false;
  }

  download() {
    if(this.selectionList && this.selectionList.length <= 0) {
      this.messageService.error('INV-E023');
    } else {
      let ids = this.selectionList.map(item=>item.billetId);
  
      this.decreaseService.downloadZipBillets(ids).subscribe(
        content=> {
          BlobUtil.startDownload(
            `ATC-BOLETOS-${formatDate(new Date(), 'ddMMyyyy-HH:mm', 'pt')}.zip`,
            content,
            'application/zip'
          );
        },
        (e)=> this.messageService.dealWithError(e)
      );
    }
  }
  
  sendEmail() {
    if(this.selectionList && this.selectionList.length <= 0) {
      this.messageService.error('INV-E023');
    } else {
      let ids = this.selectionList.map(item=>item.billetId);

      this.decreaseService.sendZipBilletsEmail(ids)
        .subscribe(
          ()=>{
            this.messageService.success('INV-S016', 'boletos');
          },
          (e)=>this.messageService.dealWithError(e)
        );
    }
  }

  renderColTitle(col: any, type: string = 'col'): string {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (col.enableHint) {
      return '';
    }
    if (type === 'col') {
      return col.title || col.prop || '?';
    } else {
      return col.title;
    }
  }

  renderColValue(col: any, line: any, index: number, type: string = 'col') {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (!line) {
      return null;
    }

    if (col.enableHint) {
      return null;
    } else if (type === 'col') {

      let val = !!col.prop ? _.get(line, col.prop) : line.toString();
      if (!!col.converter && col.converter instanceof Function) {
        val = col.converter(val, {line: line, index: index});
      }
      return val;
    } else if (col.actionByValue === true) {
      return this.renderColValue(col, line, index, 'col');
    } else if (!!col.icon && col.icon.iconOnly === true) {
      return null;
    } else {
      return col.title;
    }
  }

  selectItem(element: any, event: any) {
    element.checked = event.checked;
    if (!element.checked) {
      this.selectionList = _.remove(this.selectionList, value => value.billetId !== element.billetId);
    } else {
      this.selectionList.push(element);
    }
  }

  checkUncheckAll(event: any) {
    this.dataSource.data.forEach(elem => elem.checked = event.checked);

    this.dataSource.data.forEach(element => {
      this.selectionList = _.remove(this.selectionList, value => value.billetId !== element.billetId);
    });

    if (event.checked) {
      this.dataSource.data.forEach(element => this.selectionList.push(element));
    }
  }
}

function formatSimpleDate(object : any){
  if (!object) {
    return '-';
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}

function currencyConv(value: any) {
  if (!value) {
    return '-';
  }
  return formatCurrency(value, LOCALE, 'R$');
}

function dayConv(object : any){
  return StringUtil.retroactiveDaysIn(object);
}

function nationalCompanyNumberConv(params: any) {
  return params.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}
function formatDateInverse(){
  return formatDate(new Date(), 'ddMMyyyy-HHmmSS','pt-BR');
}
