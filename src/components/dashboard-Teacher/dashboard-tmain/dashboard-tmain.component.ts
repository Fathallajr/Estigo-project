import { Component, Input } from '@angular/core';
import { MainTcontentComponent } from '../main-tcontent/main-tcontent.component';
import { CommonModule } from '@angular/common';
import { UploadTeacherComponent } from "../upload-teacher/upload-teacher.component";
import { UploadLessonComponent } from "../upload-lesson/upload-lesson.component";
import { UploadQuizzesComponent } from "../upload-quizzes/upload-quizzes.component";

@Component({
  selector: 'app-dashboard-tmain',
  imports: [MainTcontentComponent, CommonModule, UploadTeacherComponent, UploadLessonComponent, UploadQuizzesComponent],
  templateUrl: './dashboard-tmain.component.html',
  styleUrl: './dashboard-tmain.component.css'
})
export class DashboardTmainComponent {
  @Input() selectedComponent: 'Page1' | 'Page2' | 'Page3' | 'Page4' = 'Page1'; 

}
