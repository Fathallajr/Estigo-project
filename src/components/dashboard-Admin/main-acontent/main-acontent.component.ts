import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-main-acontent',
  imports: [],
  templateUrl: './main-acontent.component.html',
  styleUrl: './main-acontent.component.css'
})
export class MainAcontentComponent {
  @Output() navigateToCourses = new EventEmitter<void>();
  @Output() navigateToLessons = new EventEmitter<void>();
  @Output() navigateToQuizzes = new EventEmitter<void>();

  onUploadCoursesClick() {
    this.navigateToCourses.emit();
  }

  onUploadLessonsClick() {
    this.navigateToLessons.emit();
  }

  onUploadQuizzesClick() {
    this.navigateToQuizzes.emit();
  }
}
