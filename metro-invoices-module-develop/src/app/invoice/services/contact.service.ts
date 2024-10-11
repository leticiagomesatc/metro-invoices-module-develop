import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import * as _ from 'lodash';
import {SearchProvider} from '../../shared/controllers/search-provider';

@Injectable({
  providedIn: 'root'
})
export class ContactService implements SearchProvider {

  constructor(private httpClient : HttpClient) {
  }

  search(filters: any, pageable: any): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'invoices');
  }

  getContactsEmail(method: string, id: number): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'contact/'+method+'/'+id, { headers: { 'Content-Type': 'application/json' }});
  }

  getContactsEmailFromInvoices(method: string, ids: number[]): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'contact/' + method + '/' + ids, { headers: { 'Content-Type': 'application/json' } });
  }

  getContactsType(method: string): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + 'contact/' + method, { headers: { 'Content-Type': 'application/json' } });
  }

}
