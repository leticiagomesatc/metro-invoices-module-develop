import { SearchProvider } from "../../search-provider";
import { Injectable } from "@angular/core";
import { Observable  } from "rxjs";
import {map} from 'rxjs/operators/map';
import { HttpClient, HttpResponse } from "@angular/common/http";
import { environment } from '../../../../../environments/environment';
import { Pageable, Page, ArrayPage } from "../../../util/pageable";
import * as _ from 'lodash';
import { timeout } from "rxjs/operators";
@Injectable()
export class FwEditService {
 
  constructor(private httpClient : HttpClient) { }



  load(path: string, id : any, fields : string) : Observable<any>  {
    const config : any = {};
    if (fields) {
      config.params = {fields : fields};
    }
    return this.httpClient.get(
      environment.invoicesApi + path + '/' + id,
      config
    );
  }

  
 insert(path: string, entity: any, insertWithTimeout: boolean): Observable<any> {
  if (insertWithTimeout) {
    return this.httpClient.post(
      environment.invoicesApi + path,
      entity
    ).pipe(
      timeout(360000)
    );
  }
  return this.httpClient.post(
    environment.invoicesApi + path,
    entity
  );
}

  update(path: string, id: any, entity: any): Observable<any> {
    
    return this.httpClient.put(
        environment.invoicesApi + path  + '/' + id,
        entity
    );
  }
  
}