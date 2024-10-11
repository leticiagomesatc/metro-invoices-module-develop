import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class  TicketServiceCalc extends FwSearchService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('tickets-discount-calc', filters, pageable, sort);
  }

  getMarketSegmentFiltered(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount-calc/market-segments/active/');
  }

  getDesignationFiltered(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'tickets-discount-calc/designation/');
  }

  markAsValidGroup(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/mark-as-valid-group', ids);
  }

  markAsValid(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/mark-as-valid',  id);
  }

  markAsUnfoundedGroup(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/mark-as-unfounded-group', ids);
  }

  markAsUnfounded(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/mark-as-unfounded', id);
  }
  
  editTicket(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/edit-discount', result);
  }

  downloadDiscounts(params: any): Observable<any>{
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.post(environment.invoicesApi + 'tickets-discount-calc/generate/excel', params, {headers: headers,  responseType: 'blob'});
  }
}