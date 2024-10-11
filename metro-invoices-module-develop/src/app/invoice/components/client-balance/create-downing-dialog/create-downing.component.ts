import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource, MatDialog } from '@angular/material';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { formatDate, formatCurrency } from '@angular/common';
import * as _ from 'lodash';
import * as moment from 'moment';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { InputFileComponent } from 'ngx-input-file';
import { BalanceService } from 'src/app/invoice/services/balance.service';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { DecreaseBilletService } from 'src/app/invoice/services/decrease-billet.service';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { StringUtil } from 'src/app/shared/util/string.util';
import {  MASKCLIENT } from 'src/app/shared/util/validators.util';

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-create-downing-dialog',
  templateUrl: './create-downing.component.html',
  styleUrls: ['./create-downing.component.scss']
})
export class CreateDowningComponent {

  maskCliente: string = MASKCLIENT;

  @ViewChild('inputComponent') inputComponent: InputFileComponent

  cols = [
    { title: 'Valor bruto',           prop: 'billetAmountValue',            converter: currencyConv },
    { title: 'Nota(s)',               prop: 'noteNumber',                   converter: noteNumberConverter },
    { title: 'Data de emissão Nota',  prop: 'noteCreatedOn',                converter: formatSimpleDate},
    { title: 'Boleto',                prop: 'docNumber' },
    { title: 'Vencimento',            prop: 'formatedDueDate' },
    { title: 'Pagamento',             prop: 'payedDate',                    converter: formatSimpleDate,  show: this.data.isBalance },
    { title: 'Valor Pago',            prop: 'payedValue',                   converter: currencyConv,      show: this.data.isBalance },
    { title: 'Atraso',                prop: 'dueDays',                      converter: dueDateDelayConv,  show: !this.data.isBalance },
    { title: 'Saldo',                 prop: 'balanceValueOperationalType' },
    { title: 'Valor para baixa',      prop: 'billetId',                     input: { name:'downingValue', mask: 'dot_separator.2', prefix: renderCurrencyPrefix, disabled: isFinalized, prefixParam: 'operationType' } } 
  ]

  actions = [
    {
      title:'Anexar arquivos', 
      show: isNotFinalized,
      action: 'insert_file', 
      icon:'insert_drive_file'
    },
    {
      title:'Download arquivos', 
      action: 'download_file', 
      icon:'cloud_download'
    }
  ];

  displayedColumns: string[] = []

  dataSource = new MatTableDataSource<any>();

  files: any[] = [];

  currentBillet:number;

  addCols: any[] = ['isBalance', 'operationType'];

  confirmDowning:boolean = false;

  constructor(
    private dialog: MatDialog,
    public validate : FwValidateService,
    private dialogRef: MatDialogRef<CreateDowningComponent>,
    private balanceService: BalanceService,
    private decreaseBilletService: DecreaseBilletService,
    private messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  ngOnInit() { 
    this.displayedColumns = ['selection']
    this.displayedColumns = this.displayedColumns.concat( 
      _(this.cols)
          .filter(line=>{ 
            return line.show == undefined || line.show
          })
          .map(col=>col.prop)
          .union(
              _(this.actions).map(col=>col.action).value()
          ).value() 
    );
    
    this.setFilterToModal();

    this.balanceService.searchPendingAndInNeedOfBalanceBillets(this.data.filter)
    .subscribe(
        (page)=> {
            this.dataSource.data = page.content;
        },
        (error)=> {
            this.messageService.dealWithError(error);
        }
    ); 
  }

  setFilterToModal() {
    this.data.filter.billetId = this.data.billetId
    this.data.filter.customerNationalCompanyNumber = this.data.customerNationalCompanyNumber
  }

  close(): void {
    this.dialogRef.close();
  }

  execute(action : any, line : any, index : number) {
    if (action.action == 'insert_file') {
      this.currentBillet = line.billetId;
      this.inputComponent.fileInput.nativeElement.click()
    } else if (action.action == 'download_file') {
       this.decreaseBilletService.downloadFile(line.billetId)
       .subscribe(
         content=> {
          BlobUtil.startDownload(
            `ATC-ANEXOS-BAIXA-BOLETO.zip`,
                content,
                'application/zip'
            );
        },
        (e)=> this.messageService.dealWithError(e)
      );
    }
  }

  saveDowning() {
    if(this.containsEmptyDowningValue().length > 0) {
      this.messageService.error('INV-E037', this.containsEmptyDowningValue().join(', '));
    } else {
      this.decreaseBilletService.save(this.createDecreaseBillet()).subscribe(
        () => {
          this.messageService.success('INV-S004');
          this.dialogRef.close({ status: 'ok' })
        },
        (e)=> this.messageService.dealWithError(e));
    }
  }

  acceptFile(file) {
    if(!this.files[this.currentBillet]) {
      this.files[this.currentBillet] = [];
    }
    this.files[this.currentBillet].push(file)
    
  }

  createDecreaseBillet() {
    const line = this.dataSource.data[0];

    return {
      billetId: line.billetId,
      value: line.downingValue,
      operationType: line.operationType,
      despiseValue: !!line.despiseValue,
      fileList: this.files[line.billetId],
      noteNumber: line.noteNumber
    }
  }

  containsEmptyDowningValue() {
    const uniqueLine = this.createDecreaseBillet();
    return uniqueLine.value && uniqueLine.value > 0 ? [] : [uniqueLine.noteNumber];
  }

  renderColValue(col : any, line : any, index:number, type : string = 'col') {
    if (!col) {
        throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (!line) {
        return null;
    }
  
    if(col.enableHint) {
        return null;
    } else if (type === 'col') {
  
        let val = !!col.prop ? _.get(line,col.prop) : line.toString();
        if (!!col.converter && col.converter instanceof Function) {
            val = col.converter(val, {line : line, index : index});
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

  renderAction(act: any, line: any) {
    if(act.show) {
      return act.show(line)
    }
    return true
  }

  renderInputField(col: any, line: any) {
    if (!col || !col.input || !col.input.disabled) {
      return false;
    } else {
      return col.input.disabled(line);
    }

  }

  renderSelector(element) {
    return element.finalized;
  }

  selectItem(element: any, event: any) {
    element.despiseValue = event.checked;
  }

}

function formatSimpleDate(object : any){
  if (!object) {
    return null;
  }
  return formatDate(object, 'dd/MM/yyyy','pt-BR');
}

function currencyConv(value: any) {
  return formatCurrency(value, LOCALE, 'R$');
}

function renderCurrencyPrefix(line, operation) {
  return (line && line[operation] && line[operation] === 'CREDIT' ? '-' : '') + 'R$';
}

function dueDateDelayConv(object:any) {
  return StringUtil.retroactiveDaysIn(object);
}

function isNotFinalized(line: any) {
  return !line.finalized;
}

function isFinalized(line: any) {
  return line.finalized;
}

function noteNumberConverter(noteNumber: string) : string {
  return noteNumber.split('\n').join('<br/>');
}