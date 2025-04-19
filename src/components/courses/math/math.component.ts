import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../../../services/course.service';


@Component({
  selector: 'app-math',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './math.component.html',
  styleUrl: './math.component.css'
})
export class MathComponent implements OnInit {
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesByCategory(1)
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
