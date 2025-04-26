import { NgIf } from '@angular/common';
import { AuthService } from './../../../services/auth.service';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-what-is-estigo-section',
  imports: [RouterLink,NgIf],
  templateUrl: './what-is-estigo-section.component.html',
  styleUrl: './what-is-estigo-section.component.css'
})
export class WhatIsEstigoSectionComponent {
  role: string = JSON.parse(localStorage.getItem('userData') || '{}')?.role || 'user';

constructor(private router: Router, private AuthService: AuthService) {

  console.log(this.role)
}



navigateBasedOnAuth() {
  if (this.AuthService.isAuthenticated()) {
    this.router.navigate(['/dashboard']);
  } else {
    this.router.navigate(['/login']);
  }
}

}
