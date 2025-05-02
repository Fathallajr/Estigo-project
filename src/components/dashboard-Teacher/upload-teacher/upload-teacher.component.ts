import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Interface for user data in local storage
interface UserData {
  id: string;
  // other fields if needed
}

@Component({
  selector: 'app-upload-teacher',
  standalone: true,
  imports: [FormsModule, CommonModule,], // Basic imports
  templateUrl: './upload-teacher.component.html',
  styleUrls: ['./upload-teacher.component.css'] // Use styleUrls (plural)
})
export class UploadTeacherComponent implements OnInit {

  // Form data model
  courseData = {
    courseTitle: '',
    description: '',
    price: null as number | null,
    catogryid: null as number | null, // Matches API 'catogryid' spelling
  };
  selectedFile: File | null = null;
  logoFileName: string = ''; // To store the filename for the payload

  // State
  isLoading = false;
  feedbackMessage: string | null = null;
  isError = false;
  teacherId: string | null = null;

  readonly API_URL = 'https://estigo.tryasp.net/api/Teacher/add-course';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Attempt to get Teacher ID from local storage
    try {
      const userDataString = localStorage.getItem('userData'); // Adjust key if needed
      if (userDataString) {
        const userData: UserData = JSON.parse(userDataString);
        this.teacherId = userData.id;
      }
    } catch (error) {
      console.error('Error retrieving teacher data:', error);
      this.feedbackMessage = 'Could not get teacher info. Please log in again.';
      this.isError = true;
    }

    if (!this.teacherId) {
        this.feedbackMessage = 'Teacher ID not found. Please log in.';
        this.isError = true;
        // Prevent form submission if no teacher ID
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.logoFileName = 'https://estigo.tryasp.net/' + this.selectedFile.name;
      this.feedbackMessage = null; // Clear feedback on new file selection
      this.isError = false;
    } else {
      this.selectedFile = null;
      this.logoFileName = '';
    }
  }

  isFormValid(): boolean {
    return !!this.courseData.courseTitle &&
           !!this.courseData.description &&
           this.courseData.price !== null && this.courseData.price >= 0 &&
           this.courseData.catogryid !== null &&
           !!this.selectedFile &&
           !!this.teacherId;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
        this.feedbackMessage = 'Please fill all required fields and select a logo.';
        this.isError = true;
        return;
    }

    this.isLoading = true;
    this.feedbackMessage = null;
    this.isError = false;


    const payload = {
      courseId: 0, 
      courseTitle: this.courseData.courseTitle,
      description: this.courseData.description,
      logo: this.logoFileName, 
      price: this.courseData.price!, 
      available: true,
      catogryid: this.courseData.catogryid!, 
      teacherId: this.teacherId!      
    };

    // Send request
    this.http.post(this.API_URL, payload).subscribe({
      next: () => {
        this.feedbackMessage = 'Course added successfully!';
        this.isError = false;
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        console.error('API Error:', error);
        this.feedbackMessage = `Error: ${error.error?.message || 'Could not add course.'} (Status: ${error.status})`;
        this.isError = true;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.courseData = {
      courseTitle: '',
      description: '',
      price: null,
      catogryid: null,
    };
    this.selectedFile = null;
    this.logoFileName = '';
    const fileInput = document.getElementById('logoFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; 
    }
  }
}