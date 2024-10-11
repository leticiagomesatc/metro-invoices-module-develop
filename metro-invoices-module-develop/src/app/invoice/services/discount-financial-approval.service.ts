import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class   DiscountFinancialApprovalService extends FwSearchService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('discount-finan-apprv', filters, pageable, sort);
  }

  getMarketSegmentFiltered(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'discount-finan-apprv/market-segments/active/');
  }

  getDesignationFiltered(): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'discount-finan-apprv/designation/');
  }

  approveDiscountsGroup(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'discount-finan-apprv/approve-discounts-group', ids);
  }

  approveDiscount(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'discount-finan-apprv/approve-discount', id);
  }

  disapproveDiscountsGroup(ids: number[]): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'discount-finan-apprv/disapprove-discounts-group', ids);
  }

  disapproveDiscount(id: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'discount-finan-apprv/disapprove-discount', id);
  }

  downloadDiscounts(params: any): Observable<any>{
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.post(environment.invoicesApi + 'discount-finan-apprv/generate/excel', params, {headers: headers,  responseType: 'blob'});
  }
}