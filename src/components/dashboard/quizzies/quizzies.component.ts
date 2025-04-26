import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Import CommonModule & DatePipe
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient & HttpClientModule
import { catchError, finalize, throwError } from 'rxjs'; // Import RxJS operators

// Define the interface matching the API response structure
interface Exam {
  examId: number;
  examTitle: string;
  score: number; // API provides number
  examDate: string; // API provides string ISO date
  lessonName: string;
}

// Define the expected structure in local storage
interface UserInfo {
    id: string;
    // Add other properties if they exist in your local storage item like email, name, role
    email?: string;
    name?: string;
    role?: string;
}


@Component({
  selector: 'app-quizzies',
  standalone: true, // Mark as standalone
  imports: [
    CommonModule,       // Needed for *ngFor, *ngIf, DatePipe etc.
    HttpClientModule    // Needed for HttpClient - alternatively provideHttpClient() in app.config.ts
  ],
  templateUrl: './quizzies.component.html',
  styleUrl: './quizzies.component.css',
  providers: [DatePipe] // Provide DatePipe if not provided globally
})
export class QuizziesComponent implements OnInit {
  private http = inject(HttpClient); // Inject HttpClient

  exams: Exam[] = []; // Array to hold the fetched exams
  isLoading = true;   // Flag for loading state
  error: string | null = null; // To store potential error messages
  studentId: string | null = null; // To store the student ID

  // Base URL for the API (consider moving to environment variables)
  private apiUrl = 'https://estigo.tryasp.net/api/Exam/GetExamsByStudentId';

  constructor(private datePipe: DatePipe) {} // Inject DatePipe if needed for formatting

  ngOnInit(): void {
    this.getStudentId(); // Attempt to get ID and potentially set this.error

    if (this.studentId) {
        // ID found, proceed to fetch exams
        this.fetchExams(this.studentId);
    } else {
        // ID not found or error occurred during retrieval
        console.error("Student ID not available after getStudentId() call. Current error state:", this.error);
        // Only set the generic error message if a more specific one wasn't already set by getStudentId
        if (!this.error) {
          this.error = 'Could not retrieve student ID from local storage. Cannot load quizzes.';
        }
        this.isLoading = false; // Stop loading indicator as we cannot proceed
    }
  }

  /**
   * Retrieves the student ID from local storage.
   * Sets this.studentId if successful, otherwise sets this.error.
   */
  getStudentId(): void {
    // *** Set to the CORRECT key used in your application's Local Storage ***
    const storageKey = 'userData'; // <--- CORRECTED KEY

    console.log(`Attempting to retrieve item with key: "${storageKey}"`);

    try {
      const userInfoString = localStorage.getItem(storageKey);
      console.log(`Raw data retrieved for key "${storageKey}":`, userInfoString); // Log the raw string

      if (userInfoString) {
        // String exists, attempt to parse it
        const userInfo: UserInfo = JSON.parse(userInfoString);
        console.log('Parsed userInfo object:', userInfo); // Log the parsed object

        // Check if the parsed object exists AND has an 'id' property AND it's a non-empty string
        if (userInfo && typeof userInfo.id === 'string' && userInfo.id.trim() !== '') {
            this.studentId = userInfo.id;
            console.log('Successfully extracted student ID:', this.studentId);
            this.error = null; // Clear any previous errors if successful
        } else {
            // Parsed object is invalid or missing the 'id' property
            console.error(`Parsed userInfo object is missing required "id" property or "id" is invalid. Parsed object:`, userInfo);
            this.error = 'Stored user information is missing a valid ID.';
            this.studentId = null; // Ensure studentId is null
        }
      } else {
          // No item found with the specified key
          console.warn(`No item found in local storage with key "${storageKey}". User might not be logged in.`);
          // Updated error message to reflect the key actually checked
          this.error = `User information ('${storageKey}') not found in storage. Please log in again.`;
          this.studentId = null; // Ensure studentId is null
      }
    } catch (e) {
      // Error occurred during JSON parsing
      console.error(`Error parsing JSON data from local storage key "${storageKey}". Raw data: "${localStorage.getItem(storageKey)}". Error:`, e);
      this.error = 'Error reading user information from storage. Data might be corrupted.';
      this.studentId = null; // Ensure studentId is null on error
    }
  }

  /**
   * Fetches the list of exams for the given student ID from the API.
   * Updates the exams array, loading state, and error state.
   * @param studentId The ID of the student whose exams to fetch.
   */
  fetchExams(studentId: string): void {
    this.isLoading = true;
    this.error = null; // Reset error before starting fetch

    const url = `${this.apiUrl}/${studentId}`;
    console.log('Fetching exams from:', url); // Log the URL being called

    this.http.get<Exam[]>(url)
      .pipe(
        catchError(err => {
          console.error('API Error Response:', err); // Log the full error object

          let message = 'Failed to load quizzes due to a server error. Please try again later.'; // Default server error message

          if (err.status === 404) {
            // Treat 404 specifically as "no quizzes found"
            console.log('API returned 404, interpreting as no quizzes found for this student.');
            this.exams = []; // Ensure exams array is empty
            // No error message needed here, template will show "No quizzes found"
            return throwError(() => new Error("404 - Not Found")); // Throw specific error to handle in subscribe block
          } else if (err.message) {
             // Use error message from the HttpErrorResponse if available
             message = `Error fetching quizzes: ${err.status} ${err.statusText || err.message}`;
          }

          // Set the error message for non-404 errors
          this.error = message;
          // Re-throw the error
          return throwError(() => new Error(message));
        }),
        finalize(() => {
          // This block executes regardless of success or error
          this.isLoading = false;
          console.log('Exam fetch finalized. Loading state:', this.isLoading);
        })
      )
      .subscribe({
          next: (data) => {
            // API call was successful (status 2xx)
            console.log('API Response Data (Success):', data);
             // Sort exams by date, newest first (optional, but often useful)
            this.exams = data.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
            // Check if the successful response still contains an empty array
            if (data.length === 0) {
                console.log('API returned 200 OK, but the exams array is empty.');
            }
          },
          error: (err) => {
            // Handles errors thrown from catchError
            console.log('Subscribe error handler caught:', err.message);
            // If it was a 404, state is already handled (isLoading=false, exams=[])
            // For other errors, this.error should already be set by catchError.
          }
    });
  }

  /**
   * Helper function to determine if a grade score is considered low.
   * Used for applying conditional CSS styling.
   * @param score The numerical score of the quiz.
   * @returns True if the score is below 80, false otherwise.
   */
  isLowGrade(score: number): boolean {
    // Define your threshold for a "low" grade (e.g., below 80%)
    return score < 80;
  }

   /**
    * Formats the date string using DatePipe.
    * @param dateString The ISO date string from the API.
    * @returns A formatted date string (e.g., 'MMM d, y') or the original string if formatting fails.
    */
   formatExamDate(dateString: string): string {
    try {
        // Using 'mediumDate' format (e.g., 'Sep 10, 2024') - adjust format as needed
        return this.datePipe.transform(dateString, 'mediumDate') || dateString;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Return original string if pipe fails
    }
   }
}