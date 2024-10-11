import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatusIntegrationCustomerService {

  constructor(private httpClient: HttpClient) { }

  uploadFileStatusCustomerText(fileContent: any, nameFile: any): Observable<any> {
    return this.httpClient.post(environment.invoicesApi + 'integration-status-customer/uploadFileText',
      { file: fileContent, fileName: nameFile });
  }

}
