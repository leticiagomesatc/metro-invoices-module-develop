
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable, Subject, of, from, empty } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { flatMap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { v4 as uuid } from 'uuid';
import { CookieService } from 'ngx-cookie-service';


@Injectable()
export class AuthService {
  
  backendSecurityCallback: string = 'login/cas';
  backendSecurityLogout: string = 'logout/cas';
  profileUrl: string = 'profile';
  userProfile: any;
  response: Observable<Response>;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cookieService: CookieService) {
    this.backendSecurityCallback = environment.backendSecurityCallback;
    this.backendSecurityLogout = environment.backendSecurityLogout;
    this.profileUrl = environment.profileLoaderUrl;
  }

  public init(route: ActivatedRoute) {

    this.userProfile = null;
    localStorage.clear();
    sessionStorage.clear();

    this.cookieService.getAll();

    return route.queryParamMap.pipe(
      
      flatMap(queryParams => {
        if (queryParams.has("start")) {
          return this.disposeAnySession().pipe(

            flatMap(()=> {
              return this.goHome();
            })
          )
        } else {
          return this.loadUser(true)
        }
      })
    ).subscribe(); 
  }

  public notifyBackend(ticket: string) {
    let headers = new HttpHeaders();
    if (!!ticket) {
      headers = headers.set('ticket', ticket);
    }
    return this.http.get(this.backendSecurityCallback+"?ticket="+ticket, {headers : headers});
  }

  public loadUser(renew=false, ticket?: string) {
    const subject = new Subject<any>();
    this.findUserProfile(renew, ticket).subscribe(
      data => {
        this.userProfile = data;
        subject.next(this.userProfile);
      }
    );
    return subject;
  }

  private findUserProfile(renew =false, ticket?: string): Observable<any> {
    let headers = new HttpHeaders();
    if (!!ticket) {
      headers = headers.set('ticket', ticket);
    }

    return this.http.get(this.profileUrl, 
      {
        headers : headers,
        params : {'tickettt': uuid()},
        withCredentials : !renew
      }
    );
  }

  public updateUserProfile(payload: any, ticket?: string): Observable<any> {
    let headers = new HttpHeaders();
    if (!!ticket) {
      headers = headers.set('ticket', ticket);
    }

    return this.http.post(this.profileUrl, payload, {headers : headers});
  }

  /**
   * @description Método responsável por retornar o login do usuario logado
   */
  public getLogin(): string {
    if (!this.userProfile) {
      return null;
    }
    return this.userProfile.login;
  }

  public requestPasswordChange() {
    var headers = new HttpHeaders();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return this.http.post(
      environment.casResendPassUrl, 
      `username=${this.getLogin()}&enviar=Enviar`,
      {headers : headers}
    );
  }

  public disposeAnySession() {
    
    this.userProfile = null;
    return this.http.post(environment.profileLoaderUrl+"/dispose",{});
  }
  public logout() {
    
    this.userProfile = null;
    return this.http.get(environment.localLogoutApi).subscribe(()=>
      window.location.assign(environment.logoutRedirectUrl)
    );
    
  
  }

  public redirectToLogin(): any {
    window.location.assign(environment.loginRedirectUrl);
  }

  public goHome() : Observable<any> {
    
    if (this.hasRole('ROLE_CLIENTE')) {
      return from(this.router.navigate(['/']));
    } else {
      window.location.assign(environment.homeUrl);
      return empty();
    }
  }


  /**
   * @description Método responsável por verificar se o usuario tem permissao
   * @param role 
   */
  public hasRole(role: string): boolean {
    if (this.isLoggedIn() && this.userProfile.roles) {
      var tem: any[] = this.userProfile.roles.filter(x => x == role);
      return (tem.length > 0);
    }

    return false;
  }

  public hasAllRoles(roles: string[]): boolean {
    let result = false;
    roles.forEach(role => !result ? result = this.hasRole(role) : undefined);
    return result;
  }

  public isLoggedIn(): boolean {
    if (this.userProfile) {
      return true;
    }

    return false;
  }

  public checkAuthorization(role: string, executeFunction: any, component: any) {
    if (!this.hasRole(role)) {
      return from(this.router.navigate(['/unauthorized']));
    } else {
      executeFunction(component)
    }
    return;
  }

}
