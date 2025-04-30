import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './../../../services/auth.service';

@Component({
  selector: 'app-what-is-estigo-section',
  imports: [RouterLink, NgIf],
  templateUrl: './what-is-estigo-section.component.html',
  styleUrl: './what-is-estigo-section.component.css'
})
export class WhatIsEstigoSectionComponent {
  role: string = 'user';

  constructor(
    private router: Router,
    private AuthService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('userData');
      this.role = JSON.parse(userData || '{}')?.role || 'user';
      console.log(this.role);
    }
  }

  navigateBasedOnAuth() {
    if (this.AuthService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
