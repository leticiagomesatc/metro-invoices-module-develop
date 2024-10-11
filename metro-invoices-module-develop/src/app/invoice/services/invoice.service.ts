import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { InputFile } from 'ngx-input-file';
import { Observable } from 'rxjs';
import { userRoles } from 'src/app/shared/util/user-roles';
import { environment } from 'src/environments/environment';
import { SearchProvider } from '../../shared/controllers/search-provider';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService implements SearchProvider {
   
  constructor(private httpClient : HttpClient) {}

  requiredRolesToDownload: string = userRoles.inInvoiceDownload;

  search(filters: any, pageable: any): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'invoices');
  }

  issueNote(ids : number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoices/notes/',ids);
  }

  generateBillet(noteNumber : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoices/notes/'+noteNumber+'/billet', {headers:headers,  responseType: 'blob' });
  }

  sendBilletNoteEmail(serialNumbers: number[], onlyBillet: boolean): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoices/email/billet-note/', { serialNumbers: serialNumbers, onlyBillet: onlyBillet });
  }

  sendBilletNoteWithEmail(result: any, onlyBillet: boolean, serialNumber: number):Observable<any> {
    result.onlyBillet = onlyBillet;
    result.serialNumber = serialNumber;
    return this.httpClient.post(environment.invoicesApi + 'invoices/emails/billet-note/', result);
  }

  downloadNote(noteNumber : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoices/notes/'+noteNumber+'/generate/pdf-content', {headers:headers,  responseType: 'blob' });
  }

  downloadZipNotes(ids : number[],billet: boolean, note: boolean): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoices/generate/zip-content/'+ids+'/'+billet+'/'+note, {headers:headers,  responseType: 'blob' });
  }

  validateExpiredNotes(ids: number[]): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.httpClient.get(environment.invoicesApi + 'invoices/notes/expired/' + ids, {headers:headers});
  }

  generateDuplicateBillet(result: any, serialNumber : number): Observable<any> {
    result.serialNumber = serialNumber;
    return this.httpClient.post(environment.invoicesApi + 'invoices/generate-duplicate-billet', result);
  }

  getCustomerByInvoice(invoiceId: number){
    return this.httpClient.get(environment.invoicesApi + 'invoices/customer/' + invoiceId);
  }

  validateNoteOutOfCompetence(noteId: number){
    return this.httpClient.get(environment.invoicesApi + 'invoices/notes/out-of-competence/' + noteId);
  }

  public cancelInvoiceNote(id: number, justificationId: number, files: InputFile[]): Observable<any> {
    
    const formData: FormData = new FormData();
    files.forEach(file=>{ formData.append('file', file.file, file.file.name)} )
    formData.append('id', id.toString());
    formData.append('justificationId', justificationId.toString());
  
    return this.httpClient.post(environment.invoicesApi + 'invoices/notes/cancel-invoice-note', formData);
  }  

  downloadCancelledNotes(noteNumber : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoices/notes/'+noteNumber+'/zip-cancelled-files', {headers:headers,  responseType: 'blob' });
  }

  getAllDiscountType(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'invoices/discountType');
  }

  getInvoiceItems(id: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `invoices/items/${id}`);
  }

  getPenaltyDiscountAmountGross(id: number, discount: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `invoices/discount/${id}/${discount}`);
  }

  getGrossActivationTax(id: number, activationTax: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `invoices/activationTax/${id}/${activationTax}`);
  }

  getGrossAmountInvoiced(id: number, amountInvoiced: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `invoices/amountInvoiced/${id}/${amountInvoiced}`);
  }

}
