
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../security/auth/auth.service';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  usuario: any;
  constructor(public auth: AuthService) { 
  }
  ngOnInit() {
     
  }
}
