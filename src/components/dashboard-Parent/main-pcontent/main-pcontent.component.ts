import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Import Router and RouterModule

// Interfaces (assuming they are the same as before)
interface StudentQuizData {
  studentid: string;
  studentName: string;
  examHistory: Exam[];
}

interface Exam {
  examTitle: string;
  score: number | string;
  examDate: string;
  lessonName: string;
}

@Component({
  selector: 'app-main-pcontent',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule], // Add RouterModule
  templateUrl: './main-pcontent.component.html',
  styleUrls: ['./main-pcontent.component.css']
})
export class MainPcontentComponent {
  private http = inject(HttpClient);
  private router = inject(Router); // Inject Router for navigation

  studentCodeInput: string = '';
  studentId: string = '';         // Stored student's ID
  studentName: string = '';
  examHistory: Exam[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // --- New properties for prediction ---
  categories: number[] = [1, 2, 3, 4, 5]; // Available categories
  selectedCategoryId: number | null = null; // Initially no category selected

  fetchStudentData(): void {
    const studentCode = this.studentCodeInput.trim();
    if (!studentCode) {
      this.errorMessage = 'Please enter a student code.';
      this.clearStudentData();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.clearStudentData(); // Clear previous data including category selection

    const url = `https://estigo.tryasp.net/api/Parent/student/${studentCode}/quizzes`;

    this.http.get<StudentQuizData>(url).subscribe({
      next: (data) => {
        if (data && data.studentName) {
          this.studentId = data.studentid;
          this.studentName = data.studentName;
          this.examHistory = data.examHistory || [];
          // Optionally pre-select a category or leave it for the user
          // this.selectedCategoryId = this.categories[0]; // e.g., pre-select the first category
        } else {
          this.errorMessage = 'Student data not found or in an unexpected format.';
          console.warn('Received data but studentName is missing:', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API error:', err);
        if (err.status === 404) {
          this.errorMessage = `No student found with the code: ${studentCode}. Please check the code.`;
        } else if (err.status === 0) {
          this.errorMessage = 'Could not connect to the server. Check your internet connection.';
        } else {
          this.errorMessage = 'Failed to fetch student data. An unknown error occurred.';
        }
        this.clearStudentData();
        this.isLoading = false;
      }
    });
  }

  // Helper to clear student-specific data
  private clearStudentData(): void {
    this.studentName = '';
    this.studentId = '';
    this.examHistory = [];
    this.selectedCategoryId = null; // Reset category selection
  }

  // --- New method for navigating to prediction ---
  viewPrediction(): void {
    if (!this.studentId) {
      this.errorMessage = 'Student data not loaded. Please fetch student data first.';
      return;
    }
    if (this.selectedCategoryId === null) {
      this.errorMessage = 'Please select a prediction category.';
      // Alternatively, use an alert or a more prominent error display near the category selector
      alert('Please select a prediction category.');
      return;
    }




    this.router.navigate(['/student-prediction', this.studentId, this.selectedCategoryId]);
 
  }
}