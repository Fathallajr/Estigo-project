import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../../../services/course.service';


@Component({
  selector: 'app-biology',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './biology.component.html',
  styleUrl: './biology.component.css'
})
export class BiologyComponent implements OnInit {
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesByCategory(3)
      .subscribe({
        next: (data) => {
          this.courses = data;
        },
        error: (error) => {
          console.error('Error fetching courses:', error);
        }
      });
  }
}
