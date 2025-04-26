import { Component, Input } from '@angular/core';
import { MainAcontentComponent } from "../main-acontent/main-acontent.component";
import { CommonModule } from '@angular/common';
import { UsersListComponent } from "../users-list/users-list.component";
import { UploadCoursesComponent } from "../upload-courses/upload-courses.component";
import { UploadAcoursesComponent } from "../upload-acourses/upload-acourses.component";
import { CoursesListComponent } from "../courses-list/courses-list.component";
import { UploadAlessonsComponent } from "../upload-alessons/upload-alessons.component";
import { UploadAQuizzesComponent } from "../upload-aquizzes/upload-aquizzes.component";

@Component({
  selector: 'app-dashboard-amain',
  imports: [MainAcontentComponent, CommonModule, UsersListComponent, UploadCoursesComponent, UploadAcoursesComponent, CoursesListComponent, UploadAlessonsComponent, UploadAQuizzesComponent],
  templateUrl: './dashboard-amain.component.html',
  styleUrl: './dashboard-amain.component.css'
})
export class DashboardAmainComponent {
  @Input() selectedComponent: 'Page1' | 'Page2' | 'Page3' | 'Page4' = 'Page1';
  isUploadCoursesVisible = false;
  isUploadLessonsVisible = false;
  isUploadQuizzesVisible = false;
  
  onNavigateToCourses() {
    this.isUploadCoursesVisible = true;
  }
  onNavigateToLessons() {
    this.isUploadLessonsVisible = true;
  }
  onNavigateToQuizzes() {
    this.isUploadQuizzesVisible = true;
  }
  
  returnToMainContent() {
    this.isUploadCoursesVisible = false;
    this.isUploadLessonsVisible = false;
    this.isUploadQuizzesVisible = false;
  }
}
