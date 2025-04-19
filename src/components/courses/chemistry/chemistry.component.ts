import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../../../services/course.service';


@Component({
  selector: 'app-chemistry',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chemistry.component.html',
  styleUrl: './chemistry.component.css'
})
export class ChemistryComponent implements OnInit {
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesByCategory(4)
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
