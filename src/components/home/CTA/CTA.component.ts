import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // CommonModule for *ngIf, isPlatformBrowser
import { RouterModule } from '@angular/router'; // RouterModule for [routerLink]

@Component({
  selector: 'app-class-management-section',
  standalone: true, // Made component standalone
  imports: [CommonModule, RouterModule], // Imported necessary modules for standalone
  templateUrl: './CTA.component.html', // Corrected path assuming component file name is CTA.component.html
  styleUrl: './CTA.component.css'     // Corrected path assuming component file name is CTA.component.css
})
export class ClassManagementSectionComponent implements OnInit {
  isAuthenticated: boolean = false;
  buttonText: string = '';
  buttonLink: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Access localStorage only on the browser side
      this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    }

    if (this.isAuthenticated) {
      this.buttonText = 'Go to Dashboard';
      this.buttonLink = '/dashboard';
    } else {
      this.buttonText = 'Start Your Success';
      this.buttonLink = '/login';
    }
  }
}