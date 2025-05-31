import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FooterComponent } from "../../shared/footer/footer.component";
import { GHeaderProfileComponent } from "../../shared/g-header-profile/g-header-profile.component";
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Keep if you might add other forms later, otherwise optional
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';

// Interface matching the API response
interface CourseDetails {
  courseId: number;
  courseTitle: string;
  description?: string;
  logo?: string; // Base64 encoded image string
  price: number;
  teacherName: string;
  lessons?: string[];
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Optional if no ngModel is used
    CurrencyPipe,
    FooterComponent,
    GHeaderProfileComponent
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  // --- Dependency Injection ---
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Component State ---
  courseData: CourseDetails | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isProcessingPayment: boolean = false;

  // --- IDs ---
  private courseId: number | null = null;
  private studentId: string | null = null;

  // --- API Endpoints ---
  private courseApiUrl = 'https://estigo.tryasp.net/api/Course';
  private enrollmentApiBaseUrl = 'https://estigo.tryasp.net/api/Student';

  // Fawry logo path (adjust as needed)
  fawryLogoUrl: string = 'fawry.jpeg'; // Example path

  ngOnInit(): void {
    this.isLoading = true;
    this.error = null;

    this.courseId = this.getIdFromRoute('id');
    this.studentId = this.getIdFromLocalStorage('userData', 'id');

    if (!this.courseId || !this.studentId) {
      this.isLoading = false;
      return;
    }

    this.fetchCourseDetails(this.courseId);
  }

  // --- Data Fetching ---
  fetchCourseDetails(id: number): void {
    const url = `${this.courseApiUrl}/${id}/details`;
    this.http.get<CourseDetails>(url)
      .pipe(
        tap(data => console.log('Course details fetched:', data)),
        catchError(err => this.handleError(err, 'Could not load course details.')),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.courseData = data;
        },
      });
  }

  // --- Enrollment Logic (Fawry is implied) ---
  enrollStudent(): void {
    this.error = null;
    if (!this.courseId || !this.studentId) return;

    this.isProcessingPayment = true;
    const enrollmentUrl = `${this.enrollmentApiBaseUrl}/${this.studentId}/enroll/${this.courseId}`;
    const headers = new HttpHeaders({ 'accept': '*/*' });

    // The body is null, assuming the API handles payment method choice server-side
    // or if Fawry is the default/only method integrated with this endpoint.
    this.http.post(enrollmentUrl, null, { headers: headers, responseType: 'text' })
      .pipe(
        tap(response => console.log('Enrollment successful (Fawry initiated):', response)),
        catchError(err => this.handleError(err, 'Failed to enroll in the course.')),
        finalize(() => this.isProcessingPayment = false)
      )
      .subscribe({
        next: () => {
            // we can add some kind of alert here 
          this.router.navigate(['/dashboard']);
        },
      });
  }

  // --- Navigation ---
  cancelPayment(): void {
    console.log('Payment cancelled');
    window.history.back();
  }

  // --- Helpers ---
  get courseImageUrl(): string {
    return this.courseData?.logo
           ? this.courseData.logo
           : 'assets/images/placeholder-course.png';
  }

  private getIdFromRoute(paramName: string): number | null {
    const idStr = this.route.snapshot.paramMap.get(paramName);
    if (!idStr) {
      this.error = `Parameter '${paramName}' not found in the URL.`;
      console.error(this.error);
      return null;
    }
    const id = Number(idStr);
    if (isNaN(id)) {
      this.error = `Invalid non-numeric value for URL parameter '${paramName}'.`;
      console.error(this.error);
      return null;
    }
    return id;
  }

  private getIdFromLocalStorage(storageKey: string, propertyName: string): string | null {
    const userDataStr = localStorage.getItem(storageKey);
    if (!userDataStr) {
      this.error = 'User not logged in';
      console.error(this.error);
      this.router.navigate(['/login']);
      return null;
    }
    try {
      const parsedUserData = JSON.parse(userDataStr);
      const id = parsedUserData[propertyName];
      if (!id) {
        this.error = `Property '${propertyName}' not found in stored user data.`;
        console.error(this.error);
        return null;
      }
      return String(id);
    } catch (e) {
      this.error = 'Failed to parse user data from localStorage.';
      console.error(this.error, e);
      return null;
    }
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    console.error('API Error:', error);
    let displayMessage = defaultMessage;

    if (error.error && typeof error.error === 'string') {
      displayMessage = `${defaultMessage} Server response: ${error.error}`;
    } else if (error.error?.message) {
      displayMessage = error.error.message;
    } else if (error.message) {
      displayMessage = error.message;
    } else if (error.status) {
        displayMessage = `${defaultMessage} Status: ${error.status} ${error.statusText}`;
    }

    this.error = displayMessage;
    return throwError(() => new Error(displayMessage));
  }
}