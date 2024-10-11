import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class  StateInformationService extends FwSearchService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  search(pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('state-information', null, pageable, sort);
  }

  updateAliquots(result: any):Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'state-information/circuits', result);
  }

}