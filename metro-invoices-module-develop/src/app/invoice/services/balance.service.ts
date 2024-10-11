import { Injectable, } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArrayPage } from 'src/app/shared/util/pageable';
import { FwSearchService } from 'src/app/shared/controllers/fw/fw-search/fw-search.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BalanceService extends FwSearchService {

  constructor(httpClient : HttpClient, private http: HttpClient) { 
    super(httpClient);
  }
  
  searchPendingAndInNeedOfBalanceBillets(params: any): Observable<any> {
    return this.http.get(environment.invoicesApi + 'balances/list/', { params });
  }

  confirmPendingBalance(params: any): Observable<any> {
    return this.http.get(environment.invoicesApi + 'balances/confirm/', { params });
  }
  
  
  search(path:string, filters: any, pageable: any, sort: any): Observable<ArrayPage<any>> {
    return super.search('balances/list', filters, undefined, sort);
  }

  downloadFile(params : any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream'
    };
    return this.http.get(environment.invoicesApi + 'balances/file', {params: params, headers:headers, responseType: 'blob' });
  }

  downloadBillet(billetId : number): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'application/octet-stream');
    headers.append('Content-Type', 'application/json');
    return this.http.get(environment.invoicesApi + 'balances/download-billet/'+billetId, {headers:headers,  responseType: 'blob' });
  }

  sendBilletToEmailList(result: any): Observable<any> {
    return this.http.post(environment.invoicesApi + 'balances/emails/billet/', result);
  }

  checkLastBilletHasFineOrInterest(noteNumer : number, noteType : string) {
    return this.http.get(environment.invoicesApi + 'balances/check-fine-interest/' + noteNumer + '/' + noteType);
  }
}

