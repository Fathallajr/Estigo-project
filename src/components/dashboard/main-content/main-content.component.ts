import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GHeaderProfileComponent } from '../../../shared/g-header-profile/g-header-profile.component'; // Adjust path if needed
import { SidebarComponent } from '../sidebar/sidebar.component'; // Adjust path if needed
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Import DomSanitizer
import { Router, RouterLink, RouterModule } from '@angular/router';


export interface EnrolledCourse {
  courseId:number;
  courseName: string;
  courseImageUrl: string; // Expecting Base64 string here now
 
}

export interface CourseInstructor {
  instructorImageUrl: string; // Expecting Base64 string here now
  
}

export interface Quiz {
  examId: number;
  examTitle: string;
  score : number;
  examDate: string;
  lessonName: string;
}

export interface PaymentInfo {
  purchaseDate: string;
  courseTitle: string;
}

export interface StudentDashboardData {
  studentId: string;
  studentName: string;
  studentCode : number;
  enrolledCourses: EnrolledCourse[];
  courseInstructors: CourseInstructor[];
  quizzes: Quiz[];
  paymentInfo: PaymentInfo[];
}

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: string;

}
// --- End Interfaces ---

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    GHeaderProfileComponent,
    SidebarComponent,
    RouterLink,
    RouterModule
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer); // Inject DomSanitizer
  private router = inject(Router); // Inject Router

  dashboardData$: Observable<StudentDashboardData | null> | undefined;
  isLoading = true;
  errorMessage: string | null = null;
  studentName: string = 'User';

  private readonly localStorageKey = 'userData';

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const userInfoString = localStorage.getItem(this.localStorageKey);

    if (!userInfoString) {
        this.handleError('User information not found in local storage. Please log in again.');
        return;
    }

    try {
        const userInfo: UserInfo = JSON.parse(userInfoString);
        const studentId = userInfo?.id;

        if (!studentId) {
            this.handleError('Student ID not found in user information.');
            return;
        }

        this.studentName = userInfo?.name || 'User';
        const apiUrl = `https://estigo.runasp.net/api/Dashboard/student/${studentId}`;

        this.dashboardData$ = this.http.get<StudentDashboardData>(apiUrl).pipe(
            tap(data => {
                if (data) {
                    this.studentName = data.studentName.toUpperCase();
                }
                this.isLoading = false;
                console.log('Dashboard data fetched:', data);
            }),
            catchError(error => {
                console.error('Error fetching dashboard data:', error);
                const errorMsg = `Failed to load dashboard data. Status: ${error.status} - ${error.message || error.statusText || 'Unknown server error'}`;
                this.handleError(errorMsg);
                return of(null);
            })
        );

    } catch (e) {
        this.handleError('Failed to parse user information from local storage.');
        console.error(e);
    }
  }

  // Modal properties
  showNumberModal = false;
  selectedModalNumber = 1;
  
  // Method to handle predict button click
  onPredictClick(): void {
    // Show the modal instead of using prompt
    this.showNumberModal = true;
  }
  
  // Method to handle number selection and close modal
  onSelectNumber(): void {
    // Navigate to prediction component with the selected number
    this.router.navigate(['/predict', this.selectedModalNumber]);
    this.showNumberModal = false;
  }
  
  // Method to close the modal without selection
  closeNumberModal(): void {
    this.showNumberModal = false;
  }

  private handleError(message: string): void {
      this.errorMessage = message;
      this.isLoading = false;
      this.dashboardData$ = of(null);
  }

 
  getImageSource(
      imageUrl: string | null | undefined,
      defaultImageUrl: string
    ): SafeUrl | string {
      if (imageUrl) {
          try {
              return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
          } catch (e) {
              console.error("Error processing image URL:", e);
              return defaultImageUrl;
          }
      }
      
      return defaultImageUrl;
  }
}