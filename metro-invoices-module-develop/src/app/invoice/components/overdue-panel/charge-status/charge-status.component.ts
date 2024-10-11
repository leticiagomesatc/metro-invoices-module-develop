import { Component, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { ChargeService } from 'src/app/invoice/services/charge.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { empty } from 'rxjs';
import { MatTableDataSource } from '@angular/material';
import { Location } from '@angular/common';
import { BlobUtil } from 'src/app/shared/util/blob.util';
import { InputFileComponent, InputFileService } from 'ngx-input-file';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

const LOCALE = 'pt-BR';

@Component({
  selector: 'app-charge-status',
  templateUrl: './charge-status.component.html',
  styleUrls: ['./charge-status.component.scss'],
})
export class ChargeStatusComponent {

  @ViewChild('inputComponent') inputComponent: InputFileComponent

  id: number
  headerValue: any

  loadedInfo: boolean = false

  hasDunningExecutions: boolean = false;
  dunningName: string
  dunningDataSource: MatTableDataSource<any>

  hasPreviousCharges: boolean = false
  previousChargesDataSource: MatTableDataSource<any>

  fileSize: number;

  today: Date = new Date();

  form: FormGroup;

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }

  disableSaveBtn:boolean = false

  requiredRolesToInclude: string = userRoles.overduePanelInclude;

  constructor(
    public validate: FwValidateService,
    private route: ActivatedRoute,
    private router: Router,
    private inputFileService: InputFileService,
    private chargeService: ChargeService,
    private messageService: MessageService,
    private location: Location,
    private builder: FormBuilder,
    public authService: AuthService) { }

  ngOnInit(): void {
    this.authService.checkAuthorization(this.requiredRolesToInclude, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.loadedInfo = false;
    let sb = _this.route.paramMap.pipe(switchMap((params: any) => {
      _this.id = params.get('id');
      return !_this.id ? empty() : _this.chargeService.retrieveHeader(_this.id);
    })).subscribe(_this.loadHeaderData(_this), (error) => _this.messageService.dealWithError(error));
    _this.form = _this.builder.group({
      status: [null, Validators.required],
      supposedPaymentDay: null,
      chargingCustomerSentDay: null,
      chargingCustomerReturnDay: null,
      observation: null,
      attachments: [[]]
    });
    _this.today.setDate(_this.today.getDate() + 1);
  }

  private loadHeaderData(_this: any): (value: any) => void {
    return entity => {
      _this.loadedInfo = true;
      _this.updateInputComponent(_this);
      _this.headerValue = entity;
      _this.chargeService.retrieveDunning(_this.id, _this.headerValue.customerId).subscribe(_this.loadDunningExecutionData(_this), err => _this.messageService.dealWithError(err));
      _this.chargeService.retrievePreviousCharges(_this.id).subscribe(_this.loadPreviousChargesData(), err => _this.messageService.dealWithError(err));
    };
  }

  private updateInputComponent(_this: any) {
    _this.inputComponent.onSelectFile = (fileList, button) => {
      if (!_this.inputComponent.disabled) {
        var files_1 = [];
        Array.from(fileList).forEach(function (file) {
          var inputFile = { file: file };
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

  private loadDunningExecutionData(_this: any): (value: any) => void {
    return result => {
      _this.dunningName = result.name;
      _this.dunningDataSource = new MatTableDataSource(result.dunningExecutions);
      if (result.dunningExecutions && result.dunningExecutions.length >= 1) {
        _this.hasDunningExecutions = true;
      }
    };
  }

  private loadPreviousChargesData(): (value: any) => void {
    return result => {
      this.previousChargesDataSource = new MatTableDataSource(result);
      if (result.length >= 1) {
        this.hasPreviousCharges = true;
      } 
    };
  }

  downloadAttachments(element: any) {
    this.chargeService.downloadAttachments(element.id)
    .subscribe(
      content => {
        BlobUtil.startDownload(
          `ATC-ANEXOS-COBRANCA.zip`,
          content,
          'application/zip'
        );
      },
      (e) => this.messageService.dealWithError(e)
    );
  }

  saveCharge() {
    if (this.form.valid && !this.disableSaveBtn) {
      this.disableSaveBtn = true
      this.chargeService.saveCharge(this.form.value, this.id).subscribe(this.successfullSave(),
        (error) => {
          this.messageService.dealWithError(error)
          this.disableSaveBtn = false
        }
      )
    }

  }

  private successfullSave(): (value: any) => void {
    return (result) => {
      this.messageService.success('AT-S002');
      this.disableSaveBtn = false
      this.form.reset()
      for (let name in this.form.controls) {
        this.form.controls[name].markAsUntouched();
      }
      this.removeAllAttachments();
      this.chargeService.retrievePreviousCharges(this.id).subscribe(this.loadPreviousChargesData(), err => this.messageService.dealWithError(err));
    };
  }

  goBack() {
    this.location.back();
  }

  invokeUploadModal() {
    this.inputComponent.fileInput.nativeElement.click();
  }

  acceptFile(file) {
    this.fileSize = this.form.get('attachments').value.length + 1;
  }

  removeAllAttachments() {
    this.fileSize = undefined
    while (this.form.get('attachments').value.length > 0) this.inputComponent.onDeleteFile(0)
  }

  rejectFile(problem) {
    switch (problem.reason) {
      case this.inputFileRejectedReason.badFile:
        this.messageService.error('INV-EF01'); break;
      case this.inputFileRejectedReason.limitReached:
        this.messageService.error('INV-EF02'); break;
      case this.inputFileRejectedReason.sizeReached:
        this.messageService.error('INV-EF03'); break;
    }
  }

  fileGuard(_this, files, file) {
    if (!_this.inputFileService.limitGuard(files, _this.inputComponent.fileLimit)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.limitReached, file: file });
      return false;
    }
    if (!_this.inputFileService.sizeGuard(file.file, _this.inputComponent.sizeLimit)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.sizeReached, file: file });
      return false;
    }
    if (!_this.inputFileService.typeGuard(file.file, _this.inputComponent.fileAccept)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.badFile, file: file });
      return false;
    }
    return true;
  };

}