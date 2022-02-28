/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/member-ordering */
import { Router } from '@angular/router';
import { Injectable, EventEmitter } from '@angular/core';

import { of as observableOf, from as observableFrom, BehaviorSubject, Subject, Observable } from 'rxjs';
import { UserManager, UserManagerSettings, User } from 'oidc-client';

import { environment } from '../../environments/environment';
import { TenantUtils } from '../utils/tenant-utils';
import { HTMLDomUtils } from '../utils/html-dom-utils';

@Injectable()
export class AuthService {

  private userSource = new BehaviorSubject<User>(null);

  userHandler = this.userSource.asObservable();

  //Alex's attempt to use BehaviourSubject.
  private _userLoggedInSource = new BehaviorSubject<boolean>(false);
  private _roleGidSource = new BehaviorSubject<string>(null);
  private _roleGidListSource = new BehaviorSubject<string[]>(null);

  userLoggedIn$ = this._userLoggedInSource.asObservable();

  manager: UserManager;

  _currentUser: User;
  displayName: string;
  availableTenantGids: string[];

  get currentUserProfile(): any {
    if (this.currentUser) {
      return this.currentUser.profile;
    }
    return null;
  }

  get currentTenantGid(): string {
    let tenantGid = '';
    if (this.currentUserProfile) {
      try {
        tenantGid = this.currentUserProfile['urn:westwoodforster:tenantgid'];
        if (tenantGid && tenantGid != '') {
          tenantGid = tenantGid.toLocaleLowerCase();
          return tenantGid;
        }
      } catch (error) {
        console.log('Get current tenant gid: ', error);
      }
    }

    tenantGid = HTMLDomUtils.localStorageGetItem('wfgm.tenantgid');
    if (!tenantGid || tenantGid == '') {
      tenantGid = HTMLDomUtils.tenantGid;
    }
    return tenantGid;
  }

  get currentTenantId(): number {
    let tenantId = 0;
    if (this.currentUserProfile) {
      try {
        tenantId = this.currentUserProfile['urn:westwoodforster:tenantid'];
      } catch (error) {
        console.log('Get current tenant id: ', error);
      }
      return tenantId;
    }
  }

  get currentStakeholderGid(): string {
    let stakeholderGid = '';
    if (this.currentUserProfile) {
      try {
        stakeholderGid = this.currentUserProfile['urn:westwoodforster:stakeholderid'];
      } catch (error) {
        console.log('Get current stakeholder gid: ', error);
      }
    }
    return stakeholderGid;
  }

  get currentUserGid(): string {
    let userGid = '';
    if (this.currentUserProfile) {
      try {
        userGid = this.currentUserProfile.sub;
      } catch (error) {
        console.log('Get current user gid: ', error);
      }
    }
    return userGid;
  }

  get currentRequiredRedirectUrl(): string {
    let requiredRedirectUrl = '';
    if (this.currentUserProfile) {
      try {
        requiredRedirectUrl = this.currentUserProfile['urn:westwoodforster:requiredredirecturl'];
      } catch (error) {
        console.log('Get current redirect url: ', error);
      }
    }
    return requiredRedirectUrl;
  }

  get currentUser(): User {
    return this._currentUser;
  }
  set currentUser(user: User) {
    if (this._currentUser != user) {
      this._currentUser = user;
      this.displayName = this.getUserName();
      this.setAvailableUserTenantList();
      this.userSource.next(this._currentUser);
      this._userLoggedInSource.next(this.isLoggedIn());

      // we have a user, check local storage and check if re-direct needed
      if (this._currentUser) {
        let urlCallback = HTMLDomUtils.sessionStorageGetItem('urlcallback');
        if (urlCallback) {
          urlCallback = urlCallback.replace(environment.appBaseUrl, '');
          urlCallback = (!urlCallback.startsWith('/') ? '/' : '') + urlCallback;
          HTMLDomUtils.sessionStorageRemoveItem('urlcallback');
          this.router.navigate([urlCallback]);
        }
      }
    }
  }

  get currentUserRole(): any {
    let role: any;
    if (this.currentUserProfile) {
      try {
        role = this.currentUserProfile.role;
      } catch (error) {
        console.log('Get current user role: ', error);
      }
    }
    return role;
  }

  get externalUser(): boolean {
    try {

      if (this.isLoggedIn) {
        const role = this.currentUserRole;
        if (role && typeof role == 'string' && role.toUpperCase() == '1CA0990B-80D1-4AB8-93A1-F291A57386AF') {
          return true;
        }
      }
    } catch (error) {
      console.log('Get external user flag: ', error);
    }
    return false;
  }

  get internalUser(): boolean {
    try {
      if (this.isLoggedIn) {
        return !this.externalUser;
      }
    } catch (error) {
      console.log('Get internal user flag: ', error);
    }
    return false;
  }

  get tenantAdmin(): boolean {
    try {
      if (this.currentUserProfile) {
        const profVal = this.currentUserProfile['urn:westwoodforster:tadmin'];
        if (profVal && profVal.toLocaleLowerCase() == 'true') {
          return true;
        }
      }
    } catch (error) {
      console.log('Get tenant admin flag: ', error);
    }
    return false;
  }

  get publishingTenant(): boolean {
    try {
      if (this.currentUserProfile) {
        const profVal = this.currentUserProfile['urn:westwoodforster:publishingtenant'];
        if (profVal && profVal.toLocaleLowerCase() == 'true') {
          return true;
        }
      }
    } catch (error) {
      console.log('Get tenant publishingTenant flag: ', error);
    }
    return false;
  }


  get wfAdmin(): boolean {
    try {
      if (this.currentUserProfile) {
        const profVal = this.currentUserProfile['urn:westwoodforster:wfadmin'];
        if (profVal && profVal.toLocaleLowerCase() == 'true') {
          return true;
        }
      }
    } catch (error) {
      console.log('Get wf admin flag: ', error);
    }
    return false;
  }

  constructor(
    private router: Router) {

    if (HTMLDomUtils.sessionStorageEnabled) {
      this.manager = new UserManager(getClientSettings(true));
      this.manager.getUser()
        .then(user => {
          if (user) {
            this.currentUser = user;
          }
        });

      this.manager.events.addUserLoaded(user => {
        const newUser: boolean = (this.currentUser != null);
        this.currentUser = user;
        if (!newUser) {
          if (!environment.production) {
            // console.log("user", user);
          }

          const tenantGid = this.currentTenantGid;
          if (tenantGid && tenantGid !== '') {
            TenantUtils.updateTenant(tenantGid, false);
          }

          if (user) {
            if (this.validateUserProfiles(user)) {
              let redirectUrl = this.currentRequiredRedirectUrl;
              if (redirectUrl && redirectUrl != '') {
                redirectUrl = redirectUrl.replace(environment.appBaseUrl, '');
                redirectUrl = (!redirectUrl.startsWith('/') ? '/' : '') + redirectUrl;
                this.router.navigate([redirectUrl]);
              }
              else {
                this.router.navigate(['/']);
              }
            }
            else {
              this.router.navigate(['/error'], { queryParams: { error: 'Invalid Tenant or User details.' } });
            }
          }
        }
      });

      this.manager.events.addSilentRenewError(e => {
        this.manager.removeUser();
        this.currentUser = null;
        const dateTime = new Date();
        console.log('SilentRenewError ' + dateTime.toTimeString());
        console.log(e);
        this.router.navigate(['/home']);
      });

      this.manager.events.addAccessTokenExpiring(e => {
        console.log('AccessTokenExpiring');
        this.performSilentRenew();
      });

    }
    else {
      console.log('%c Cookies are NOT enabled!', 'background: #ff0000 ; color: #ffffff'
      );
    }
  }

  validateUserProfiles(user: User): boolean {
    if (this.currentStakeholderGid && this.currentStakeholderGid != '' && this.currentTenantId > 0)
      {return true;}

    return false;
  }

  clearState() {
    if (this.manager) {
      this.manager
        .clearStaleState()
        .then(resp => {
          // if (callLogin)
          //   this.successCallback();
        })
        .catch(function(e) {
          console.log('clearStateState error', e.message);
        });
    }
  }

  updateUserRoleObs(roleGid?: string) {
    this._roleGidSource.next(roleGid);
  }

  updateUserRoleListObs(roleGids?: string[]) {
    this._roleGidListSource.next(roleGids);
  }

  endSigninMainWindow() {
    this.manager
      .signinRedirectCallback()
      .then(function(user) {
        //console.log("signed in", user);
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  endSignoutMainWindow() {
    this.manager
      .signoutRedirectCallback()
      .then(function(resp) {
        this.currentUser = null;
        // console.log("signed out", resp);
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  getAccessToken(): string {
    return this.currentUser ? this.currentUser.access_token : '';
  }

  startSignoutMainWindow() {

    //
    //  This code change does the automatic sign out on IS and resdirects back to GM
    //  https://github.com/jmurphzyo/Angular2OidcClient/blob/master/src/app/shared/services/auth.service.ts
    //
    this.manager.getUser().then(user => {
      this.manager.signoutRedirect({ id_token_hint: user.id_token })
        .then(resp => {
          // if (callLogin)
          //   this.successCallback();
        }).catch(function(err) {
          console.log(err);
        });
    }
    );

    //this.manager.signoutRedirect();
    this.manager.removeUser()
      .then(resp => {
        // if (callLogin)
        //   this.successCallback();
      });
  }

  getUserName(): string {
    let name = '';
    if (this.currentUserProfile) {
      try {
        name = this.currentUserProfile.displayname;
      } catch (error) {
        console.log('Get user name error: ', error);
      }
    }

    return name;
  }

  setAvailableUserTenantList(): void {
    this.availableTenantGids = null;

    if (this.currentUserProfile) {
      try {
        this.availableTenantGids = this.currentUserProfile['urn:westwoodforster:availabletenantid'];
      } catch (error) {
        console.log('Get available user tenant list: ', error);
      }
    }
  }

  isLoggedIn(): boolean {
    return this.currentUser != null && !this.currentUser.expired;
  }

  silentRefreshRequired(): boolean {
    return this.currentUser != null && this.currentUser.expired;
  }

  startAuthentication(): Promise<void> {
    if (HTMLDomUtils.sessionStorageEnabled) {
      this.manager = new UserManager(getClientSettings(true));
      return this.manager.signinRedirect();
    }
    else {
      //  user needs to enable web browser cookies
      this.router.navigate(['/error'], {
        queryParams: { error: `Your browser was unable to access the site.\n If this problem persists, 
                  please ensure that cookies are enabled or contact support.`
                }
      });
      return;
    }
  }

  startAuthenticationHref(url): Promise<void> {
    this.manager = new UserManager(getClientSettings(true));
    const l = HTMLDomUtils.sessionStorageGetItem('urlcallback');
    if (!l) {HTMLDomUtils.sessionStorageSetItem('urlcallback', url);}
    return this.manager.signinRedirect();
  }

  performSilentRenew(): Subject<any> {
    const silentRenewResult$ = new Subject<any>();
    this.renewToken()
      .then(user => {
        console.log('Silent Renew Success');
        this.currentUser = user;
        silentRenewResult$.next(user);
      })
      .catch(err => {
        console.log(err);
        this.manager.removeUser();
        this.currentUser = null;
        silentRenewResult$.next(false);
        this.router.navigate(['/home']);
      }
      );
    return silentRenewResult$;
  }

  public renewToken(): Promise<User> {
    //this.manager = new UserManager(getClientSettings(false));
    return this.manager.signinSilent();
  }

  completeAuthentication(): Promise<void> {
    return this.manager.signinRedirectCallback().then(user => {
      this.currentUser = user;
    });
  }

  getClaims(): any {
    return this.currentUserProfile;
  }

  getAuthorizationHeaderValue(): string {
    return `${this.currentUser.token_type} ${this.currentUser.access_token}`;
  }

  setPostLoginRedirectSettings(tenantGid: string, redirectUrl: string, roleRegistrationGid: string): void {
    TenantUtils.updateTenant(tenantGid, false);
    HTMLDomUtils.localStorageSetItem('wfgm-redirecturl', redirectUrl);
    HTMLDomUtils.localStorageSetItem('wfgm-registrationGid', roleRegistrationGid);
  }
}

export function getClientSettings(includeMaxAge: boolean): UserManagerSettings {

  let tenantGid = HTMLDomUtils.localStorageGetItem('wfgm.tenantgid');
  if (!tenantGid) {
    tenantGid = HTMLDomUtils.tenantGid;
  }

  const redirecturl = HTMLDomUtils.localStorageGetItem('wfgm-redirecturl');
  const registrationGid = HTMLDomUtils.localStorageGetItem('wfgm-registrationGid');

  //  Use redirecturl and registrationGid only once, so clear them out once read

  HTMLDomUtils.localStorageRemoveItem('wfgm-redirecturl');
  HTMLDomUtils.localStorageRemoveItem('wfgm-registrationGid');

  let acr_values = (tenantGid || redirecturl) ? 'tenant:' + tenantGid + '|' + redirecturl : '';

  if (acr_values && registrationGid) {
    acr_values = acr_values + '|' + registrationGid;
  }

  return {
    authority: environment.authority, //"https://localhost:44346/", //
    client_id: 'giftedmatrixfe',
    redirect_uri: environment.appBaseUrl + 'auth',
    post_logout_redirect_uri: environment.appBaseUrl,
    response_type: 'code',
    scope:
      'openid grantapi hubapi userdetails wfadaptorapi stakeholderserviceapi matrixuiapi communicationserviceapi financialserviceapi identityserviceapi',
    filterProtocolClaims: true,
    loadUserInfo: true,
    // automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    accessTokenExpiringNotificationTime: 600, //3540 for testing = 59 minutes prior to 1 hour token expiring,
    silent_redirect_uri: environment.appBaseUrl + 'assets/silent-renew.html',
    acr_values,
    max_age: (includeMaxAge) ? 18000 : 0 //5 hours (Specifies the allowable elapsed time in seconds since the last time the End-User was actively authenticated by the OP)
  };
}
