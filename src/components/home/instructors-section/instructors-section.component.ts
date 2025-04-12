import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Teacher {
  name: string;
  image: string;
  subject: string;
}

@Component({
  selector: 'app-instructors-section',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './instructors-section.component.html',
  styleUrl: './instructors-section.component.css'
})
export class InstructorsSectionComponent implements OnInit {
  teachers: Teacher[] = [];
  isLoading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchTeachers();
  }

  fetchTeachers() {
    this.http.get<Teacher[]>('https://est.runasp.net/api/Teacher/HomepageTeachers')
      .subscribe({
        next: (data) => {
          this.teachers = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching teachers:', error);
          this.isLoading = false;
        }
      });
  }
}