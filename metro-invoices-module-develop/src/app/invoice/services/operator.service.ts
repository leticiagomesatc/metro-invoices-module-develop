import { Injectable } from '@angular/core';

import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { Observable } from 'rxjs';

@Injectable()
export class OperatorService extends FwSearchService {
  
  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }

  findAutocompleteOperators(name: string, includeInactive: boolean): Observable<any>{
    return this.http.get(environment.invoicesApi + 'operators/autocomplete/' + name +  '/' + includeInactive)
  }

  findAutocompleteOperatorsInactive(includeInactive: boolean): Observable<any>{
    return this.http.get(environment.invoicesApi + 'operators/autocomplete/' + includeInactive);
  }

}
