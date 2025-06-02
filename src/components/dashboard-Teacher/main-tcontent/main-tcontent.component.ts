import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // For [routerLink]
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

// Define an interface for the user data stored in localStorage
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interface for the student data from the API
interface Student {
  id: string; // Student's ID
  name: string; // Student's Name
  categoryId: number; // Category ID for the prediction
}

// --- Interfaces for Student Exam Data ---
interface StudentExamRecord { // For /GetExamsByStudentId response
  examId: number;
  examTitle: string;
  score: number;
  examDate: string;
  lessonName: string;
}

interface AnswerDetail { // For the /answers endpoint
  questionId: number;
  selectedOption: string;
  isCorrect: boolean;
}

interface StudentExamAnswersResponse { // For the /answers endpoint
  studentId: string;
  studentName: string;
  score: number;
  examDate: string;
  answers: AnswerDetail[];
  examTitle?: string; // Optional: to store the title for display convenience
}

@Component({
  selector: 'app-main-tcontent',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './main-tcontent.component.html',
  styleUrls: ['./main-tcontent.component.css']
})
export class MainTcontentComponent implements OnInit {
  private http = inject(HttpClient);

  teacherId: string | null = null;
  students: Student[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  teacherName: string | null = null;

  // --- State for Grades Modal ---
  isGradesModalVisible = false;
  selectedStudentForGrades: Student | null = null;

  studentTakenExams: StudentExamRecord[] = []; // To store list of student's exams
  isLoadingStudentExams = false;
  studentExamsErrorMessage: string | null = null;
  selectedExamIdForGrades: number | null = null; // To store the chosen examId from dropdown

  studentGradesData: StudentExamAnswersResponse | null = null; // For detailed answers
  isLoadingGrades = false;
  gradesErrorMessage: string | null = null;

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
    const apiUrl = `https://estigo.runasp.net/api/Teacher/${this.teacherId}/students`;

    this.http.get<Student[]>(apiUrl).subscribe({
      next: (data) => {
        this.students = data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error("Error fetching students:", err);
        this.errorMessage = `Failed to load students. Status: ${err.status} - ${err.statusText || err.message}`;
        if (err.status === 0) {
            this.errorMessage += " (Could be a CORS issue or server is down)";
        }
        this.isLoading = false;
      }
    });
  }

  // --- Methods for Grades Modal ---
  openGradesModal(student: Student): void {
    this.selectedStudentForGrades = student;
    this.isGradesModalVisible = true;
    // Reset states for the modal content
    this.studentGradesData = null;
    this.gradesErrorMessage = null;
    this.studentTakenExams = [];
    this.studentExamsErrorMessage = null;
    this.selectedExamIdForGrades = null;
    this.fetchStudentTakenExams(student.id); // Fetch exams for this student
  }

  closeGradesModal(): void {
    this.isGradesModalVisible = false;
    this.selectedStudentForGrades = null;
    this.studentGradesData = null;
    this.gradesErrorMessage = null;
    this.studentTakenExams = [];
    this.isLoadingStudentExams = false;
    this.studentExamsErrorMessage = null;
    this.selectedExamIdForGrades = null;
  }

  private fetchStudentTakenExams(studentId: string): void {
    this.isLoadingStudentExams = true;
    this.studentExamsErrorMessage = null;
    const apiUrl = `https://estigo.runasp.net/api/Exam/GetExamsByStudentId/${studentId}`;

    this.http.get<StudentExamRecord[]>(apiUrl).subscribe({
        next: (data) => {
            this.studentTakenExams = data;
            if (data.length === 0) {
                this.studentExamsErrorMessage = "This student has not taken any exams for which records are available.";
            }
            this.isLoadingStudentExams = false;
        },
        error: (err: HttpErrorResponse) => {
            console.error("Error fetching student's taken exams:", err);
            this.studentExamsErrorMessage = `Failed to load student's exams. Status: ${err.status} - ${err.statusText || 'Error'}`;
            this.isLoadingStudentExams = false;
        }
    });
  }

  // Called when an exam is selected or "Fetch Exam Details" is clicked
  fetchDetailedGrades(): void {
    if (!this.selectedStudentForGrades || this.selectedExamIdForGrades === null) {
        this.gradesErrorMessage = "Please select an exam from the list to view details.";
        return;
    }

    this.isLoadingGrades = true;
    this.gradesErrorMessage = null;
    this.studentGradesData = null; // Clear previous details

    const studentId = this.selectedStudentForGrades.id;
    const examId = this.selectedExamIdForGrades;
    const gradesApiUrl = `https://estigo.runasp.net/api/Teacher/exam/${examId}/student/${studentId}/answers`;

    this.http.get<StudentExamAnswersResponse>(gradesApiUrl).subscribe({
        next: (data) => {
            this.studentGradesData = data;
            // Find the title from the already fetched studentTakenExams list
            const examRecord = this.studentTakenExams.find(e => e.examId === examId);
            if (examRecord && this.studentGradesData) {
                this.studentGradesData.examTitle = examRecord.examTitle;
            }
            this.isLoadingGrades = false;
        },
        error: (err: HttpErrorResponse) => {
            console.error("Error fetching student grade details:", err);
            this.gradesErrorMessage = `Failed to load grade details. Status: ${err.status} - ${err.statusText || 'Error'}. `;
            if (err.error && typeof err.error === 'string') {
                this.gradesErrorMessage += err.error;
            } else if (err.error && err.error.title) {
                 this.gradesErrorMessage += err.error.title;
            } else if (err.status === 404) {
                this.gradesErrorMessage = `No detailed grade data found for the selected exam and student.`;
            }
            this.isLoadingGrades = false;
        }
    });
  }

  // Helper to clear detailed grades if exam selection changes
  onExamSelectionChange(): void {
    this.studentGradesData = null;
    this.gradesErrorMessage = null;
    if(this.selectedExamIdForGrades !== null) {

    }
  }
}