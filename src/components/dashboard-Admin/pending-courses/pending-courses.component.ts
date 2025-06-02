import { Component, OnInit, OnDestroy, inject } from '@angular/core'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators'; 
import { RouterLink } from '@angular/router';

// Interface for the course data
interface PendingCourse {
  courseId: number;
  courseTitle: string;
  logo: string; 
  price: number;
  teacherId: string;
}


interface ApproveResponse {
  message: string;
}

@Component({
  selector: 'app-pending-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './pending-courses.component.html',
  styleUrls: ['./pending-courses.component.css']
})
export class PendingCoursesComponent implements OnInit, OnDestroy { 

  // API Endpoints
  readonly API_ADMIN_BASE_URL = 'https://estigo.runasp.net/api/Admin/admin/';
  readonly API_COURSE_BASE_URL = 'https://estigo.runasp.net/api/Course'; 
  readonly API_URL_PENDING = `${this.API_ADMIN_BASE_URL}pending-courses`;
  readonly API_URL_APPROVE = `${this.API_ADMIN_BASE_URL}approve/`; 

  // Component State
  courses: PendingCourse[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  processingCourses = new Set<number>(); // Tracks both approve/reject


  constructor(private http: HttpClient) { } // Keep if not using inject

  // Subject for managing subscriptions
  private componentDestroyed$ = new Subject<void>();

  ngOnInit(): void {
    this.fetchPendingCourses();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(); // Signal destruction
    this.componentDestroyed$.complete(); // Complete the subject
  }

  fetchPendingCourses(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<PendingCourse[]>(this.API_URL_PENDING)
      .pipe(takeUntil(this.componentDestroyed$)) // Auto-unsubscribe
      .subscribe({
        next: (data) => {
          this.courses = data;
          this.isLoading = false;
          console.log('Pending courses fetched:', this.courses.length);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching pending courses:', err);
          this.error = `Failed to load courses. ${err.status === 0 ? 'Cannot connect to server.' : err.statusText}. Please try again.`;
          this.isLoading = false;
          this.courses = [];
        }
      });
  }

  // --- Action Methods ---

  approveCourse(courseId: number): void {
    if (this.processingCourses.has(courseId)) return;

    this.processingCourses.add(courseId);
    const apiUrl = `${this.API_URL_APPROVE}${courseId}`;
    console.log(`Attempting to approve course ${courseId} at ${apiUrl}`);

    this.http.post<ApproveResponse>(apiUrl, null)
      .pipe(
        finalize(() => {
          this.processingCourses.delete(courseId); // Ensure cleanup
        }),
        takeUntil(this.componentDestroyed$) // Auto-unsubscribe
      )
      .subscribe({
        next: (response) => {
          console.log(`Course ${courseId} approved successfully:`, response.message);
          this.courses = this.courses.filter(course => course.courseId !== courseId);
          // alert(`Course ${courseId} approved successfully.`); // Optional feedback
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error approving course ${courseId}:`, err);
          alert(`Failed to approve course ${courseId}. ${err.error?.message || err.statusText || 'Please try again.'}`);
        }
      });
  }

  // --- Updated rejectCourse Method ---
  rejectCourse(courseId: number, event: Event): void {
    event.stopPropagation(); // Stop the event from propagating to the parent element

    // Prevent multiple clicks while processing
    if (this.processingCourses.has(courseId)) {
      return;
    }

    // Confirmation dialog before deleting
    if (!confirm(`Are you sure you want to reject (delete) course ID ${courseId}? This action cannot be undone.`)) {
      return; // Stop if user clicks Cancel
    }

    this.processingCourses.add(courseId); // Mark as processing
    const apiUrl = `${this.API_COURSE_BASE_URL}/${courseId}`; // Construct DELETE URL
    console.log(`Attempting to reject (delete) course ${courseId} at ${apiUrl}`);


    this.http.delete<void>(apiUrl)
      .pipe(
        finalize(() => {
          this.processingCourses.delete(courseId); 
        }),
        takeUntil(this.componentDestroyed$)
      )
      .subscribe({
        next: () => {
          console.log(`Course ${courseId} rejected (deleted) successfully`);
          this.courses = this.courses.filter(course => course.courseId !== courseId);
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error rejecting (deleting) course ${courseId}:`, err);
          // Show an error message to the user
          let errorMsg = `Failed to reject course ${courseId}. `;
          if (err.status === 404) {
            errorMsg += 'Course not found.';
          } else {
            errorMsg += `${err.error?.message || err.statusText || 'Please try again.'}`;
          }
          alert(errorMsg);
        }
      });
  }
  // --- End Updated rejectCourse Method ---

  // Helper method for template to check if a course is being processed
  isProcessing(courseId: number): boolean {
    return this.processingCourses.has(courseId);
  }
}