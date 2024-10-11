
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, Route, CanLoad } from '@angular/router';

import { AuthService } from './../auth/auth.service';
import { Observable, Subject } from 'rxjs';


@Injectable()
export class AuthGuard implements CanActivate, CanLoad {


  constructor(
    private authService: AuthService) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.authService.isLoggedIn()) {
      if (!route.data || !route.data.hasRole || this.authService.hasRole(route.data['hasRole'])) {
        return true;
      }
      return true;
    }else{
      // if (this.authService.userProfile === null) {
        const subject = new Subject<any>();
        this.authService.loadUser().subscribe(
          dado => {
            if(dado == undefined){
              this.authService.redirectToLogin();
            } else {
              if (!route.data || !route.data.hasRole || this.authService.hasRole(route.data['hasRole'])) {
                return subject.next(true);
              } else {
                return subject.next(false);
              }
            }
            
          }
        );
        return subject;
      // } else {
        // return false;
      // }
      
    }
    
  }

  canLoad(route: Route): Observable<boolean>|Promise<boolean>|boolean {
    
    if (!route.data || !route.data.hasRole || this.authService.hasRole(route.data['hasRole'])) {
      return true;
    }
    return true;
  }

}
