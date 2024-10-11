import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatusIntegrationContactService {

  constructor(private httpClient: HttpClient) { }

  uploadFileStatusContactText(fileContent: any, nameFile: any): Observable<any> {
    console.log(fileContent);
    console.log(nameFile);
    return this.httpClient.post(environment.invoicesApi + 'integration-status-contact/uploadFileText',
      { file: fileContent, fileName: nameFile });
  }

}
