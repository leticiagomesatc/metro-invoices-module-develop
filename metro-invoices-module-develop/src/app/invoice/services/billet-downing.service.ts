import { Injectable, } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BilletDowningService {

    constructor(private httpClient : HttpClient) { }

    generateBillets(billetDowningRequest: any):Observable<any> {
        return this.httpClient.post(environment.invoicesApi + 'billet-downing/generate-billets/', billetDowningRequest);
    }
}