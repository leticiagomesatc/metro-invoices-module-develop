import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';

@Injectable({
  providedIn: 'root'
})
export class CustomerIntegrationService extends FwSearchService {

  constructor(httpClient: HttpClient, private http: HttpClient) {
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('customers-integration', filters, pageable, sort);
  }

  generateGroupIntegrationFile(invoiceIds: any): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'customers-integration/generate-group-integration-file', invoiceIds);
  }

  
  generateIntegrationFile(customerId: any): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'customers-integration/generate-integration-file', customerId);
  }

  processFile(integrationId: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'customers-integration/process-file/', integrationId);
  }
}
