import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, NgZone, ChangeDetectorRef } from '@angular/core';

import { MessageService } from 'src/app/shared/communication/message.service';


import * as _ from 'lodash';
import { AuthService } from '../auth/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {


    form: FormGroup;

    constructor(
        private auth: AuthService,
        private messageService: MessageService,
        
        private builder: FormBuilder) {
        this.form = builder.group({
            cp: [null, Validators.required],
            np: [null, Validators.compose([

                Validators.required,
                
                Validators.minLength(8),
                Validators.maxLength(16),
                Validators.pattern(/\d/),  // 2. check whether the entered password has a number
                // 3. check whether the entered password has upper case letter
                Validators.pattern(/[A-Z]/),
                // 4. check whether the entered password has a lower-case letter
                Validators.pattern(/[a-z]/),
                // 5. check whether the entered password has a special character
                Validators.pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")),
                // 6. Has a minimum length of 8 characters
                
             ])
            ],
            npc: [null, Validators.required]
        });
    }



    public cancel() {
         
    }

    public confirm() {

                   
        
        if (!_.isEqual(this.form.value.np, this.form.value.npc)) {
            this.messageService.error('AT-E003');
            return;
        }
        if (this.form.invalid) { 

            if (this.form.controls['np'].invalid) {

                if (this.form.controls['np'].errors.maxlength) {
                    this.messageService.error('AT-E007');
                    return;    
                }

                if (this.form.controls['np'].errors.minlength) {
                    this.messageService.error('AT-E007');
                    return;    
                }
                if (this.form.controls['np'].errors.pattern) {
                    this.messageService.error('AT-E007');
                    return;    
                }
                
            }

            this.messageService.error('AT-E002');
            return;
        }

        this.auth.updateUserProfile(this.form.value)
            .subscribe(() => {
                this.messageService.success('AT-S001');
                
            },
            (resp)=>{
                if (!!resp.error.code) {
                    this.messageService.error(resp.error.code);
                } else {
                    this.messageService.error('AT-E001');
                }
            });

    }
}


/*
 
      ],

*/