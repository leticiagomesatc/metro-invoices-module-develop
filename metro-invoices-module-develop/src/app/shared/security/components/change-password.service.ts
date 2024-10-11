import { Inject, Injectable } from "@angular/core";
import { AuthService } from '../auth/auth.service';

import { ChangePasswordComponent } from './change-password.component';

@Injectable()
export class ChangePasswordService {

    constructor(private auth: AuthService) { }

    public canChangePassword() {
        return !!this.auth.userProfile
            && this.auth.userProfile.username.indexOf('@') >= 0;
    }

    public changePassword() {
        // return this.modalService.open(ChangePasswordComponent, { size: 'sm',  backdrop : 'static' });
        return null;
    }

}