import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { InputFile, InputFileComponent, InputFileService } from 'ngx-input-file';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { StatusIntegrationContactService } from '../../services/status-integration-contact.service';

@Component({
  selector: 'app-status-integration-contact',
  templateUrl: './status-integration-contact.component.html',
  styleUrls: ['./status-integration-contact.component.scss']
})
export class StatusIntegrationContact implements OnInit {

  @ViewChild('inputComponent') inputComponent: InputFileComponent;
  @ViewChild('fileName') fileName: ElementRef;

  sourceSituations = new MatTableDataSource<any>();
  contactsSituationList: any[];

  inputFileModel: InputFile[];

  hideSpinner = true;

  requiredRolesToView: string = userRoles.inImportFileInclude;

  listSize: number;

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  };

  constructor(private messageService: MessageService,
              private inputFileService: InputFileService,
              public authService: AuthService,
              private statusIntegrationContactService: StatusIntegrationContactService) {
  }

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  onPageEventCustomerPeriod(event: any) {
    this.updateTableCustomerPeriod(event, this.contactsSituationList);
  }

  updateTableCustomerPeriod(event, completeList) {
    this.listSize = completeList.length;
    const begin = event.pageIndex * event.pageSize;
    const end = begin + event.pageSize;
    this.sourceSituations.data = [];
    completeList.slice(begin, end).forEach(item => this.sourceSituations.data.push(item));
    this.sourceSituations._updateChangeSubscription();
  }

  // tslint:disable-next-line: variable-name
  private initComponent(_this: any) {
    _this.inputComponent.onSelectFile = (fileList, button) => {
      if (!_this.inputComponent.disabled) {
        let files_1 = [];
        Array.from(fileList).forEach((file) => {
          const inputFile = { file };
          if (_this.fileGuard(_this, files_1, inputFile)) {
            files_1.push(inputFile);
            _this.acceptFile(inputFile);
          }
        });
        _this.inputComponent.writeValue(files_1);
        _this.inputComponent.fileInput.nativeElement.value = '';
      }
    };
  }

  // tslint:disable-next-line: variable-name
  fileGuard(_this, files, file) {
    if (!_this.inputFileService.limitGuard(files, _this.inputComponent.fileLimit)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.limitReached, file });
      return false;
    }
    if (!_this.inputFileService.sizeGuard(file.file, _this.inputComponent.sizeLimit)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.sizeReached, file });
      return false;
    }
    if (!_this.inputFileService.typeGuard(file.file, _this.inputComponent.fileAccept)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.badFile, file });
      return false;
    }
    return true;
  }

  invokeUploadModal() {
    this.inputComponent.fileInput.nativeElement.click();
  }

  acceptFile(file) {
    this.fileName.nativeElement.value = file.file.name;
  }

  deleteFile(index) {
    this.fileName.nativeElement.value = '';
  }

  // tslint:disable-next-line: variable-name
  rejectFile(_this, problem) {
    switch (problem.reason) {
      case _this.inputFileRejectedReason.badFile:
        _this.messageService.error('INV-EF01'); break;
      case _this.inputFileRejectedReason.limitReached:
        _this.messageService.error('INV-EF02'); break;
      case _this.inputFileRejectedReason.sizeReached:
        _this.messageService.error('INV-EF03'); break;
    }
  }

  rejectFileSimple(problem) {
    switch (problem.reason) {
      case this.inputFileRejectedReason.badFile:
        this.messageService.error('INV-EF01'); break;
      case this.inputFileRejectedReason.limitReached:
        this.messageService.error('INV-EF02'); break;
      case this.inputFileRejectedReason.sizeReached:
        this.messageService.error('INV-EF03'); break;
    }
  }


  upload() {
    this.prepareToUploadFile();
    this.uploadFileText();
  }
  messageResultArray(element: any) {
    this.showMessageError(element);

  }

  showMessageError(element: any) {
    if (element.type === 'ERROR') {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }

  uploadFileText() {
    const file = this.inputFileModel[0].file;
    const fr = new FileReader();
    this.hideSpinner = false;

    fr.onload = () => {
      this.statusIntegrationContactService.uploadFileStatusContactText(fr.result, file.name).subscribe(resp => {
        this.hideSpinner = true;
        this.contactsSituationList = resp.filter(r => r.contactId);
        this.onPageEventCustomerPeriod({ pageIndex: 0, pageSize: 10 });
        const foundMessage = resp.find(element => element.resultImportMessage);
        const msgError = foundMessage.resultImportMessage;
        msgError ? this.messageResultArray(msgError) : this.messageService.success('IMP-INVOICE-CALC');
      },
        (error) => {
          this.messageService.dealWithError(error);
          this.hideSpinner = true;
        },
        () => {
          this.hideSpinner = true;
        });
    };

    fr.readAsText(file);

  }

  remove() {
    this.inputComponent.onDeleteFile(0);
  }

  dealWithSuccess() {
    this.messageService.success('INV-S001');
    this.prepareToReleaseFile();
  }

  dealWithError(e) {
    this.messageService.dealWithError(e);
    this.prepareToReleaseFile();
  }

  prepareToUploadFile() {
    this.hideSpinner = false;
  }

  prepareToReleaseFile() {
    this.remove();
    this.hideSpinner = true;
  }
}
