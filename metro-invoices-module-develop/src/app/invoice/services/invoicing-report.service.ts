import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { SearchProvider } from '../../shared/controllers/search-provider';
import { InputFile } from 'ngx-input-file';

@Injectable({
    providedIn: 'root'
})
export class InvoicingReportService {

    constructor(private httpClient: HttpClient) { }

    retrieveStates():Observable<any> {
        return this.httpClient.get(environment.invoicesApi + 'invoicing-report/states/');
    }

    retrieveMarketSegments():Observable<any>{
        return this.httpClient.get(environment.invoicesApi + 'invoicing-report/market-segments/');
    }

    export(filters: any): Observable<any> {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream'
    };
    return this.httpClient.get(environment.invoicesApi + 'invoicing-report/export', { headers:headers, responseType: 'blob', params: filters});
    }

    generateDuplicateBillet(result: any, serialNumber: number): Observable<any> {
        result.serialNumber = serialNumber;
        return this.httpClient.post(environment.invoicesApi + 'invoices/generate-duplicate-billet', result);
    }

    getCustomerByInvoice(invoiceId: number) {
        return this.httpClient.get(environment.invoicesApi + 'invoices/customer/' + invoiceId);
    }

    validateNoteOutOfCompetence(noteId: number) {
        return this.httpClient.get(environment.invoicesApi + 'invoices/notes/out-of-competence/' + noteId);
    }

    public cancelInvoiceNote(id: number, justificationId: number, files: InputFile[]): Observable<any> {

        const formData: FormData = new FormData();
        files.forEach(file => { formData.append('file', file.file, file.file.name) })
        formData.append('id', id.toString());
        formData.append('justificationId', justificationId.toString());

        return this.httpClient.post(environment.invoicesApi + 'invoices/notes/cancel-invoice-note', formData);
    }

    downloadCancelledNotes(noteNumber: number): Observable<any> {
        const headers = new HttpHeaders();
        headers.append('Accept', 'application/octet-stream');
        headers.append('Content-Type', 'application/json');
        return this.httpClient.get(environment.invoicesApi + 'invoices/notes/' + noteNumber + '/zip-cancelled-files', { headers: headers, responseType: 'blob' });
    }

}
