import {Observable} from 'rxjs';

export interface SearchProvider {


    search(filters : any, pageable : any) : Observable<any>;
}