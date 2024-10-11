import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import {SearchProvider} from '../../shared/controllers/search-provider';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';

@Injectable()
export class BusinessLocalService extends FwSearchService {
  
   
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }

  
  search(filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('business-locals', filters, pageable, sort);
  }


}
