import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import {SearchProvider} from '../../shared/controllers/search-provider';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';

@Injectable()
export class ChargeService extends FwSearchService {
  
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('charge', filters, pageable, sort);
  }

  retrieveHeader(billetId: number): Observable<any> {
      return this.http.get( environment.invoicesApi + 'charge/header/'+ billetId);
  }

  retrieveDunning(billetId:number, customerId:number):Observable<any> {
    return this.http.get( environment.invoicesApi + 'charge/dunning/'+[customerId, billetId])
  }

  retrievePreviousCharges(billetId:number):Observable<any> {
    return this.http.get( environment.invoicesApi + 'charge/'+ billetId)
  }

  downloadAttachments(chargeId: number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'charge/download/'+chargeId, { headers:headers, responseType: 'blob' });
  }

  saveCharge(charge: any, billetId: number): Observable<any> {
    const formData: FormData = new FormData();
    
    formData.append('billetId', billetId.toString());
    formData.append('status', charge.status);

    if(charge.supposedPaymentDay) 
      formData.append('supposedPaymentDay', charge.supposedPaymentDay)

    if(charge.chargingCustomerSentDay) 
      formData.append('chargingCustomerSentDay', charge.chargingCustomerSentDay)

    if(charge.chargingCustomerReturnDay) 
      formData.append('chargingCustomerReturnDay', charge.chargingCustomerReturnDay)

    if(charge.observation) 
      formData.append('observation', charge.observation)
    
    if(charge.attachments && charge.attachments.length > 0) charge.attachments.forEach(file=>{ formData.append('file', file.file, file.file.name)} )

    return this.http.post(environment.invoicesApi + 'charge/save', formData);
  }

  export(filters: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'charge/export', { headers:headers, responseType: 'blob', params: filters});
  }

  
}
