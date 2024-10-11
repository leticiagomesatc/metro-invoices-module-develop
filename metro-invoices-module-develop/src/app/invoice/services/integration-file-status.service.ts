import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IntegrationFileStatusService {

    constructor(private httpClient: HttpClient) { }
    
    uploadFileStatus(file: File): Observable<any> {      
        const data: FormData = new FormData();
        data.append('file', file);
        
        return this.httpClient.post(environment.invoicesApi + 'integration-status/upload', data);
    }

    uploadFileStatusText(fileContent: any, nameFile: any): Observable<any> {           
        console.log(fileContent);
        console.log(nameFile);
        return this.httpClient.post(environment.invoicesApi + 'integration-status/uploadFileText', {file: fileContent, fileName: nameFile});
    }
    uploadFileStatusHeaders(file: File): Observable<any> {      
        const data: FormData = new FormData();
        data.append('file', file);
        let headers = new HttpHeaders();
        headers = headers.append('Accept','text/csv; charset=utf-8');
        return this.httpClient.post(environment.invoicesApi + 'integration-status/upload', data, {
            headers: headers,
            observe: 'response',
            responseType: 'text'
        });
    }

}