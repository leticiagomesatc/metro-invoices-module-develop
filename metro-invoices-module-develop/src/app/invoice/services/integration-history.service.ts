import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IntegrationHistoryService {

    constructor(private httpClient: HttpClient) { }

    getFileAutoComplete(type: string): Observable<any> {
        return type && type.length > 0 ?
            this.httpClient.get(environment.invoicesApi + `integration-history/filename-autocomplete/${type}`) :
            this.httpClient.get(environment.invoicesApi + 'integration-history/filename-autocomplete');
    }

    downloadFile(fileHash : number): Observable<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/octet-stream'
        };
        return this.httpClient.get(environment.invoicesApi + 'integration-history/download-file/' + fileHash, { headers: headers, responseType: 'blob' });
    }

    processFile(integrationId : number): Observable<any> {
        return this.httpClient.post(environment.invoicesApi + 'integration-history/process-file/', integrationId);
    }

}
