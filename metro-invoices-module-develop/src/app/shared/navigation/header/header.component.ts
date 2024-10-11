import {AuthService} from '../../security/auth/auth.service'
import { Component, OnInit, EventEmitter } from '@angular/core';
 
import * as $ from 'jquery';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styles: ['.modal { width: 75% !important;']
})
export class HeaderComponent implements OnInit {
  
  
  perfisUsuario: any[] = [];
  portalOrion: String;
  sair: String;
  opened = false;

  constructor(public auth: AuthService) { 
  }
  
  

  ngOnInit() {
  
    this.abrirOrion();
    this.fazerLogout();
  }

  openModal(){
    
  }

  closeModal(){
    
  }

  abrirOrion(){
    
  }

  fazerLogout(){
    
  }

}
