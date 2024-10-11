import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './shared/navigation/home/home.component';
import { InvoiceModuleRoutingModule } from './invoice/invoice-routing.module';
import { AuthGuard } from './shared/security/guards/auth.guard';

const routes: Routes = [

  {
    path: '', component: HomeComponent, canActivate: [AuthGuard],
    canLoad: [AuthGuard] 
  },
  {
    path: '**', redirectTo: '/' 
  }

];

@NgModule({
  imports: [
    InvoiceModuleRoutingModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
