import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import {SearchProvider} from '../../shared/controllers/search-provider';
import { InputFile } from 'ngx-input-file';

@Injectable({
  providedIn: 'root'
})
export class DebitNoteService   {
  
   
  constructor(private httpClient : HttpClient) { }


  
  issueNote(request : any[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/requests',request);
  }

  generateBillet(id : number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/'+id+'/billet', {headers:headers, responseType: 'blob' });
  }

  downloadNote(id : number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/'+id+'/pdf-content', {headers:headers, responseType: 'blob' });
  }

  downloadZipDebitNotes(ids : number[],billet: boolean, note: boolean): Observable<any> {
    const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/octet-stream'};
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/generate/zip-content/'+ids+'/'+billet+'/'+note, {headers:headers,  responseType: 'blob' });
  }

  sendBilletNoteEmail(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/email/billet-note/',ids);
  }

  sendBilletEmail(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/email/billet/',ids);
  }

  sendBilletNoteWithEmail(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/emails/billet-note/', result);
  }

  sendBilletWithEmail(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/emails/billet/', result);
  }

  generateDuplicateBillet(result: any, noteNumberId : number): Observable<any> {
    result.debitNoteId = noteNumberId;
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/generate-duplicate-billet', result);
  }

  getCustomerByDebitNote(debitNoteId: number){
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/customer/' + debitNoteId);
  }

  validateNoteOutOfCompetence(debitNoteId: number){
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/out-of-competence/' + debitNoteId);
  }


  public cancelDebitNote(serialNumber: number, justificationId: number, files: InputFile[]): Observable<any> {
    
    const formData: FormData = new FormData();
    files.forEach(file=>{ formData.append('file', file.file, file.file.name)} )
    formData.append('id', serialNumber.toString());
    formData.append('justificationId', justificationId.toString());
  
    return this.httpClient.post(environment.invoicesApi + 'debit-notes/issues/cancel-debit-note', formData);
    
  }  

  downloadCancelledNotes(noteId : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'debit-notes/issues/'+noteId+'/zip-cancelled-files', {headers:headers,  responseType: 'blob' });
  }
}
