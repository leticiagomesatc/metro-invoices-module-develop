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
export class InvoiceCalcService extends FwSearchService {
   
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }
  
  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('invoice-calc', filters, pageable, sort);
  }

  getOperators(){
    return this.http.get(environment.invoicesApi + 'invoice-calc/operators/');
  }

  downloadInvoiceCalcReport(params: any): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/generate/excel-report/', params, {headers: headers,  responseType: 'blob'});
  }

  downloadInvoiceCalc(invoiceCalcId : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoice-calc/'+invoiceCalcId+'/generate/excel', {headers:headers,  responseType: 'blob' });
  }

  downloadInvoiceCalcZip(invoiceCalcIds : number[]): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.httpClient.get(environment.invoicesApi + 'invoice-calc/'+invoiceCalcIds+'/generate/zip', {headers:headers,  responseType: 'blob' });
  }

  deleteInvoicesCalc(invoiceCalcIds : number[], deleteInLot : any): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/delete-invoices-calc', {multiple: deleteInLot, ids: invoiceCalcIds});
  }

  sendBilletNoteWithEmail(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/send-email/', result);
  }

  beginBilletNoteWithEmail(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/begin-email/', result);
  }

  retrieveProgrammedCustomerForPeriod(period: any): Observable<any> {
    return this.http.get(environment.invoicesApi + 'invoice-calc/programmed-customer/' + period);
  }

  getCircuitInfo(invoiceId: number, circuitId: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + `invoice-calc/circuit-info/${circuitId}/${invoiceId}`);
  }

  generateIntegrationFile(invoiceId: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/generate-integration-file/', invoiceId);
  }

  generateGroupIntegrationFile(invoiceIds: any): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/generate-group-integration-file', invoiceIds);
  }

  getDiscountPending(result: any, period: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/discount-pending/' + period, result);
  }

  check(invoiceId: number): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'invoice-calc/check-invoice/', {invoiceId});
  }
}
