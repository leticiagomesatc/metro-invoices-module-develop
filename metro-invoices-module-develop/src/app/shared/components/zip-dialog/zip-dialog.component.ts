import { Component, OnInit, Inject} from '@angular/core';
import { MessageService } from '../../communication/message.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BlobUtil } from '../../util/blob.util';
import { InvoiceService } from 'src/app/invoice/services/invoice.service';

@Component({
  selector: 'app-zip-dialog',
  templateUrl: './zip-dialog.component.html',
  styleUrls: ['./zip-dialog.component.scss']
})
export class ZipDialogComponent implements OnInit {

  
  title: string;
  billet: boolean = true;
  note: boolean = true;
    
  
  constructor( private messageService : MessageService,

    private invoiceService: InvoiceService,
    private dialogRef: MatDialogRef<ZipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
   ) {}
  

  

  ngOnInit() {
  }
  confirm(){
    if (this.billet==false && this.note == false){
      this.messageService.error('INV-E023');
    }else{
      this.data.funcaoSucesso(this.billet, this.note)
      this.close();
    }
  }
  

  close(): void {
    this.dialogRef.close();
  }

}
