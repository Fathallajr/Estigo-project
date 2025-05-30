import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface Course {
  courseId: number;
  courseTitle: string;
  description?: string;
  logo?: string;
  price?: number;
  available?: boolean;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
  catogryid?: number; // Still part of the interface and data model
  teacherId?: string;
}

// Category interface and array removed

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './courses-list.component.html',
  styleUrls: ['./courses-list.component.css']
})
export class CoursesListComponent implements OnInit, OnDestroy {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = 'https://localhost:5071/api/Course';
  readonly baseImageUrl = 'https://estigo.tryasp.net/';

  courses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  deletingIds = new Set<number>();
  updatingIds = new Set<number>();

  isUpdatePanelVisible = false;
  selectedCourseForUpdate: Course | null = null;
  updateForm!: FormGroup;
  isSubmittingUpdate = false;
  logoFileName: string | null = null;

  // categories array removed

  private deleteTrigger = new Subject<{ courseId: number }>();
  private componentDestroyed$ = new Subject<void>();

  @ViewChild('logoFileInput') logoFileInput?: ElementRef<HTMLInputElement>;

  constructor() {
    this.initUpdateForm();
  }

  ngOnInit(): void {
    this.fetchCourses();
    this.handleDeletions();
    // Removed valueChanges subscription for catogryid
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  private initUpdateForm(): void {
    this.updateForm = this.fb.group({
      courseTitle: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      // catogryid form control removed
    });
  }

  fetchCourses(): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<Course[]>(this.apiUrl)
      .pipe(
        tap(data => { this.courses = data; }),
        catchError(err => this.handleError(err, 'fetch courses')),
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.componentDestroyed$)
      ).subscribe();
  }

  triggerDeleteCourse(courseId: number): void {
    if (this.isUpdatePanelVisible) return;
    if (confirm(`Are you sure you want to delete course ID ${courseId}?`)) {
      this.deleteTrigger.next({ courseId });
    }
  }

  private handleDeletions(): void {
    this.deleteTrigger.pipe(
      tap(({ courseId }) => {
        this.deletingIds.add(courseId);
        this.error = null;
      }),
      switchMap(({ courseId }) =>
        this.http.delete<void>(`${this.apiUrl}/${courseId}`).pipe(
          tap(() => { this.courses = this.courses.filter(c => c.courseId !== courseId); }),
          catchError(err => this.handleError(err, `delete course ID ${courseId}`)),
          finalize(() => { this.deletingIds.delete(courseId); })
        )
      ),
      takeUntil(this.componentDestroyed$)
    ).subscribe();
  }

  openUpdatePanel(course: Course): void {
    if (this.isDeleting(course.courseId) || this.isUpdating(course.courseId)) return;

    this.selectedCourseForUpdate = { ...course };
    this.updateForm.reset();
    this.logoFileName = null;
    if (this.logoFileInput?.nativeElement) {
      this.logoFileInput.nativeElement.value = '';
    }

    this.updateForm.patchValue({
      courseTitle: this.selectedCourseForUpdate.courseTitle,
      description: this.selectedCourseForUpdate.description || '',
      price: this.selectedCourseForUpdate.price === undefined ? 0 : this.selectedCourseForUpdate.price,
      // catogryid removed from patchValue
    });

    this.isUpdatePanelVisible = true;
    this.error = null;
    this.cdr.detectChanges();
  }

  closeUpdatePanel(): void {
    this.isUpdatePanelVisible = false;
    this.selectedCourseForUpdate = null;
    this.updateForm.reset();
    this.logoFileName = null;
    if (this.logoFileInput?.nativeElement) {
      this.logoFileInput.nativeElement.value = '';
    }
    this.isSubmittingUpdate = false;
    this.cdr.detectChanges();
  }

  onLogoFileChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.logoFileName = element.files[0].name;
    } else {
      this.logoFileName = null;
    }
  }

  onUpdateSubmit(): void {
    if (!this.selectedCourseForUpdate) {
      this.error = 'Cannot submit update: No course selected.';
      return;
    }
    this.updateForm.updateValueAndValidity(); // Good practice before checking validity

    if (this.updateForm.invalid) {
      console.warn('Update form is invalid. Errors:', this.updateForm.errors);
      this.updateForm.markAllAsTouched();
      return;
    }

    this.isSubmittingUpdate = true;
    this.updatingIds.add(this.selectedCourseForUpdate.courseId);
    this.error = null;

    const formValues = this.updateForm.value; // Will not contain catogryid

    let finalLogoUrl = this.selectedCourseForUpdate.logo;
    if (this.logoFileName) {
      const sanitizedFileName = this.logoFileName.replace(/[^a-zA-Z0-9_.\-]/g, '_');
      finalLogoUrl = `${this.baseImageUrl}${sanitizedFileName}`;
    }

    const payload: Course = {
      // Preserve all existing non-form values from selectedCourseForUpdate
      courseId: this.selectedCourseForUpdate.courseId,
      teacherId: this.selectedCourseForUpdate.teacherId,
      createdAt: this.selectedCourseForUpdate.createdAt,
      status: this.selectedCourseForUpdate.status,
      available: this.selectedCourseForUpdate.available === undefined ? true : this.selectedCourseForUpdate.available,
      catogryid: this.selectedCourseForUpdate.catogryid, // Preserve original catogryid

      // Overwrite with form values
      courseTitle: formValues.courseTitle,
      description: formValues.description,
      price: formValues.price,
      // catogryid is not taken from formValues

      logo: finalLogoUrl,
      updatedAt: new Date().toISOString()
    };

    console.log('Submitting update payload:', payload);

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json-patch+json' })
    };

    this.http.put<void>(`${this.apiUrl}/${payload.courseId}`, payload, httpOptions)
      .pipe(
        tap(() => {
          const index = this.courses.findIndex(c => c.courseId === payload.courseId);
          if (index !== -1) {
            this.courses[index] = { ...payload };
            this.courses = [...this.courses];
          }
          this.closeUpdatePanel();
        }),
        catchError(err => this.handleError(err, `update course ID ${payload.courseId}`)),
        finalize(() => {
          this.isSubmittingUpdate = false;
          this.updatingIds.delete(payload.courseId);
          this.cdr.detectChanges();
        })
      ).subscribe();
  }

  isDeleting(courseId: number): boolean { return this.deletingIds.has(courseId); }
  isUpdating(courseId: number): boolean { return this.updatingIds.has(courseId); }

  getCurrentLogoFilename(logoUrl: string | undefined): string | null {
    if (!logoUrl) return null;
    if (logoUrl.startsWith(this.baseImageUrl)) {
      return logoUrl.substring(this.baseImageUrl.length);
    }
    const parts = logoUrl.split('/');
    return parts.pop() || logoUrl;
  }

  private handleError(error: HttpErrorResponse, context: string): Observable<null> {
    console.error(`Error during ${context}:`, error);
    let userMessage = `Failed to ${context}. `;
    if (error.status === 0) userMessage += 'Network error or server unavailable.';
    else if (error.status === 400) {
        userMessage += `Bad request: ${error.error?.title || error.message || 'Please check data.'}`;
        if (error.error?.errors) userMessage += ` Details: ${JSON.stringify(error.error.errors)}`;
    }
    else if (error.status === 404) userMessage += 'Resource not found.';
    else if (error.error && typeof error.error === 'string' && error.error.length < 200) userMessage += error.error;
    else if (error.message) userMessage += error.message;
    else userMessage += 'Unexpected error.';
    
    this.error = userMessage;
    this.isLoading = false;
    this.cdr.detectChanges();
    return of(null);
  }
}