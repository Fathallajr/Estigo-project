import { Component, OnInit, inject } from '@angular/core'; // Import inject
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FooterComponent } from "../../shared/footer/footer.component"; // Assuming path is correct
import { GHeaderProfileComponent } from "../../shared/g-header-profile/g-header-profile.component"; // Assuming path is correct
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Keep if using ngModel for card details
import { Observable, EMPTY, throwError } from 'rxjs'; // Import EMPTY and throwError
import { catchError, tap, finalize } from 'rxjs/operators'; // Import operators

// Interface matching the new API response
interface CourseDetails {
  courseId: number;
  courseTitle: string;
  description?: string; // Optional
  logo?: string; // Base64 encoded image string
  price: number;
  teacherName: string;
  lessons?: string[]; // Array of lesson titles/names
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Include if using [(ngModel)]
    CurrencyPipe,
    FooterComponent, // Ensure these shared components are standalone or part of a shared module
    GHeaderProfileComponent
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  // --- Dependency Injection ---
  // Using inject() for cleaner constructor (optional style choice)
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Component State ---
  courseData: CourseDetails | null = null;
  isLoading: boolean = true; // Single loading state for initial fetch
  error: string | null = null; // Single error state for fetch/enrollment
  selectedPaymentMethod: 'credit-card' | 'fawry' = 'credit-card';
  isProcessingPayment: boolean = false;

  // --- IDs ---
  private courseId: number | null = null;
  private studentId: string | null = null;

  // --- API Endpoints ---
  // Use your actual API endpoints
  private courseApiUrl = 'https://estigo.tryasp.net/api/Course'; // Base URL for course
  private enrollmentApiBaseUrl = 'https://estigo.tryasp.net/api/Student'; // Enrollment API

  // --- Card Details (Optional) ---
  cardName: string = '';
  cardNumber: string = '';
  expiryDate: string = '';
  cvv: string = '';

  ngOnInit(): void {
    this.isLoading = true;
    this.error = null; // Reset errors

    // 1. Get IDs
    this.courseId = this.getIdFromRoute('id');
    this.studentId = this.getIdFromLocalStorage('userData', 'id'); // Assuming 'id' is the property name

    if (!this.courseId || !this.studentId) {
      // Error is set within the helper functions if ID is missing
      this.isLoading = false;
      return;
    }

    // 2. Fetch Course Details using the new endpoint
    this.fetchCourseDetails(this.courseId);
  }

  // --- Data Fetching ---
  fetchCourseDetails(id: number): void {
    const url = `${this.courseApiUrl}/${id}/details`; // Use the /details endpoint
    this.http.get<CourseDetails>(url)
      .pipe(
        tap(data => console.log('Course details fetched:', data)), // Log fetched data
        catchError(err => this.handleError(err, 'Could not load course details.')), // Centralized error handling
        finalize(() => this.isLoading = false) // Ensure loading stops
      )
      .subscribe({
        next: (data) => {
          this.courseData = data;
        },
        // Error is handled by catchError, but you could have specific logic here too
        // error: (err) => { /* Specific error logic if needed */ }
      });
  }

  // --- Payment Method Logic ---
  selectPaymentMethod(method: 'credit-card' | 'fawry'): void {
    this.selectedPaymentMethod = method;
  }

  // --- Enrollment Logic ---
  enrollStudent(): void {
    this.error = null; // Reset previous enrollment errors
    if (!this.courseId || !this.studentId) return; // Already handled in ngOnInit generally

    // Basic client-side validation (optional)
    if (this.selectedPaymentMethod === 'credit-card' && (!this.cardName || !this.cardNumber || !this.expiryDate || !this.cvv)) {
      this.error = 'Please fill in all credit card details.';
      return;
    }

    this.isProcessingPayment = true;
    const enrollmentUrl = `${this.enrollmentApiBaseUrl}/${this.studentId}/enroll/${this.courseId}`;
    const headers = new HttpHeaders({ 'accept': '*/*' }); // Keep if required by API

    this.http.post(enrollmentUrl, null, { headers: headers, responseType: 'text' })
      .pipe(
        tap(response => console.log('Enrollment successful:', response)),
        catchError(err => this.handleError(err, 'Failed to enroll in the course.')),
        finalize(() => this.isProcessingPayment = false)
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']); // Navigate on success
        },
        // Error handled by catchError
      });
  }

  // --- Navigation ---
  cancelPayment(): void {
    console.log('Payment cancelled');
    window.history.back(); // Simple back navigation
  }

  // --- Helpers ---
  get courseImageUrl(): string {
    // Use placeholder if logo is missing or empty
    return this.courseData?.logo
           ? this.courseData.logo
           : 'assets/images/placeholder-course.png'; // Adjust placeholder path
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
      return String(id); // Ensure it's a string if the API expects it
    } catch (e) {
      this.error = 'Failed to parse user data from localStorage.';
      console.error(this.error, e);
      return null;
    }
  }

  // Centralized Error Handling
  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    console.error('API Error:', error);
    let displayMessage = defaultMessage;

    // Try to extract a more specific message from the error response
    if (error.error && typeof error.error === 'string') {
      displayMessage = `${defaultMessage} Server response: ${error.error}`;
    } else if (error.error?.message) {
      displayMessage = error.error.message; // Use message from JSON error object
    } else if (error.message) {
      displayMessage = error.message; // General HttpErrorResponse message
    } else if (error.status) {
        displayMessage = `${defaultMessage} Status: ${error.status} ${error.statusText}`;
    }

    this.error = displayMessage; // Update the component's error state
    // return EMPTY; // Option 1: Stop the observable chain gracefully
    return throwError(() => new Error(displayMessage)); // Option 2: Propagate as an error
  }
}