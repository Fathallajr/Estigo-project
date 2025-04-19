import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// Interface defining the structure of a Teacher object from the API
interface Teacher {
  id: string;
  name: string;
  subject: string;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule
    // REMOVE HttpClientModule from here. It's provided globally via app.config.ts
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  readonly API_URL = 'https://estigo.tryasp.net/api/Admin/AllTeacher';
  teachers: Teacher[] = [];

  // Constructor injection remains the same
  constructor(private http: HttpClient) { } // This injection relies on the global provider

  ngOnInit(): void {
    this.fetchTeachers();
  }

  fetchTeachers(): void {
    // Guard against http being unexpectedly undefined (though unlikely now)
    if (!this.http) {
        console.error("HttpClient not injected correctly!");
        return;
    }
    console.log('Fetching teachers from:', this.API_URL);
    this.http.get<Teacher[]>(this.API_URL)
      .subscribe({
        next: (data) => {
          this.teachers = data;
          console.log('Teachers fetched successfully:', this.teachers);
        },
        error: (error) => {
          console.error('Error fetching teachers:', error);
          this.teachers = [];
        }
      });
  }
}