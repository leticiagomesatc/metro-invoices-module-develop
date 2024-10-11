import { SearchProvider } from "../../search-provider";
import { Injectable } from "@angular/core";
import { Observable  } from "rxjs";
import {map} from 'rxjs/operators/map';
import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../../../environments/environment';
import { Pageable, Page, ArrayPage } from "../../../util/pageable";
import * as _ from 'lodash';
@Injectable()
export class FwSearchHistoryService {
 
  constructor(private httpClient : HttpClient) { }

  search(path: string, filters: any, pageable: Pageable): Observable<ArrayPage<any>> {
    const merged = _.merge({},filters || {},pageable || {});
    return this.httpClient.get(
        environment.invoicesApi + path, 
        {params : merged}
    )
    .pipe(
        map(page => page as ArrayPage<any>)
    );
  }

  removeAfterSearch(path: string, id : any) : Observable<void> {
    return this.httpClient.delete(environment.invoicesApi + path + '/' +id)
      .pipe(map(()=>{return;}))
  }

  getInvoiceNoteInfo(path:string, params: any, pageable: any): Observable<any> {
    return this.httpClient.get(environment.invoicesApi + path + params );
  }
  
  export(filters: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'billing-history/export', { headers:headers, responseType: 'blob', params: filters});
  }
}