import { Component, Input } from '@angular/core';
import { MainAcontentComponent } from "../main-acontent/main-acontent.component";
import { CommonModule } from '@angular/common';
import { UsersListComponent } from "../users-list/users-list.component";
import { UploadCoursesComponent } from "../upload-courses/upload-courses.component";
import { SystemSettingsComponent } from "../system-settings/system-settings.component";

@Component({
  selector: 'app-dashboard-amain',
  imports: [MainAcontentComponent, CommonModule, UsersListComponent, UploadCoursesComponent, SystemSettingsComponent],
  templateUrl: './dashboard-amain.component.html',
  styleUrl: './dashboard-amain.component.css'
})
export class DashboardAmainComponent {
  @Input() selectedComponent: 'Page1' | 'Page2' | 'Page3' | 'Page4' = 'Page1';
  isSystemSettingsVisible = false;
  
  onNavigateToSettings() {
    this.isSystemSettingsVisible = true;
  }
  
  returnToMainContent() {
    this.isSystemSettingsVisible = false;
  }
}
