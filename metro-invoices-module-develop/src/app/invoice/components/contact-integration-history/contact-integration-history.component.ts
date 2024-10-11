import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize, startWith, map } from 'rxjs/operators';
import { ValidatorsUtil } from 'src/app/shared/util/validators.util';
import { ContactIntegrationHistoryService } from './../../services/contact-integration-history.service';
import { BlobUtil } from './../../../shared/util/blob.util';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { ContactIntegrationService } from './../../services/contact-integration.service';
import { FileService } from './../../services/file.service';

@Component({
  selector: 'app-contact-integration-history',
  templateUrl: './contact-integration-history.component.html',
  styleUrls: ['./contact-integration-history.component.scss']
})


export class ContactIntegrationHistoryComponent implements OnInit {

  cols = [
    { title: 'Arquivo', prop: 'fileDTO' },
    { title: 'Data de criação', prop: 'period' },
    { title: 'Usuário', prop: 'userName' },
    { title: 'Origem', prop: 'integrationOrigin' },
    { title: 'Situação', prop: 'integrationStatus' },
    { title: '', prop: 'buildErrorHint', hintCondition: hintCondition, enableHint: true },
  ];

  actions = [
    {
      // title : 'Ações',
      action: 'actions',
      subActions: [
        {
          title: 'Download Arquivo',
          condition: downloadFileCondition,
          action: 'download_file',
          role: '',// TO-DO: Role
          icon: { name: 'cloud_download' }
        },
        {
          title: 'Processar arquivo',
          condition: processFileCondition,
          action: 'process_file',
          role: '',// TO-DO: Role
          icon: { name: 'cloud_download' }
        }
      ]
    }
  ];

  @ViewChild('search') search: any;

  hideSpinner: boolean = false;
  requiredRolesToView: string = ""; // userRoles.inImportFileInclude


  fileControl = new FormControl();
  filteredFiles: Observable<{ fileName: string }[]>;
  allFiles: { fileName: string }[] = [];

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }

  cmpControl: any;

  constructor(
    public authService: AuthService,
    private fileService: FileService,
    private messageService: MessageService,
    private contactIntegrationHistoryService: ContactIntegrationHistoryService,
    private contactIntegrationService: ContactIntegrationService
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = false;
    this.setInitialDate();
  }

  setInitialDate() {
    this.cmpControl = new FormControl(null, ValidatorsUtil.date);
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

  executeAction(event: any) {
      if (event.action.action == 'download_file') {
          if (event.line.integrationOrigin == "Oracle") {
              this.fileService.downloadFileFTP(event.line.fileDTO, 'C')
                  .subscribe(
                      content => {
                          BlobUtil.startDownload(
                              event.line.fileDTO, content, 'text/plain; charset= ISO_8859_1',
                          );
                      },
                      (e) => this.messageService.error('INV-E081', e)
                  );
          } else if (event.line.integrationOrigin == "SICOP") {
              this.contactIntegrationHistoryService.downloadFile(event.line.fileHash)
                  .subscribe(
                      content => {
                          BlobUtil.startDownload(
                              event.line.fileDTO.replace(" ", ""),
                              content,
                              'text/plain; charset= ISO_8859_1',
                          );
                      },
                      (e) => this.messageService.dealWithError(e)
                  );
          }

      } else if (event.action.action == 'process_file') {
          this.search.hideSpinnerMenu = false;
          this.contactIntegrationService.processFile(event.line.id)
        .subscribe(
          (resp) => {
            resp.length > 0 ? this.messageResultArray(resp) : this.messageService.success('INV-E061');
            this.search.hideSpinnerMenu = true;
            this.search.search(true);
          },
          (e) => {
            this.messageService.dealWithError(e);
            this.search.hideSpinnerMenu = true;
            this.search.search(true);
          },
          () => this.search.hideSpinnerMenu = true
        )
      }
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

  public renderFiles() {
    this.fileControl.disable();
    let autoComplete;
    if (typeof this.search.filters.fileDTO == 'object' && this.search.filters.fileDTO.fileName != null) {
      autoComplete = this.search.filters.fileDTO.fileName;
    } else {
      autoComplete = this.search.filters.fileDTO;
    }
    this.contactIntegrationHistoryService.getFileAutoComplete(autoComplete)
      .pipe(finalize(() => {
        this.fileControl.enable();
        this.filteredFiles = this.fileControl.valueChanges.pipe(
          startWith(''),
          map(name => name ? this.filterFiles(name) : this.allFiles.slice())
        );
      }))
      .subscribe((result: any) => {
        this.allFiles = result;
      });
  }

  private filterFiles(type: string | any): { fileName: string }[] {
    if (typeof type === "string") {
      const filterValue = type.toLowerCase();
      return this.allFiles.filter(file => file.fileName.toLowerCase().indexOf(filterValue) >= 0);
    } else {
      return this.allFiles.filter(file => file.fileName === type.fileName);
    }
  }

  isNotString(value: any): boolean {
    return typeof value !== "string";
  }

  selectionCondition(item: any) {
    return true;
  }

  chosenYearHandler(normalizedYear: any) {
    let ctrlValue = this.cmpControl.value;
    if (!ctrlValue) {
      ctrlValue = new Date();

    }
    ctrlValue.setYear(normalizedYear.getFullYear());
    this.cmpControl.setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: any) {
    const ctrlValue = this.cmpControl.value;
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.cmpControl.setValue(ctrlValue);
  }

  displayFile(fileDTO: any) {
    if (!fileDTO) {
      return null;
    }
    return fileDTO.fileName;
  }
}

function hintCondition(element: any) {
  return !!element.buildErrorHint.length;
}

function downloadFileCondition(element: any) {
  return element.isDownloadable;
}

function processFileCondition(element: any) {
  return element.isProcessed;
}
