import { Injectable, } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { map } from 'rxjs/operators';
import { InputFile } from 'ngx-input-file';

@Injectable({
  providedIn: 'root'
})
export class DecreaseBilletService {

  constructor(private httpClient: HttpClient) { 
  }
  
  public save(data: any): Observable<any> {
    
    const formData: FormData = new FormData();
    formData.append('billetId',data.billetId)
    if(data.fileList && data.fileList.length > 0) data.fileList.forEach(file=>{ formData.append('fileList', file.file, file.file.name)} )
    if(data.value) formData.append('value',data.value)
    if(data.operationType) formData.append('operationType',data.operationType)
    if(data.despiseValue) formData.append('despiseValue',data.despiseValue)
  
    return this.httpClient.post(environment.invoicesApi + 'decrease/save', formData);
  }  

  bulkSave(balances : any[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'decrease/bulk-save',balances);
  }

  downloadFile(id : number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'decrease/download/'+id, { headers:headers, responseType: 'blob' });
  }

  downloadZipBillets(ids : number[]): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'decrease/generate/zip-content/'+ids, {headers:headers,  responseType: 'blob' });
  }

  sendZipBilletsEmail(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'decrease/emails/billets/', ids);
  }

}
