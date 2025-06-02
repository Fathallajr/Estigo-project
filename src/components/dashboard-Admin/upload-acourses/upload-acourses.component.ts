import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, finalize, throwError } from 'rxjs';

// --- Interfaces ---
export interface Teacher {
  id: string;
  name: string;
  subject: string;
}
export interface Category {
  id: number;
  name: string;
}
export interface CoursePayload {
    courseId: number;
    courseTitle: string;
    description: string;
    logo: string;
    price: number;
    catogryid: number;
    teacherId: string;
}



@Component({
  selector: 'app-upload-acourses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './upload-acourses.component.html',
  styleUrl: './upload-acourses.component.css'
})
export class UploadAcoursesComponent implements OnInit {
  @Output() backClicked = new EventEmitter<void>();

  // --- Injected Services ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // --- Component State ---
  teachers: Teacher[] = [];
  categories: Category[] = [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Physics" },
    { id: 3, name: "Biology" },
    { id: 4, name: "Chemistry" },
    { id: 5, name: "English" },
  ];
  courseForm!: FormGroup;
  isLoadingTeachers = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFileName: string | null = null; // To display the chosen filename

  // --- API URLs & Constants ---
  private readonly teachersApiUrl = 'https://estigo.runasp.net/api/Admin/AllTeacher'; 
  private readonly coursesApiUrl = 'https://estigo.runasp.net/api/Course'; 
  private readonly imageBaseUrl = 'https://estigo.runasp.net/'; 

  ngOnInit(): void {
    this.initializeForm();
    this.fetchTeachers();
  }

  initializeForm(): void {
    this.courseForm = this.fb.group({
      courseTitle: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      logo: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      teacherId: ['', Validators.required],
      catogryid: [null, Validators.required]
    });
  }

  fetchTeachers(): void {
    this.isLoadingTeachers = true;
    this.errorMessage = null;
    this.http.get<Teacher[]>(this.teachersApiUrl)
      .pipe(
        catchError(this.handleError),
        finalize(() => this.isLoadingTeachers = false)
      )
      .subscribe({
        next: (data) => { this.teachers = data; },
        error: (err) => { /* handled by catchError */ }
      });
  }

  //  handle file selection 
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedFileName = file.name; 
      this.courseForm.patchValue({
        logo: file.name
      });
      this.courseForm.controls['logo'].markAsTouched();
      console.log('Selected filename:', file.name);
    } else {

    }
  }


  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly, including selecting a logo file.';
      return;
    }

    this.isSubmitting = true;
    const formValue = this.courseForm.value;

    // *** Construct the full logo URL using the filename from the form control ***
    const fullLogoUrl = this.imageBaseUrl + formValue.logo.trim(); 

    const payload: CoursePayload = {
      courseId: 0,
      courseTitle: formValue.courseTitle,
      description: formValue.description,
      logo: fullLogoUrl, 
      price: Number(formValue.price),
      catogryid: Number(formValue.catogryid),
      teacherId: formValue.teacherId,
    };

    console.log('Submitting payload:', payload);

    this.http.post(this.coursesApiUrl, payload)
       .pipe(
        catchError(this.handleError),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Course created successfully:', response);
          this.successMessage = 'Course uploaded successfully!';
          this.courseForm.reset(); 
          this.selectedFileName = null; 
          this.courseForm.markAsPristine();
          this.courseForm.markAsUntouched();
        },
        error: (err) => { /* handled by catchError */ }
      });
  }

  goBack(): void {
    this.backClicked.emit();
  }

  private handleError = (error: HttpErrorResponse) => {
    this.isSubmitting = false;
    this.isLoadingTeachers = false;
    let errorMsg = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Client error: ${error.error.message}`;
    } else {
       errorMsg = `Server error: ${error.status} - ${error.statusText || ''}. `;
       if (error.error && typeof error.error === 'object') {
         errorMsg += JSON.stringify(error.error.errors || error.error);
       } else if (error.error) {
         errorMsg += error.error;
       }
    }
    console.error(error);
    this.errorMessage = errorMsg;
    return throwError(() => new Error(errorMsg));
  }

  get f() { return this.courseForm.controls; }
}