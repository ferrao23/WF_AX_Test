import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DataService, Message } from '../services/data.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(
    private data: DataService,
    private authService: AuthService
  ) {}

  refresh(ev) {
    setTimeout(() => {
      ev.detail.complete();
    }, 3000);
  }

  getMessages(): Message[] {
    return this.data.getMessages();
  }

  signIn(event): void {
    event.preventDefault();
    this.authService.startAuthentication();
    console.log("signing in...")
  }

}
