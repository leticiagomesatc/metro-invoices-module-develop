import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient) {
  }

  generateReportBaseOs(filters: any): Observable<any> {
    return this.http.post(environment.invoicesApi + 'export-report/base-os/', filters);
  }

}
