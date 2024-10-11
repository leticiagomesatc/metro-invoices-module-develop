import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class  TicketService extends FwSearchService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('tickets-discount', filters, pageable, sort);
  }

  retrieveIdSicop(idNv3: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount/idSicop/' + idNv3);
  }

  getMarketSegmentFiltered(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount/market-segments/active/');
  }

  getDesignationFilteredNv3(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount/designation/nv3');
  }

  getDesignationFilteredSicop(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount/designation/sicop');
  }

  reprocessDiscounts(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/reprocess-discounts-group', ids);
  }

  reprocessDiscount(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/reprocess-discount', id);
  }

  despiseDiscounts(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/despise-discounts-group', ids);
  }

  despiseDiscount(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/despise-discount', id);
  }
  
  editTicket(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/edit-discount', result);
  }

  downloadDiscounts(params: any): Observable<any>{
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount/generate/excel', params, {headers: headers,  responseType: 'blob'});
  }
}