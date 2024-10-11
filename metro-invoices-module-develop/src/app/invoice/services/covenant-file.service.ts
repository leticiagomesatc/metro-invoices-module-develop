import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { HttpClient, HttpResponse } from "@angular/common/http";
import * as _ from 'lodash';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable()
export class CovenantFileService extends FwSearchService {
  
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }
  
  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('covenant-files', filters, pageable, sort);
  }

  create(form: any): Observable<any> {
    return this.http.post(environment.invoicesApi + 'covenant-files/create', form);
  }

  downloadFile(fileHash : number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'covenant-files/download/'+fileHash, { headers:headers, responseType: 'blob' });
  }

  downloadAll(filters: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'covenant-files/download/zip-content', { headers:headers, responseType: 'blob', params: filters});
  }

}