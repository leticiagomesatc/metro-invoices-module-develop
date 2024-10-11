import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { InputFile, InputFileComponent, InputFileService } from 'ngx-input-file';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FileService } from '../../services/file.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { AuthService } from 'src/app/shared/security/auth/auth.service';


@Component({
  selector: 'app-cnab-import',
  templateUrl: './cnab-import.component.html',
  styleUrls: ['./cnab-import.component.scss']
})
export class CnabImport implements OnInit {


  requiredRolesToView: string = userRoles.inCnabIncl;

  @ViewChild('inputComponent') inputComponent: InputFileComponent
  @ViewChild('fileName') fileName: ElementRef;

  inputFileModel: InputFile[];

  hideSpinner:boolean=true;

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }

  constructor(private messageService: MessageService, 
              private fileService: FileService,
              private inputFileService: InputFileService,
              private authService: AuthService) {
  }

  ngOnInit(){
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: this) {
    _this.inputComponent.onSelectFile = (fileList, button) => {
      if (!_this.inputComponent.disabled) {
        var files_1 = [];
        Array.from(fileList).forEach(function (file) {
          var inputFile = { file: file };
          if (_this.fileGuard(files_1, inputFile)) {
            files_1.push(inputFile);
            _this.acceptFile(inputFile);
          }
        });
        _this.inputComponent.writeValue(files_1);
        _this.inputComponent.fileInput.nativeElement.value = '';
      }
    };
  }

  invokeUploadModal() {
    this.inputComponent.fileInput.nativeElement.click();
  }

  acceptFile(file) {
    this.fileName.nativeElement.value = file.file.name;
  }

  deleteFile(index: any) {
    this.fileName.nativeElement.value = '';
  }

  rejectFile(problem: any) {
    switch(problem.reason) {
      case this.inputFileRejectedReason.badFile:
        this.messageService.error('INV-EF01'); break;
      case this.inputFileRejectedReason.limitReached:
        this.messageService.error('INV-EF02'); break;
      case this.inputFileRejectedReason.sizeReached:
        this.messageService.error('INV-EF03'); break;
    }
  }

  upload() {
    this.prepareToUploadFile()
    this.uploadFile()
  }

  uploadFile() {
    let file = this.inputFileModel[0].file;
    let fr = new FileReader();
    fr.onload = (e) => {
      this.fileService.readCnab(fr.result).subscribe(
        ()=>this.dealWithSuccess(),
        (e)=>this.dealWithError(e)
      );
    }
    fr.readAsText(file);
  }

  remove() {
    this.inputComponent.onDeleteFile(0);
  }

  dealWithSuccess() {
    this.messageService.success('INV-S003')
    this.prepareToReleaseFile()
  }

  dealWithError(e) {
    this.messageService.dealWithError(e)
    this.prepareToReleaseFile()
  }

  
  prepareToUploadFile() {
    this.hideSpinner = false;
  }

  prepareToReleaseFile() {
    this.remove();
    this.hideSpinner = true;
  }

  fileGuard(files, file) {
    if (!this.inputFileService.limitGuard(files, this.inputComponent.fileLimit)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.limitReached, file: file });
      return false;
    }
    if (!this.inputFileService.sizeGuard(file.file, this.inputComponent.sizeLimit)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.sizeReached, file: file });
      return false;
    }
    if (!this.inputFileService.typeGuard(file.file, this.inputComponent.fileAccept)) {
      this.rejectFile({ reason: this.inputFileRejectedReason.badFile, file: file });
      return false;
    }
    return true;
  };
}