import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-pcontent',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './main-pcontent.component.html',
  styleUrls: ['./main-pcontent.component.css']
})
export class MainPcontentComponent {
  private http = inject(HttpClient);

  studentCodeInput: string = '';
  studentName: string = '';
  examHistory: any[] = [];

  fetchStudentData(): void {
    const studentCode = this.studentCodeInput.trim();
    if (!studentCode) {
      alert('Please enter a student code.');
      return;
    }

    const url = `https://estigo.tryasp.net/api/Parent/student/${studentCode}/quizzes`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.studentName = data.studentName;
        this.examHistory = data.examHistory;
      },
      error: (err) => {
        console.error('API error:', err);
        alert('Failed to fetch data. Check the student code.');
        this.studentName = '';
        this.examHistory = [];
      }
    });
  }
}
