import { Component, OnInit } from '@angular/core';
import { AuthService } from './shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'sicop2';
  userRoles = userRoles;
  versionAndDate;

  constructor(public auth : AuthService){}

  ngOnInit(): void {
    this.versionAndDate = 'v: '.concat(environment.version).concat(' ').concat(environment.dateVersion);

  }

  goHome() {
    this.auth.goHome().subscribe();
  }

  logout() {
    this.auth.logout();
  }
  
}
