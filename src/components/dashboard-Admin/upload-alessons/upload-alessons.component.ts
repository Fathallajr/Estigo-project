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
  isLive: boolean; // Added
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
  private readonly videoBaseUrl = 'https://estigo.tryasp.net/'; // Used for non-live videos

  ngOnInit(): void {
    this.initializeForm();
    this.fetchCourses();

    // Subscribe to isLive changes to update validators
    this.lessonForm.get('isLive')?.valueChanges.subscribe(isLiveValue => {
      const videoFileControl = this.lessonForm.get('videoFile');
      const liveVideoUrlControl = this.lessonForm.get('liveVideoUrl');

      if (isLiveValue) {
        videoFileControl?.clearValidators();
        videoFileControl?.setValue(null); // Clear any selected file info
        this.selectedVideoFileName = null; // Clear displayed filename

        liveVideoUrlControl?.setValidators([
          Validators.required,
          Validators.pattern(/^(ftp|http|https|rtsp|mms):\/\/[^ "]+$/) // Basic URL pattern
        ]);
      } else {
        liveVideoUrlControl?.clearValidators();
        liveVideoUrlControl?.setValue(''); // Clear URL

        videoFileControl?.setValidators(Validators.required);
      }
      videoFileControl?.updateValueAndValidity();
      liveVideoUrlControl?.updateValueAndValidity();
    });
  }

  initializeForm(): void {
    this.lessonForm = this.fb.group({
      courseId: [null, Validators.required],
      lessonTitle: ['', [Validators.required, Validators.minLength(3)]],
      lessonDescription: ['', Validators.required],
      lessonContent: ['', Validators.required],
      isLive: [false], // Default to not live
      videoFile: [null, Validators.required], // For file input (name/validation), required by default
      liveVideoUrl: [''] // For live URL, validators set dynamically
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

  // Handle video file selection (for non-live videos)
  onVideoFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedVideoFileName = file.name;
      this.lessonForm.patchValue({
        videoFile: file.name // Store filename for validation state
      });
      this.lessonForm.controls['videoFile'].markAsTouched();
      console.log('Selected video filename:', file.name);
    } else {
      this.selectedVideoFileName = null;
      this.lessonForm.patchValue({ videoFile: null });
    }
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly.';
       // More specific error if possible
      if (this.f['isLive'].value && this.f['liveVideoUrl'].invalid) {
        this.errorMessage = 'Please provide a valid Live Video URL.';
      } else if (!this.f['isLive'].value && this.f['videoFile'].invalid) {
        this.errorMessage = 'Please select a video file.';
      }
      return;
    }

    this.isSubmitting = true;
    const formValue = this.lessonForm.value;
    let lessonVideoValue: string;

    if (formValue.isLive) {
      lessonVideoValue = formValue.liveVideoUrl.trim();
    } else {
      if (!this.selectedVideoFileName) {
        // This should ideally be caught by form validation, but as a safeguard:
        this.errorMessage = "Video file is required and was not selected.";
        this.isSubmitting = false;
        return;
      }
      lessonVideoValue = this.videoBaseUrl + this.selectedVideoFileName.trim();
    }

    const payload: LessonPayload = {
      lessonTitle: formValue.lessonTitle,
      lessonDescription: formValue.lessonDescription,
      lessonContent: formValue.lessonContent,
      lessonVideo: lessonVideoValue,
      isLive: formValue.isLive,
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
          this.lessonForm.reset({
            courseId: null,
            lessonTitle: '',
            lessonDescription: '',
            lessonContent: '',
            isLive: false, // Reset to default
            videoFile: null,
            liveVideoUrl: ''
          });
          this.selectedVideoFileName = null;
          // valueChanges on 'isLive' will re-apply validators for the reset 'false' state.
          this.lessonForm.markAsPristine();
          this.lessonForm.markAsUntouched();
        },
      });
  }

  goBack(): void {
    this.backClicked.emit();
  }

  private handleError = (error: HttpErrorResponse) => {
    this.isSubmitting = false;
    this.isLoadingCourses = false;
    let errorMsg = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Client error: ${error.error.message}`;
    } else {
      errorMsg = `Server error: ${error.status} - ${error.statusText || ''}. `;
       if (error.error && typeof error.error === 'object') {
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

  get f() { return this.lessonForm.controls; }
}