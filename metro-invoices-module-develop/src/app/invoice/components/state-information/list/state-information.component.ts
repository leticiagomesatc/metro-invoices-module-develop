import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { StateInformationService } from 'src/app/invoice/services/state-information.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { Severity } from 'src/app/shared/communication/severity.enum';
import { ConfirmComponent } from 'src/app/shared/components/confirm-dialog/confirm.component';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { StateInformationEditComponent } from '../edit/state-information-edit.component';

@Component({
  selector: 'app-state-information',
  templateUrl: './state-information.component.html',
  styleUrls: ['./state-information.component.scss']
})
export class StateInformationComponent implements OnInit{

    cols = [
        { title: 'Estado', prop: 'stateId' },
        { title: 'Nome', prop: 'description'},
        { title: 'ORG Venda', prop: 'salesOrganization'},
        { title: 'ICMS', prop: 'icms' },
        { title: 'PIS', prop: 'pis' },
        { title: 'COFINS', prop: 'cofins' },
        { title: 'OUTROS', prop: 'other' }
      ];

       actions = [
         {
           action: 'actions',
           subActions: [
             {
               title: 'Editar item',
               action: 'edit_item',
               role: userRoles.administracaoEditar,
               icon: { name: 'edit' }
             }
           ]
         }
       ];

  @ViewChild('search') search: any;

  dialogRef: MatDialogRef<any>;
  userRoles = userRoles;
  form : FormGroup;
  requiredRolesToView: string = userRoles.ticketsDiscount;


  edit: boolean = false;

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    this.search.filters.continueSearch = true;
  }

  
  execute(event : any) {
    this.search.hideSpinnerMenu = false;
    if (event.action.action == 'edit_item') {
      this.showEdit(event.line);
    } 
  }


  messageResultArray(value: any) {
    value.forEach(element => {
      this.showMessageSuccess(element);
      this.showMessageError(element);
    });
  }

  showMessageSuccess(element: any) {
    if (element.type === 'SUCCESS') {
      this.messageService.showInlineMessage(Severity.INFO, element.message);
    }
  }

  showMessageError(element: any) {
    if (element.type === 'ERROR') {
      this.messageService.showInlineMessage(Severity.ERROR, element.message);
    }
  }

  showConfirm(msg: string, action: Function) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(ConfirmComponent, { data: { msg: msg }, width: '415px'});
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      action(result);
    });
  }

  showEdit(aliq: any) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(StateInformationEditComponent, {data: { aliq: aliq, search: this.search}, width:'950px', height:'800px'});
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      this.search.hideSpinnerMenu = true;
    });
  }

}