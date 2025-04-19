import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../../../services/course.service';


@Component({
  selector: 'app-english',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './english.component.html',
  styleUrl: './english.component.css'
})
export class EnglishComponent implements OnInit {
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesByCategory(5)
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
