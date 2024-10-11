import { SearchProvider } from "../../search-provider";
import { Injectable } from "@angular/core";
import { Observable  } from "rxjs";
import {map} from 'rxjs/operators/map';
import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../../../environments/environment';
import { Pageable, Page, ArrayPage } from "../../../util/pageable";
import * as _ from 'lodash';
@Injectable()
export class FwSearchService {
 
  constructor(protected httpClient : HttpClient) { }

  search(path: string, filters: any, pageable: Pageable, sort: any): Observable<ArrayPage<any>> {
    const merged = _.merge({}, filters || {},pageable || {} || {}, sort);
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
}
