
import { Component, OnInit, OnDestroy, inject } from '@angular/core'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


// --- Define the Interface directly in this file ---
export interface Course {
  courseId: number;
  courseTitle: string;
}
// --- End Interface Definition ---

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './courses-list.component.html',
  styleUrl: './courses-list.component.css' 
})
export class CoursesListComponent implements OnInit, OnDestroy { 

  private http = inject(HttpClient);
  private readonly apiUrl = 'https://estigo.tryasp.net/api/Course'; 

  // --- State Management ---
  courses: Course[] = []; 
  isLoading = true;
  error: string | null = null;
  deletingIds = new Set<number>();

  private deleteTrigger = new Subject<{ courseId: number }>();
  private componentDestroyed$ = new Subject<void>();

  ngOnInit(): void {
    this.fetchCourses();
    this.handleDeletions();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  fetchCourses(): void {
    this.isLoading = true;
    this.error = null;
    this.courses = [];

    this.http.get<Course[]>(`${this.apiUrl}/AdminCourses`) 
      .pipe(
        tap(data => {
          this.courses = data;
          console.log('Courses fetched successfully');
        }),
        catchError(err => this.handleError(err, 'fetch courses')),
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.componentDestroyed$)
      ).subscribe();
  }

  triggerDeleteCourse(courseId: number): void {
    if (confirm(`Are you sure you want to delete course ID ${courseId}? This action cannot be undone.`)) {
      this.deleteTrigger.next({ courseId });
    }
  }

  private handleDeletions(): void {
    this.deleteTrigger.pipe(
      tap(({ courseId }) => {
        if (!this.deletingIds.has(courseId)) {
          this.deletingIds.add(courseId);
          this.error = null;
        }
      }),
      switchMap(({ courseId }) => {
         if (!this.deletingIds.has(courseId)) return of(null); 

         const deleteUrl = `${this.apiUrl}/${courseId}`;
         return this.http.delete<void>(deleteUrl).pipe(
           tap(() => {
             console.log(`Course ${courseId} deleted successfully`);
             this.courses = this.courses.filter(c => c.courseId !== courseId);
           }),
           catchError(err => this.handleError(err, `delete course ID ${courseId}`)),
           finalize(() => {
             this.deletingIds.delete(courseId);
           })
         );
      }),
      takeUntil(this.componentDestroyed$)
    ).subscribe();
  }

  isDeleting(courseId: number): boolean {
    return this.deletingIds.has(courseId);
  }

  private handleError(error: HttpErrorResponse, context: string): Observable<null> {
    console.error(`Error during ${context}:`, error);
    let userMessage = `Failed to ${context}. `;
    if (error.status === 0) {
      userMessage += 'Network error or server is unavailable.';
    } else if (error.status === 404) {
      userMessage += 'The requested item was not found.';
    } else if (error.error && typeof error.error === 'string') {
       userMessage += error.error;
    } else {
       userMessage += 'Please try again later.';
    }
    this.error = userMessage;
    this.isLoading = false;
    return of(null);
  }
}