import { Component, ViewChild } from '@angular/core';
import { FwEditService } from 'src/app/shared/controllers/fw/fw-edit/fw-edit.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

@Component({
  selector: 'app-dunning-list',
  templateUrl: './dunning-list.component.html',
  styleUrls: ['./dunning-list.component.scss'],
})
export class DunningList {

  cols = [
    { title: 'Régua de Cobrança', prop: 'name' },
    { title: 'Situação', prop: 'active', converter: inactiveConv},
  ];

  actions = [
    {
      action: 'actions',
      subActions: [
        {
          title: 'Editar', 
          action: 'edit', 
          command: {
            name : 'routeWithId',
            params: {
              route : '/dunning/'
            }
          },
          role: userRoles.dunningEdit,
          icon: { name: 'edit' }
        }
      ]
    }
  ];

  requiredRolesToView: string = userRoles.dunningView;
  userRoles = userRoles;
  
  @ViewChild('search') search: any;

  constructor(
    private editService: FwEditService,
    public authService: AuthService) {}

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, this.initComponent, this);
  }

  private initComponent(_this: any) {
    _this.search.filters.active = true;
  }

  isDevMode() {
    return false;
  }

  onSearch() {
    if (this.search.filters.customer) {
      this.search.filters.customerId = this.search.filters.customer.id;
      delete this.search.filters.customer;
    }
    if (this.search.filters.dunning) {
      this.search.filters.dunningId = this.search.filters.dunning.id;
      delete this.search.filters.dunning;
    }
  }

  execute(event : any) {
  }

}

function inactiveConv(params: boolean) {
  if (params === false) {
    return 'Inativa';
  } else if (params === true) {
    return 'Ativa';
  } else {
    return '?'
  }

}
