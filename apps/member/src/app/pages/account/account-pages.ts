import { Component } from '@angular/core';
import { LoginHistoryScreenComponent, ProfileScreenComponent, SessionsScreenComponent } from '@org/layout';

/** The three self-service screens of the signed-in user (spec R15, R26, R41), one tiny page each so the routes lazy-load them. */
@Component({ selector: 'app-profile-page', standalone: true, imports: [ProfileScreenComponent], template: `<lib-profile-screen />` })
export class ProfilePageComponent {}

@Component({ selector: 'app-sessions-page', standalone: true, imports: [SessionsScreenComponent], template: `<lib-sessions-screen />` })
export class SessionsPageComponent {}

@Component({ selector: 'app-login-history-page', standalone: true, imports: [LoginHistoryScreenComponent], template: `<lib-login-history-screen />` })
export class LoginHistoryPageComponent {}
