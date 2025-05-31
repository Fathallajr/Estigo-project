import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Added HttpErrorResponse
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, finalize, throwError } from 'rxjs'; // Added for error handling

interface UserData { id: string; }
interface TeacherCourse { courseId: number; courseTitle: string; }

// Updated NewLesson to include isLive
interface NewLesson {
  lessonTitle: string;
  lessonDescription: string;
  lessonContent: string;
  lessonVideo: string; // This will be the video file name OR the live URL
  isLive: boolean;     // Added
}

// LessonPayload now implicitly includes isLive from NewLesson
interface LessonPayload extends NewLesson {
  lessonId: number; // Typically set to 0 for new lessons, backend assigns actual ID
  courseId: number;
}

@Component({
  selector: 'app-upload-lesson',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upload-lesson.component.html',
  styleUrls: ['./upload-lesson.component.css']
})
export class UploadLessonComponent implements OnInit {

  // --- Properties ---
  teacherCourses: TeacherCourse[] = [];
  selectedCourseId: number | null = null;

  // Initialize lessonData with isLive
  lessonData: NewLesson = {
    lessonTitle: '',
    lessonDescription: '',
    lessonContent: '',
    lessonVideo: '',     // Will hold filename or live URL
    isLive: false        // Default to not live
  };
  liveVideoUrl: string = ''; // Separate property for the live URL input field

  teacherId: string | null = null;
  selectedVideoFileName: string | null = null; // To display selected file name

  // Loading/Messaging states
  isFetchingCourses: boolean = false;
  isSubmitting: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // API Endpoints
  readonly COURSES_API_URL = 'https://estigo.tryasp.net/api/Teacher/teacher-courses';
  readonly LESSON_API_URL = 'https://estigo.tryasp.net/api/Lesson';
  readonly VIDEO_BASE_URL = 'https://estigo.tryasp.net/'; // For non-live video files

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData: UserData = JSON.parse(userDataString);
        this.teacherId = userData.id || null;
        if (this.teacherId) {
          this.fetchTeacherCourses();
        } else {
          this.errorMessage = "Teacher ID not found in local storage.";
        }
      } else {
        this.errorMessage = "User data not found in local storage.";
      }
    } catch (e) {
      console.error("Error getting teacher ID", e);
      this.errorMessage = "Error processing user data.";
    }
  }

  fetchTeacherCourses(): void {
    if (!this.teacherId) return;
    this.isFetchingCourses = true;
    this.errorMessage = null; // Clear previous errors
    const url = `${this.COURSES_API_URL}?teacherId=${this.teacherId}`;

    this.http.get<TeacherCourse[]>(url)
      .pipe(
        catchError(this.handleError.bind(this, 'Failed to fetch courses')), // Added error handling
        finalize(() => this.isFetchingCourses = false)
      )
      .subscribe(courses => {
        this.teacherCourses = courses;
        console.log("Courses fetched:", courses);
        if (courses.length === 0) {
            this.errorMessage = "No courses found for this teacher. Please create a course first.";
        }
      });
  }

  onVideoFileSelected(event: Event): void {
    // This is for non-live video files
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedVideoFileName = file.name;
      // lessonData.lessonVideo will be set in onSubmit based on isLive
    } else {
      this.selectedVideoFileName = null;
    }
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.selectedCourseId || !this.lessonData.lessonTitle.trim() || !this.teacherId) {
      this.errorMessage = "Please select a course and enter all required lesson details.";
      return;
    }

    // Determine lessonVideo value based on isLive
    let finalLessonVideoUrl: string;
    if (this.lessonData.isLive) {
      if (!this.liveVideoUrl.trim() || !this.isValidUrl(this.liveVideoUrl.trim())) {
        this.errorMessage = "Please enter a valid URL for the live video link.";
        return;
      }
      finalLessonVideoUrl = this.liveVideoUrl.trim();
    } else {
      if (!this.selectedVideoFileName) {
        this.errorMessage = "Please select a video file for the lesson.";
        return;
      }
      finalLessonVideoUrl = this.VIDEO_BASE_URL + this.selectedVideoFileName;
    }

    const payload: LessonPayload = {
      lessonId: 0, // Backend will assign
      courseId: this.selectedCourseId,
      lessonTitle: this.lessonData.lessonTitle.trim(),
      lessonDescription: this.lessonData.lessonDescription.trim(),
      lessonContent: this.lessonData.lessonContent.trim(),
      lessonVideo: finalLessonVideoUrl,
      isLive: this.lessonData.isLive
    };

    this.isSubmitting = true;
    console.log("Submitting Lesson Payload:", payload);

    this.http.post(this.LESSON_API_URL, payload)
      .pipe(
        catchError(this.handleError.bind(this, 'Failed to submit lesson')), // Added error handling
        finalize(() => this.isSubmitting = false)
      )
      .subscribe((response) => {
         console.log("Lesson submitted successfully:", response);
         this.successMessage = "Lesson submitted successfully!";
         this.resetForm();
      });
  }

  resetForm(): void {
    this.lessonData = {
      lessonTitle: '',
      lessonDescription: '',
      lessonContent: '',
      lessonVideo: '',
      isLive: false
    };
    this.liveVideoUrl = '';
    this.selectedVideoFileName = null;
    // Optionally reset selectedCourseId if desired, or keep it
    // this.selectedCourseId = null;
  }

  // Helper for URL validation (basic)
  isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return urlString.startsWith('http://') || urlString.startsWith('https://') || urlString.startsWith('rtsp://') || urlString.startsWith('mms://');
    } catch (_) {
      return false;
    }
  }

  // Centralized error handler
  private handleError(contextMessage: string, error: HttpErrorResponse) {
    this.isSubmitting = false; // Ensure submitting flag is reset
    this.isFetchingCourses = false; // Ensure fetching flag is reset

    console.error(`${contextMessage}:`, error);
    let userMessage = `${contextMessage}. `;
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      userMessage += `Client error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      userMessage += `Server error: ${error.status} - ${error.statusText || ''}. `;
      if (error.error && typeof error.error === 'string') {
        userMessage += error.error;
      } else if (error.error && error.error.title) { // For ASP.NET Core problem details
        userMessage += error.error.title;
      } else if (error.error && typeof error.error === 'object') {
        // Try to extract specific validation errors if backend sends them
        const errors = error.error.errors;
        if (errors) {
            userMessage += Object.values(errors).flat().join(' ');
        } else {
            userMessage += 'Please check details and try again.';
        }
      }
    }
    this.errorMessage = userMessage;
    return throwError(() => new Error(userMessage));
  }
}