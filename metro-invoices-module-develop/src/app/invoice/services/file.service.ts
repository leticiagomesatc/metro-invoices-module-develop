import { Injectable, } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private httpClient : HttpClient) { }

  createNote(file: any, fileName: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'file/create-note/', {file: file, fileName});
  }

  readCnab(file: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'file/read-cnab/', {file: file});
  }

  generateAccountingFile(fileType: any): Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.append('Accept', 'text/csv; charset=utf-8');
    return this.httpClient.post(environment.invoicesApi + 'file/accounting-file/', fileType, {
      headers: headers,
      observe: 'response',
      responseType: 'text'
    });
  }

  noteBilletImport(file: File):Observable<any> {
    const data: FormData = new FormData();
    data.append('file', file);
    return this.httpClient.post(environment.invoicesApi + 'file/note-billet-import/', data);
  }

  importMemoryCalc(file: File, customerId: string): Observable<any> {
    const data: FormData = new FormData();
    data.append('file', file);
    data.append('customerId', customerId);
    return this.httpClient.post(environment.invoicesApi + `file/invoice-calc-import/`, data);
  }

  downloadFileFTP(fileName: string, fileType: string): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `customers-integration-history/download-file-ftp/`+`${fileName}/${fileType}`, { responseType: 'blob' });
  }
}
