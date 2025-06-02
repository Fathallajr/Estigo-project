import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// Interface matching the relevant API request structure
interface CourseApiRequest {
  courseTitle: string;
  description: string;
  logo?: string;
  price: number;
  available: boolean;
  catogryid: number;
  teacherId: string;
}

// Interface defining the component's form data model
interface CourseFormData {
  courseTitle: string;
  description: string;
  price: number | null;
  available: boolean;
  catogryid: number | null;
  teacherId: string; 
}


@Component({
  selector: 'app-upload-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule 
  ],
  templateUrl: './upload-courses.component.html',
  styleUrls: ['./upload-courses.component.css']
})
export class UploadCoursesComponent implements OnInit {

  readonly API_URL = 'https://estigo.runasp.net/api/Course';

  // --- Properties for Form Data ---
  courseData: CourseFormData = {
    courseTitle: '',
    description: '',
    price: null,
    available: true,
    catogryid: null,
    teacherId: '' // <--- Initialize as empty string for the input field
  };
  termsAgreed = false;

  logoFile: File | null = null;
  logoFileName = '';
  logoPreviewUrl: string | ArrayBuffer | null = null;

  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {}

  // ngOnInit is no longer needed for hardcoded teacherId
  ngOnInit(): void { }

  // --- Event Handlers for File Inputs (Only Logo) ---
  onLogoFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.logoFile = (fileList && fileList.length > 0) ? fileList[0] : null;
    this.logoFileName = this.logoFile?.name ?? '';
    this.logoPreviewUrl = null;
    if (this.logoFile) {
      const reader = new FileReader();
      reader.onload = () => { this.logoPreviewUrl = reader.result; };
      reader.readAsDataURL(this.logoFile);
    }
  }

  // --- Form Submission Handler ---
  onSubmit(form: NgForm): void {
    // Validation now includes teacherId via form.valid
    if (!form.valid || !this.termsAgreed || !this.logoFile) {
      console.error('Form invalid, terms not agreed, or logo missing.');
      Object.values(form.controls).forEach(control => control.markAsTouched());
      if (!this.logoFile) alert('Please select a logo file.');
      return;
    }

    const formData = new FormData();
    const priceToSend = this.courseData.price ?? 0;
    const categoryIdToSend = this.courseData.catogryid ?? 0;

    formData.append('courseTitle', this.courseData.courseTitle ?? '');
    formData.append('description', this.courseData.description ?? '');
    formData.append('price', priceToSend.toString());
    formData.append('available', this.courseData.available ? 'true' : 'false');
    formData.append('catogryid', categoryIdToSend.toString());
    formData.append('teacherId', this.courseData.teacherId); // Use value from form

    if (this.logoFile) {
        formData.append('logo', this.logoFile, this.logoFile.name);
    }

    console.log('Submitting FormData...');
    this.http.post(this.API_URL, formData)
      .subscribe({
        next: (response) => {
          console.log('Upload successful', response);
          alert('Course uploaded successfully!');
          this.resetForm(form);
        },
        error: (error) => {
          console.error('Upload failed', error);
          alert(`Upload failed: ${error.message || 'Server error'}. Check console for details.`);
        }
      });
  }

  // --- Helper to Reset Form and Files ---
  private resetForm(form: NgForm): void {
     // Reset form including the new teacherId field, keep 'available' default
     form.resetForm({ available: true });

     // Re-initialize courseData (teacherId will be reset by form.resetForm)
     this.courseData = {
        courseTitle: '', description: '', price: null, available: true, catogryid: null,
        teacherId: '' // Reset teacherId in the model too
     };
     this.termsAgreed = false;
     this.logoFile = null;
     this.logoFileName = '';
     this.logoPreviewUrl = null;
     if (this.logoInput) this.logoInput.nativeElement.value = '';
  }
}