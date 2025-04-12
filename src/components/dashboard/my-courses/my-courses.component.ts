import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Course {
  courseId: number;
  courseTitle: string;
  description: string;
  imageBase64: string;
  teacherName: string;
  enrollmentDate: string;
  price: number;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css'
})
export class MyCoursesComponent implements OnInit {
  courses: Course[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const studentId = userData.id;
      this.fetchCourses(studentId);
    } else {
      console.error('User data not found in localStorage');
    }
  }

  fetchCourses(studentId: string) {
    this.http.get<Course[]>(`https://est.runasp.net/api/Student/${studentId}/mycourses`)
      .subscribe({
        next: (data) => {
          this.courses = data;
        },
        error: (error) => {
          console.error('Error fetching courses:', error);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
