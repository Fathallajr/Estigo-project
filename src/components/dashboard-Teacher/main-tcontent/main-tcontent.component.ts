import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule for [routerLink]

// Define an interface for the user data stored in localStorage
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Updated interface for the student data from the API
interface Student {
  id: string; // Student's ID
  name: string; // Student's Name
  categoryId: number; // Category ID for the prediction
}

@Component({
  selector: 'app-main-tcontent',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule // Add RouterModule to imports for [routerLink]
  ],
  templateUrl: './main-tcontent.component.html',
  styleUrl: './main-tcontent.component.css' // Assuming you have this CSS file from previous steps
})
export class MainTcontentComponent implements OnInit {
  private http = inject(HttpClient);

  teacherId: string | null = null;
  students: Student[] = []; // Use the updated Student interface
  isLoading: boolean = false;
  errorMessage: string | null = null;
  teacherName: string | null = null;

  ngOnInit(): void {
    this.loadTeacherData();
    if (this.teacherId) {
      this.fetchStudents();
    } else {
      this.errorMessage = "Teacher ID not found in local storage. Please log in again.";
      console.error("Teacher ID not found in local storage.");
    }
  }

  private loadTeacherData(): void {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData: UserData = JSON.parse(userDataString);
        this.teacherId = userData.id;
        this.teacherName = userData.name;
      } catch (error) {
        this.errorMessage = "Failed to parse user data from local storage.";
        console.error("Error parsing user data from local storage:", error);
      }
    }
  }

  private fetchStudents(): void {
    if (!this.teacherId) {
      this.errorMessage = "Cannot fetch students without a Teacher ID.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    // Ensure your API base URL is correct.
    const apiUrl = `https://estigo.tryasp.net/api/Teacher/${this.teacherId}/students`;

    this.http.get<Student[]>(apiUrl).subscribe({ // HttpClient expects an array of the updated Student interface
      next: (data) => {
        this.students = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error fetching students:", err);
        this.errorMessage = `Failed to load students. Status: ${err.status} - ${err.message}`;
        if (err.status === 0) {
            this.errorMessage += " (Could be a CORS issue or server is down)";
        }
        this.isLoading = false;
      },
      complete: () => {
        console.log("Student fetching completed.");
      }
    });
  }
}