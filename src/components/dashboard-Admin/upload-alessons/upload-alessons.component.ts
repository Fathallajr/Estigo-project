import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { catchError, finalize, throwError } from 'rxjs';

// --- Interfaces ---
export interface AdminCourse {
  courseId: number;
  courseTitle: string;
  description?: string | null;
}

export interface LessonPayload {
  lessonTitle: string;
  lessonDescription: string;
  lessonContent: string;
  lessonVideo: string; 
  courseId: number;
}


@Component({
  selector: 'app-upload-alessons',
  standalone: true, 
  imports: [
    CommonModule, // Needed for *ngIf, *ngFor etc.
    ReactiveFormsModule // Needed for reactive forms
  ],
  templateUrl: './upload-alessons.component.html',
  styleUrl: './upload-alessons.component.css'
})
export class UploadAlessonsComponent implements OnInit {
  @Output() backClicked = new EventEmitter<void>();

  // --- Injected Services ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // --- Component State ---
  courses: AdminCourse[] = [];
  lessonForm!: FormGroup;
  isLoadingCourses = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedVideoFileName: string | null = null; 

  // --- API URLs & Constants ---
  private readonly coursesApiUrl = 'https://estigo.tryasp.net/api/Course/AdminCourses';
  private readonly lessonsApiUrl = 'https://estigo.tryasp.net/api/Lesson';
  private readonly videoBaseUrl = 'https://estigo.tryasp.net/';

  ngOnInit(): void {
    this.initializeForm();
    this.fetchCourses();
  }

  initializeForm(): void {
    this.lessonForm = this.fb.group({
      courseId: [null, Validators.required], 
      lessonTitle: ['', [Validators.required, Validators.minLength(3)]],
      lessonDescription: ['', Validators.required],
      lessonContent: ['', Validators.required],    
      lessonVideo: ['', Validators.required]
    });
  }

  fetchCourses(): void {
    this.isLoadingCourses = true;
    this.errorMessage = null;
    this.http.get<AdminCourse[]>(this.coursesApiUrl)
      .pipe(
        catchError(this.handleError),
        finalize(() => this.isLoadingCourses = false)
      )
      .subscribe({
        next: (data) => {
          this.courses = data;
          console.log('Courses fetched:', this.courses);
          if (this.courses.length === 0) {
            this.errorMessage = 'No courses found to assign lessons to. Please create a course first.';
          }
        },
      });
  }

  // Handle video file selection
  onVideoFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedVideoFileName = file.name; 
      this.lessonForm.patchValue({
        lessonVideo: file.name
      });
      this.lessonForm.controls['lessonVideo'].markAsTouched();
      console.log('Selected video filename:', file.name);
    } else {
      this.selectedVideoFileName = null;
      this.lessonForm.patchValue({ lessonVideo: '' });
    }
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly, including selecting a video file.';
      return;
    }

    this.isSubmitting = true;
    const formValue = this.lessonForm.value;

    const fullVideoUrl = this.videoBaseUrl + formValue.lessonVideo.trim();

   
    const payload: LessonPayload = {
      lessonTitle: formValue.lessonTitle,
      lessonDescription: formValue.lessonDescription,
      lessonContent: formValue.lessonContent,
      lessonVideo: fullVideoUrl, 
      courseId: Number(formValue.courseId), 

    };

    console.log('Submitting lesson payload:', payload);

    this.http.post(this.lessonsApiUrl, payload)
      .pipe(
        catchError(this.handleError),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Lesson created successfully:', response);
          this.successMessage = 'Lesson uploaded successfully!';
          this.lessonForm.reset();
          this.selectedVideoFileName = null; 
          this.lessonForm.patchValue({ courseId: null });
          this.lessonForm.markAsPristine();
          this.lessonForm.markAsUntouched();
        },

      });
  }

  goBack(): void {
    this.backClicked.emit();
  }

  // Centralized Error Handling 
  private handleError = (error: HttpErrorResponse) => {
    this.isSubmitting = false;
    this.isLoadingCourses = false; 
    let errorMsg = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMsg = `Client error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code.
      errorMsg = `Server error: ${error.status} - ${error.statusText || ''}. `;
       if (error.error && typeof error.error === 'object') {
         // Try to extract more details if the error is an object
          errorMsg += JSON.stringify(error.error.errors || error.error);
       } else if (error.error && typeof error.error === 'string') {
          errorMsg += error.error;
       } else if (typeof error.message === 'string') {
          errorMsg += error.message;
       }
    }
    console.error(error);
    this.errorMessage = errorMsg;
    return throwError(() => new Error(errorMsg));
  }

  // Template helper
  get f() { return this.lessonForm.controls; }
}