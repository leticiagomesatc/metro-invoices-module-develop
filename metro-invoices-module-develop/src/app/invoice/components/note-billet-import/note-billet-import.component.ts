import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { InputFileService, InputFileComponent, InputFile } from 'ngx-input-file';
import { FileService } from '../../services/file.service';
import { userRoles } from 'src/app/shared/util/user-roles';

@Component({
  selector: 'app-note-billet-import',
  templateUrl: './note-billet-import.component.html',
  styleUrls: ['./note-billet-import.component.scss']
})
export class NoteBilletImportComponent implements OnInit {

  @ViewChild('inputComponent') inputComponent: InputFileComponent
  @ViewChild('fileName') fileName: ElementRef;

  inputFileModel: InputFile[];

  hideSpinner:boolean=true;

  requiredRolesToView: string = userRoles.inImportFileInclude;

  constructor(private messageService: MessageService, 
    private inputFileService: InputFileService,
    public authService: AuthService,
    private importService: FileService) {
  }

  ngOnInit(){
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }
  
  private initComponent(_this: any) {
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

  fileGuard(_this, files, file) {
    if (!_this.inputFileService.limitGuard(files, _this.inputComponent.fileLimit)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.limitReached, file: file });
      return false;
    }
    if (!_this.inputFileService.sizeGuard(file.file, _this.inputComponent.sizeLimit)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.sizeReached, file: file });
      return false;
    }
    if (!_this.inputFileService.typeGuard(file.file, _this.inputComponent.fileAccept)) {
      _this.rejectFile(_this, { reason: _this.inputFileRejectedReason.badFile, file: file });
      return false;
    }
    return true;
  };

  invokeUploadModal() {
    this.inputComponent.fileInput.nativeElement.click();
  }

  acceptFile(file) {
    this.fileName.nativeElement.value = file.file.name;
  }

  deleteFile(index) {
    this.fileName.nativeElement.value = '';
  }

  rejectFile(_this, problem) {
    switch(problem.reason) {
      case _this.inputFileRejectedReason.badFile:
        _this.messageService.error('INV-EF01'); break;
      case _this.inputFileRejectedReason.limitReached:
        _this.messageService.error('INV-EF02'); break;
      case _this.inputFileRejectedReason.sizeReached:
        _this.messageService.error('INV-EF03'); break;
    }
  }

  rejectFileSimple(problem) {
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
    this.importService.noteBilletImport(file).subscribe(
      ()=>this.dealWithSuccess(),
      (e)=>this.dealWithError(e)
    );
  }

  remove() {
    this.inputComponent.onDeleteFile(0);
  }

  dealWithSuccess() {
    this.messageService.success('IMPORT-S001')
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

}
