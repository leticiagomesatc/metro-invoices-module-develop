import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactIntegrationService extends FwSearchService {

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('contact-integration', filters, pageable, sort);
  }

  generateFileContact(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'contact-integration/generate-integration-file', id);
  }

  generateFileContacts(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'contact-integration/generate-group-integration-file', ids);
  }

  processFile(integrationId: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'contact-integration/process-file/', integrationId);
  }

}
