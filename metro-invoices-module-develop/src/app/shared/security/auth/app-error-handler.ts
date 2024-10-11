
import 'rxjs/add/observable/throw'
import { Observable } from 'rxjs';

export class ErrorHandler {
  static handleError(error: any){
    debugger
      let errorMessage: string
      if (error instanceof Response){
        const body = error.json() || '';
        const err = JSON.stringify(body);
        
        let url =`${error.url}`.split('sicop')[0];
        let status =`${error.status}`;
        debugger
        if(status == '404'){
            window.location.assign('https://est06001587:9243/orion/');
        }

        errorMessage = `${error.url}: ${error.status} - ${error.statusText || ''} ${err}`;
      }else{
        errorMessage = error.message ? error.message : error.toString()
      }
      return Observable.throw(errorMessage)
    }
  }