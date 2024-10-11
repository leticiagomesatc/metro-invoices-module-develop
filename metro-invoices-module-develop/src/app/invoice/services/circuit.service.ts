import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { InputFile } from 'ngx-input-file';
import { Observable } from 'rxjs';
import { userRoles } from 'src/app/shared/util/user-roles';
import { environment } from 'src/environments/environment';
import { SearchProvider } from '../../shared/controllers/search-provider';


@Injectable({
  providedIn: 'root'
})
export class CircuitService {
   
  constructor(private httpClient : HttpClient) {}

  findAutocompleteCircuitInvoiceIdAndInactive(invoiceId: number, includeInactive: boolean): Observable<any>{
    return this.httpClient.get(environment.invoicesApi + `circuit/autocomplete/${invoiceId}/${includeInactive}`)
  }

  findAutocompleteCustomersInactive(includeInactive: boolean): Observable<any>{
    return this.httpClient.get(environment.invoicesApi + `circuir/autocomplete/${includeInactive}`)
  }


}