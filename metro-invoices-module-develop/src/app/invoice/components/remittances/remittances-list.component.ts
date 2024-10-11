import { formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { MessageService } from '../../../shared/communication/message.service';
import { BlobUtil } from '../../../shared/util/blob.util';
import { RemittanceService } from '../../services/remittance.service';
 

@Component({
  selector: 'app-remittances-list',
  templateUrl: './remittances-list.component.html',
  styleUrls: ['./remittances-list.component.scss'],
})
export class RemittancesList   {
  
  userRoles = userRoles;
  
  cols = [
    {title:'Gerado em', prop: 'created' , converter : formatSimpleDate},
    {title:'Quantidade de títulos',prop:'total'}
  ];

  actions = [
    {
      // title : 'Ações', 
      action : 'actions', 
      subActions : [
        
        {
          title:'Download', 
          action: 'download', 
          icon:{name:'cloud_download'}
        }
      ]
    }
  ];
  
 

  @ViewChild('search') search : any; 

   

  constructor(
    public auth : AuthService,
    private messageService : MessageService,
    private remittanceService: RemittanceService,
    private cd : ChangeDetectorRef) {}

  ngOnInit() {
   
    
  }

  isDevMode() {
    return false;
  }

  generate() {
    this.search.hideSpinnerMenu = false;
    this.remittanceService.generate()
        .subscribe(
          ()=> this.search.search(),
          (e)=> {
            this.messageService.dealWithError(e);
            this.search.hideSpinnerMenu = true;
          },
          () => this.search.hideSpinnerMenu = true
        );
  }

  execute(event : any) {
   if (event.action.action == 'download') {
      this.remittanceService.downloadFile(event.line.id)
        .subscribe(
          content=> {
            BlobUtil.startDownload(
              `ATC-Remessa_${formatDateInverse(event.line.created)}.rem`,
              content,
              'text/plain; charset= windows-1252'
            );
          },
          (e)=> this.messageService.dealWithError(e)
        );
    } 
  }
  

  
}


function formatSimpleDate(object : any){
  if (!object) {
    return null;
  }
  return formatDate(object, 'dd/MM/yyyy HH:mm:ss','pt-BR');
}
function formatDateInverse(object : any){
  if (!object) {
    return null;
  }
  return formatDate(object, 'yyyyMMdd','pt-BR');
}
