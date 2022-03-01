/* eslint-disable no-trailing-spaces */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService, Message } from '../services/data.service';
import { HTMLDomUtils } from '../utils/html-dom-utils';

@Component({
    selector: 'app-signed-in',
    templateUrl: 'signed-in.page.html'
})
export class SignedInPage implements OnInit {
    
    sub: any;
    userName: string;

    constructor(
        private data: DataService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        this.authService.completeAuthentication();
        this.sub = this.authService.userHandler
            .subscribe(user => {
                if (user) {
                    const tenantGid = user.profile['urn:westwoodforster:tenantgid'];
                    HTMLDomUtils.localStorageSetItem('wfgm.tenantgid', tenantGid);
                    this.router.navigate(['/home/list']);
                    this.userName = this.authService.displayName;
                }
            });
    }

    refresh(ev) {
        setTimeout(() => {
            ev.detail.complete();
        }, 3000);
    }

    getMessages(): Message[] {
        return this.data.getMessages();
    }

}
