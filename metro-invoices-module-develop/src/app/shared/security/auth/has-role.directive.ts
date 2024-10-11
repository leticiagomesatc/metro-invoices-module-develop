import { AuthService } from './auth.service';
import { ViewContainerRef } from '@angular/core';
import { TemplateRef } from '@angular/core';
import { Input } from '@angular/core';
import { Directive } from '@angular/core';

@Directive({
  selector: '[hasRole]'
})
export class HasRoleDirective {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService:AuthService) { }
  
  @Input() set hasRole(r:any){
    if (this.authService.hasRole(r)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[hideHasRole]'
})
export class HideHasRoleDirective {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService:AuthService) { }
  
  @Input() set hideHasRole(r:any){
    if (this.authService.hasRole(r)) {
      this.viewContainer.clear();
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
