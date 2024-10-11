import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FwSearchService } from './../../shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from './../../shared/util/pageable';

@Injectable({
  providedIn: 'root'
})
export class ContactIntegrationHistoryService extends FwSearchService {

  fileMock: Array<any> = [
    { fileName: 'Conor McGregor', type: 'G', id: 2014 },
    { fileName: 'Tony Ferguson', type: 'I', id: 2015 },
    { fileName: 'Max Holloway', type: 'I', id: 2016 },
    { fileName: 'Jon Jones', type: 'I', id: 2017 },
    { fileName: 'Daniel Cormier', type: 'I', id: 2018 },
    { fileName: 'Brock Lesnar', type: 'I', id: 2020 }
  ];

  constructor(httpClient: HttpClient, private http: HttpClient) {
    super(httpClient);
  }

  getFileAutoComplete(type: string): Observable<any> {
    return type && type.length > 0 ?
      this.http.get(environment.invoicesApi + `contact-integration-history/filename-autocomplete/${type}`) :
      this.http.get(environment.invoicesApi + 'contact-integration-history/filename-autocomplete');
  }

  getFileAutoCompleteMock(type: string): Observable<any> {
    return type ? of(this.fileMock.filter(fm => fm.type === type)) : of(this.fileMock);
  }

  downloadFile(fileHash: number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'contact-integration-history/download-file/' + fileHash, { headers: headers, responseType: 'blob' });
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('contact-integration-history', filters, pageable, sort);
  }

}
