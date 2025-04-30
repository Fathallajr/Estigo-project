import { Component, AfterViewInit, Renderer2, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-g-header-not-user',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './g-header-not-user.component.html',
  styleUrl: './g-header-not-user.component.css'
})
export class GHeaderNotUserComponent implements AfterViewInit {

  searchTerm = '';

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  /** ⬇️ الدالة اللي هتودّي على الـ Roadmap الأساسي */
  goToRoadmap(): void {
    this.router.navigate(['/roadmap']);      // عدّل المسار لو مختلف
  }

  ngAfterViewInit(): void {
    /* Collapse الـ navbar بعد أي Click */
    const selectors = ['.nav-link', '.dropdown-item'];      // أضفت .dropdown-item
    selectors.forEach(sel => {
      this.el.nativeElement.querySelectorAll(sel).forEach((link: HTMLElement) => {
        this.renderer.listen(link, 'click', () => {
          const navbarCollapse = document.getElementById('navbarNav');
          if (navbarCollapse?.classList.contains('show')) {
            (document.querySelector('.navbar-toggler') as HTMLElement)?.click();
          }
        });
      });
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim();
    term && this.router.navigate(['/course-s', term]);
  }
}
