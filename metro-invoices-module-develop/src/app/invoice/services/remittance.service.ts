import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../environments/environment';


@Injectable()
export class RemittanceService  {
  
   
  constructor(private httpClient : HttpClient) { 
    
  }

  generate() {
    return this.httpClient.post(environment.invoicesApi + 'remittances/',{});
  }
  downloadFile(id : number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'remittances/'+id+'/file', {headers:headers, responseType: 'blob' });
  }


}
