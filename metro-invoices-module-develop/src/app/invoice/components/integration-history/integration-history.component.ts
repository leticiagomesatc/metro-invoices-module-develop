import { Component, OnInit, ViewChild } from '@angular/core';
import { userRoles } from 'src/app/shared/util/user-roles';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { FormControl } from '@angular/forms';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { finalize, startWith, map } from 'rxjs/operators';
import { IntegrationHistoryService } from '../../services/integration-history.service';
import { Observable } from 'rxjs';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { FileService } from './../../services/file.service';

@Component({
  selector: 'app-integration-history',
  templateUrl: './integration-history.component.html',
  styleUrls: ['./integration-history.component.scss']
})
export class IntegrationHistoryComponent implements OnInit {

  userRoles = userRoles;

  @ViewChild('search') search : any;

  fileControl = new FormControl();

  requiredRolesToView: string = userRoles.invoiceCalcView; // TO-DO: if need change

  cols = [
    {title: 'Competência', prop: 'period' },
    {title: 'Tipo', prop: 'tributeType' },
    {title: 'Arquivo', prop: 'fileName' },
    {title: 'Data de Criação', prop: 'createOn'},
    {title: 'Usuário', prop: 'user'},
    {title: 'Origem', prop: 'originDescription'},
    {title: 'Situação', prop: 'statusDescription'},
    {title: '', prop:'buildErrorHint', hintCondition: hintCondition, enableHint: true},
  ];

  actions = [
    {
      action : 'actions',
      subActions : [
        {
          title: 'Download Arquivo',
          condition: downloadFileCondition,
          action: 'download_file',
          role: '',// TO-DO: Role
          icon: {name: 'cloud_download'}
        },
        {
          title: 'Processar arquivo',
          condition: processFileCondition,
          action: 'process_file',
          role: '',// TO-DO: Role
          icon: {name: 'cloud_download'}
        }
      ]
    }
  ];

  cmpControl: any;
  crtdControl: any;

  public allFiles: {fileName: string}[] = [];
  public filteredFiles: Observable<{fileName: string}[]>;


  constructor(private authService: AuthService,
              private fileService: FileService,
              private integrationHistoryService: IntegrationHistoryService,
              private messageService : MessageService) { }

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, this._initComponent, this);
  }

  private _initComponent(_this: any) {
    _this.renderFiles();
    const currentCmp = new Date();
    currentCmp.setDate(1);
    _this.search.filters.period =currentCmp;
    _this.search.filters.createdOn = null;
    _this.cmpControl = new FormControl(currentCmp, ValidatorsUtil.date);
    _this.crtdControl = new FormControl(null, ValidatorsUtil.date);
  }


  executeClear($event: any) {
    this.fileControl.reset;
    this.renderFiles();
  }


  executeSearch() {
    this.search.filters.continueSearch = true;
    this.search.filters.fileName = this.search.filters.fileDTO ? this.search.filters.fileDTO.fileName : null;
    this.renderFiles();
  }

  executeAction(event : any) {
    if (event.action.action === 'download_file') {
      if (event.line.originDescription === 'Oracle') {
        let typeFile = event.line.fileName.includes('LOG_') ? 'LOG' : event.line.tributeType;
        this.fileService.downloadFileFTP(event.line.fileName, typeFile)
            .subscribe(
                content => {
                  BlobUtil.startDownload(
                      event.line.fileName,
                      content,
                      'text/plain; charset=ISO_8859_1',
                  );
                },
                e => this.messageService.error('INV-E081', e)
            );
      } else if (event.line.originDescription === 'SICOP') {
        this.integrationHistoryService.downloadFile(event.line.fileHash)
            .subscribe(
                content => {
                  BlobUtil.startDownload(
                      event.line.fileName,
                      content,
                      'text/plain; charset=ISO_8859_1',
                  );
                },
                e => this.messageService.dealWithError(e)
            );
      }
    } else if (event.action.action == 'process_file') {
      this.search.hideSpinnerMenu = false;
      this.integrationHistoryService.processFile(event.line.id)
      .subscribe(
        (resp)=>{
          resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E061');
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        },
        (e)=>{
          this.messageService.dealWithError(e);
          this.search.hideSpinnerMenu = true;
          this.search.search(true);
        },
        ()=>this.search.hideSpinnerMenu = true
      )
    }
  }

  chosenYearHandler(normalizedYear: any) {
    let ctrlValue = this.cmpControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.cmpControl.setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: any, datepicker: any) {
    const ctrlValue = this.cmpControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    ctrlValue.setDate(1);
    this.cmpControl.setValue(ctrlValue);
    datepicker.close();
  }

  displayFile(fileDTO:any) {
    if (!fileDTO) {
      return null;
    }
    return fileDTO.fileName;
  }


  public renderFiles() {
    this.fileControl.disable();
    let autoComplete;
    if (typeof this.search.filters.fileDTO == 'object' && this.search.fileDTO.fileName != null) {
      autoComplete = this.search.filters.fileDTO.fileName;
    } else {
      autoComplete = this.search.filters.fileDTO;
    }
    this.integrationHistoryService.getFileAutoComplete(autoComplete)
        .pipe(finalize(() => {
          this.fileControl.enable();
          this.filteredFiles = this.fileControl.valueChanges.pipe(
              startWith(''),
              map(name => name ? this.filterFiles(name) : this.allFiles.slice())
          );
        }))
        .subscribe((result: any) =>{
          this.allFiles = result;
        });
  }

  private filterFiles(type: string | any): {fileName: string}[] {
    if (typeof type === "string") {
      const filterValue = type.toLowerCase();
      return this.allFiles.filter(file => file.fileName.toLowerCase().indexOf(filterValue) >= 0);
    } else {
      return this.allFiles.filter(file => file.fileName === type.fileName);
    }
  }

  chosenYearHandlerCrtd(normalizedYear: any) {
    let ctrlValue = this.crtdControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.crtdControl.setValue(ctrlValue);
  }

  chosenMonthHandlerCrtd(normalizedMonth: any) {
    const ctrlValue = this.crtdControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.crtdControl.setValue(ctrlValue);
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

}

function hintCondition(element:any) {
  return !!element.buildErrorHint.length;
}

function downloadFileCondition(element: any) {
  return element.isDownloadable;
}

function processFileCondition(element: any) {
  return element.isProcessed;
}
