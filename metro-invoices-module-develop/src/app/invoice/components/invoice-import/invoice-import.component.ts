import { Component, ViewChild, ElementRef, OnInit, Renderer2, EventEmitter } from '@angular/core';

import { environment } from 'src/environments/environment';
import { MessageService } from 'src/app/shared/communication/message.service';
import { InputFile, InputFileComponent, InputFileService } from 'ngx-input-file';
import { FileService } from '../../services/file.service';
import { MatButton } from '@angular/material';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { Subject } from 'rxjs';
import { animate } from '@angular/animations';

@Component({
  selector: 'app-invoice-import',
  templateUrl: './invoice-import.component.html',
  styleUrls: ['./invoice-import.component.scss']
})
export class InvoiceImport implements OnInit {

  @ViewChild('inputComponent') inputComponent: InputFileComponent
  @ViewChild('fileName') fileName: ElementRef;

  inputFileModel: InputFile[];
  listaFiles: any[] = [];
  listaFilesName: any[] = [];
  hideSpinner:boolean=true;

  requiredRolesToView: string = userRoles.inImportFileInclude;

  inputFileRejectedReason: any = {
    badFile: 0,
    limitReached: 1,
    sizeReached: 2
  }

  constructor(private messageService: MessageService,
    private inputFileService: InputFileService,
    public authService: AuthService,
    private importService: FileService) {
  }

  ngOnInit(){
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.inputComponent.onSelectFile = (fileList, button) => {
      if (!_this.inputComponent.disabled) {
        var files_1 = [];
        Array.from(fileList).forEach(function (file) {
          var inputFile = { file: file };
          if (_this.fileGuard(_this, files_1, inputFile)) {
            files_1.push(inputFile);
          }
        });
        _this.acceptFile(files_1);
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
    const fileNames = [];
    for (let i = 0; i < file.length; i++) {
      fileNames.push(file[i].file.name);  
    }
    this.fileName.nativeElement.value = fileNames.join(';');
    
    this.listaFiles = [], this.listaFilesName = [];
    file.forEach(element => {
       let fr = new FileReader();
         fr.onload = () => {
           this.listaFiles.push(fr.result);
           this.listaFilesName.push(element.file.name);
         }
         fr.readAsText(element.file);
     });
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
     if(this.listaFiles.length === 0 && this.listaFilesName.length === 0){
      this.dealWithWarning()
     }else{
       this.importService.createNote(this.listaFiles, this.listaFilesName).subscribe(
         ()=>this.dealWithSuccess(),
         (e)=>this.dealWithError(e)
       );
     }
  }

  remove() {
    this.inputComponent.onDeleteFile(0);
  }

  dealWithWarning() {
    this.messageService.warning('INV-E023');
    this.prepareToReleaseFile()
  }

  dealWithSuccess() {
    this.messageService.success('AT-S007')
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
    this.listaFiles = [], this.listaFilesName = []
    this.remove();
    this.hideSpinner = true;
  }
}
