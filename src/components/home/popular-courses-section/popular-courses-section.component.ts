import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Course {
  courseId: number;
  courseTitle: string;
  imageBase64: string;
  teacherName: string;
}

@Component({
  selector: 'app-popular-courses-section',
  standalone: true,
  imports: [CommonModule, HttpClientModule,RouterLink],
  templateUrl: './popular-courses-section.component.html',
  styleUrl: './popular-courses-section.component.css'
})
export class PopularCoursesSectionComponent implements OnInit {
  courses: Course[] = [];
  isLoading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchCourses();
  }

  fetchCourses() {
    this.http.get<Course[]>('https://est.runasp.net/api/Course/HomepageCourses')
      .subscribe({
        next: (data) => {
          this.courses = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching courses:', error);
          this.isLoading = false;
        }
      });
  }
}
