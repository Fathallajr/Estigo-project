import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../../../services/course.service';


@Component({
  selector: 'app-physics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.css'
})
export class PhysicsComponent implements OnInit {
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesByCategory(2)
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
