import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import {SearchProvider} from '../../shared/controllers/search-provider';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';

@Injectable()
export class CustomerService extends FwSearchService {
  
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }
  
  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('customers', filters, pageable, sort);
  }

  findNoteIssuance(issuanceNote: string, viewMonth, viewYear):Observable<any> {
    return this.http.get(environment.invoicesApi + 'customers/issuance/' + issuanceNote + '/month/' + (viewMonth + 1) + '/year/' + viewYear);
  }

  getCustomerBySapCodeAndName(sapCode: string, name: string){
    return this.http.get(environment.invoicesApi + 'customers/' + sapCode + '/name/' + name);
  }

  findAutocompleteCustomers(name: string, idNetworkOperator: number, includeInactive: boolean){
    return this.http.get(environment.invoicesApi + 'customers/autocomplete/' + name + '/' + idNetworkOperator + '/' + includeInactive)
  }

  findAutocompleteCustomersIdOperatorAndInactive(idNetworkOperator: number, includeInactive: boolean): Observable<any>{
    return this.http.get(environment.invoicesApi + 'customers/autocomplete/' + idNetworkOperator + '/' + includeInactive)
  }

  findAutocompleteCustomersInactive(includeInactive: boolean): Observable<any>{
    return this.http.get(environment.invoicesApi + 'customers/autocomplete/' + includeInactive)
  }

  findAutocompleteCustomersIdOperatorListAndInactive(idNetworkOperatorList: Array<number>): Observable<any>{
    return this.http.get(environment.invoicesApi + 'customers/autocomplete/withoperator/' + idNetworkOperatorList)
  }

}
