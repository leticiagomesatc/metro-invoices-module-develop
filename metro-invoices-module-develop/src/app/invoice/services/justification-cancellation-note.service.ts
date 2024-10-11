import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { Subject, Observable } from 'rxjs';
import * as _ from 'lodash';

@Injectable({
    providedIn: 'root'
  })
export class JustificationCancellationNoteService {
  
    constructor(httpClient : HttpClient, private http: HttpClient) { 
    }

    getAllJustifications(): Observable<any>{
        return this.http.get(environment.invoicesApi + 'note-cancellation/justifications');
    }

}
