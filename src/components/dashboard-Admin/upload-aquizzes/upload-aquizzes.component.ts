import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { switchMap, catchError, finalize, takeUntil, tap, startWith, filter } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

// --- Interfaces ---
export interface AdminCourse { courseId: number; courseTitle: string; description?: string | null; }
export interface LessonInfo { lessonId: number; lessonTitle: string; }
export interface CourseWithLessons { courseId: number; courseTitle: string; lessons: LessonInfo[]; }
export interface QuestionPayload { id: number; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; }


export interface ExamPayload {
  examTitle: string;
  examDescription: string;
  grade: string;
  lessonId: number;
  final: boolean; 
  questions: QuestionPayload[];
}


@Component({
  selector: 'app-upload-aquizzes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './upload-aquizzes.component.html',
  styleUrl: './upload-aquizzes.component.css'
})
export class UploadAQuizzesComponent implements OnInit, OnDestroy {
  @Output() backClicked = new EventEmitter<void>();

  // --- Injected Services ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // --- Component State ---
  courses: AdminCourse[] = [];
  lessons: LessonInfo[] = [];
  examForm!: FormGroup;
  isLoadingCourses = false;
  isLoadingLessons = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  correctAnswerOptions = ['A', 'B', 'C', 'D'];
  questionCollapsedState: boolean[] = [];

  private destroy$ = new Subject<void>();

  // --- API URLs & Constants ---
  private readonly adminCoursesApiUrl = 'https://estigo.runasp.net/api/Course/AdminCourses';
  private readonly lessonsApiBaseUrl = 'https://estigo.runasp.net/api/Course';
  private readonly addExamApiUrl = 'https://estigo.runasp.net/api/Teacher/add-exam';

  // Default values 
  private readonly defaultExamDescription = "";
  private readonly defaultGrade = "0";

  ngOnInit(): void {
    this.initializeForm(); // Includes isFinal form control
    this.fetchCourses();
    this.setupCourseSelectionListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form still uses 'isFinal' for the checkbox control name
  initializeForm(): void {
    this.examForm = this.fb.group({
      courseId: [null, Validators.required],
      lessonId: [{ value: null, disabled: true }, Validators.required],
      examTitle: ['', [Validators.required, Validators.minLength(3)]],
      isFinal: [false], 
      questions: this.fb.array([this.createQuestionGroup()], Validators.required)
    });
    this.questionCollapsedState = [false];
  }

  createQuestionGroup(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      optionA: ['', Validators.required],
      optionB: ['', Validators.required],
      optionC: ['', Validators.required],
      optionD: ['', Validators.required],
      correctAnswer: [null, Validators.required]
    });
  }

  get questionsFormArray(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  addQuestion(): void {
    this.questionCollapsedState = this.questionCollapsedState.map(() => true); // Collapse existing
    this.questionCollapsedState.push(false); // Add new one expanded
    this.questionsFormArray.push(this.createQuestionGroup());
  }

  removeQuestion(index: number): void {
    if (this.questionsFormArray.length > 1) {
      this.questionsFormArray.removeAt(index);
      this.questionCollapsedState.splice(index, 1);
    } else {
      // Optionally provide user feedback
      console.warn("Cannot remove the last question.");
      this.errorMessage = "At least one question is required.";
       setTimeout(() => this.errorMessage = null, 3000); // Clear message after delay
    }
  }

  toggleCollapse(index: number): void {
     if (this.questionCollapsedState && this.questionCollapsedState[index] !== undefined) {
        this.questionCollapsedState[index] = !this.questionCollapsedState[index];
     }
  }

  fetchCourses(): void {
    this.isLoadingCourses = true;
    this.errorMessage = null; // Clear previous errors
    this.successMessage = null;
    this.http.get<AdminCourse[]>(this.adminCoursesApiUrl)
      .pipe(
        takeUntil(this.destroy$),
        catchError(this.handleError), // Use centralized handler
        finalize(() => this.isLoadingCourses = false)
      )
      .subscribe({
        next: (data) => {
          this.courses = data;
          if (this.courses.length === 0) {
            this.errorMessage = "No courses found."; // Inform user if list is empty
          }
        },
        error: (err) => { /* handled by handleError */ }
      });
  }

  setupCourseSelectionListener(): void {
    const courseControl = this.examForm.get('courseId');
    const lessonControl = this.examForm.get('lessonId');

    if (!courseControl || !lessonControl) {
      console.error("Form controls for course or lesson not found!");
      return;
    }

    courseControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(courseControl.value), // Trigger on initial load
        tap(() => {
          // Reset lessons state when course changes
          this.lessons = [];
          lessonControl.reset({ value: null, disabled: true });
          this.errorMessage = null; // Clear lesson-specific errors
          this.successMessage = null;
        }),
        // Only proceed if a valid course ID is selected
        filter(courseId => courseId !== null && courseId !== undefined && courseId !== ''),
        tap(() => this.isLoadingLessons = true), // Show loading indicator
        switchMap(courseId => {
          const url = `${this.lessonsApiBaseUrl}/${courseId}/lessons`;
          return this.http.get<CourseWithLessons>(url).pipe(
            catchError(err => {
              // Handle lesson fetching error gracefully
              console.error('Error fetching lessons:', err);
              // Provide specific error message to the user
              this.errorMessage = `Failed to load lessons for the selected course. Please try again or select a different course.`;
              // Return an empty structure to prevent breaking the stream
              return of({ courseId: courseId, courseTitle: 'Error Loading', lessons: [] } as CourseWithLessons);
            }),
            finalize(() => this.isLoadingLessons = false) // Hide loading indicator regardless of success/error
          );
        })
      )
      .subscribe({
        next: (response) => {
            this.lessons = response.lessons || [];
            if (this.lessons.length > 0) {
              lessonControl.enable(); // Enable lesson dropdown if lessons exist
            } else {
              // Keep lesson dropdown disabled if no lessons found or error occurred
              lessonControl.disable();
              // Inform user if lessons were expected but not found (and no error message is already shown)
              if (!this.errorMessage && response.courseTitle !== 'Error Loading') {
                 this.errorMessage = "No lessons found for this course.";
              }
            }
        },
        error: (err) => {
           // This block might not be reached often due to catchError inside switchMap, but good for safety
           console.error("Unexpected error in lesson subscription:", err);
           this.errorMessage = "An unexpected error occurred while processing lessons.";
           this.lessons = [];
           lessonControl.reset({ value: null, disabled: true });
           this.isLoadingLessons = false;
        }
      });
  }


  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched(); // Mark top-level controls
      // Mark controls within the FormArray as touched for validation messages to show
      this.questionsFormArray.controls.forEach(control => {
           (control as FormGroup).markAllAsTouched();
       });
      this.errorMessage = 'Please fill all required fields correctly.';
      // Optionally, scroll to the first invalid field
      return;
    }

    this.isSubmitting = true;
    const formValue = this.examForm.getRawValue(); // getRawValue includes disabled controls like lessonId

    // *** MODIFIED: Payload Construction uses 'final' key ***
    const payload: ExamPayload = {
      examTitle: formValue.examTitle,
      examDescription: this.defaultExamDescription, // Using default
      grade: this.defaultGrade,                  // Using default
      lessonId: Number(formValue.lessonId),      // Ensure it's a number
      final: formValue.isFinal, // <-- Key is 'final', value comes from form control 'isFinal'
      questions: formValue.questions.map((q: any) => ({
        id: 0, // Assuming backend assigns the actual ID
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer
      }))
    };

    console.log('Submitting exam payload (using "final" key):', payload); // Debugging: Verify payload before sending

    this.http.post(this.addExamApiUrl, payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError(this.handleError), // Use centralized handler
        finalize(() => this.isSubmitting = false) // Ensure submission flag is reset
      )
      .subscribe({
        next: (response) => {
          console.log('Exam created successfully, API Response:', response); // Log response for verification
          this.successMessage = 'Quiz uploaded successfully!';

          // Reset the form thoroughly
          this.examForm.reset({
            courseId: null, // Explicitly reset dropdowns
            lessonId: { value: null, disabled: true }, // Reset lesson dropdown and disable
            isFinal: false // Reset checkbox to default
            // examTitle will be reset to null/empty string
          });

          // Clear existing questions and add one new blank one
          this.questionsFormArray.clear();
          this.questionsFormArray.push(this.createQuestionGroup()); // Add a single, fresh question group
          this.questionCollapsedState = [false]; // Reset collapse state for the new question

          this.lessons = []; // Clear the lessons dropdown data

          // Mark form as pristine and untouched to reset validation states visually
          this.examForm.markAsPristine();
          this.examForm.markAsUntouched();

          // Optional: Scroll to top or show success message prominently
        },
        error: (err) => {
          // Error is handled by handleError, but you could add specific UI updates here if needed
          console.error("Submission failed:", err);
          // this.errorMessage is already set by handleError
        }
      });
  }

  goBack(): void {
    this.backClicked.emit();
  }

  // Centralized Error Handling
  private handleError = (error: HttpErrorResponse) => {
    // Ensure loading/submitting flags are reset on error
    this.isSubmitting = false;
    this.isLoadingCourses = false;
    this.isLoadingLessons = false;

    let errorMsg = 'An unknown error occurred.'; // Default message

    if (error.status === 0 || error.error instanceof ProgressEvent) {
        // Network error (offline, DNS error, CORS issue sometimes manifests here)
        errorMsg = 'Network error or server unavailable. Please check your connection and try again.';
         console.error('Network/CORS Error:', error);
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error (e.g., Angular error)
      errorMsg = `Client error: ${error.error.message}`;
      console.error('Client Error:', error.error);
    } else {
      // Backend returned an error response (4xx or 5xx)
      errorMsg = `Server error (${error.status}): `;
      if (error.error) {
         try {
           // Try to parse backend error details (common formats)
           const errorBody = (typeof error.error === 'string') ? JSON.parse(error.error) : error.error;
           // Look for common error structures (ASP.NET Core validation, problem details, simple message)
           const errorDetails = errorBody.errors || errorBody.title || errorBody.message || errorBody;
           if (typeof errorDetails === 'object') {
             // Handle validation errors (often objects with field names)
             const messages = Object.values(errorDetails).flat(); // Flatten arrays of errors per field
             errorMsg += messages.join(' ');
           } else {
             errorMsg += String(errorDetails); // Append string error message
           }
         } catch (e) {
           // If parsing fails or error.error is just a simple string
           errorMsg += (typeof error.error === 'string' ? error.error : 'Could not parse error details.');
         }
      } else {
        errorMsg += `${error.statusText || 'Unknown Server Error'}`; // Fallback to status text
      }
       console.error(`Backend Error (Status ${error.status}):`, error.error); // Log the raw error body
    }

    this.errorMessage = errorMsg; // Display the formatted error message to the user
    return throwError(() => new Error(errorMsg)); // Propagate as an Observable error
  }

  // Template helper for easy access to form controls in HTML
  get f() { return this.examForm.controls; }
}