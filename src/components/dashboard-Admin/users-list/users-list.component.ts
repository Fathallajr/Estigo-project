import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

interface Student { id: string; name: string; email: string; }
interface Teacher { id: string; name: string; subject: string; }
interface Parent { id: string; name: string; }

interface BaseRegisterDTO {
  name: string;
  email: string;
  gender: string;
  password?: string;
}
interface AdminRegisterDTO extends BaseRegisterDTO { }

interface StudentRegisterDTO extends BaseRegisterDTO {
  phone: string;
  birthDate: string;
  track: string;
  level: number;
  parentPhone: string;
}

interface TeacherRegisterDTO extends BaseRegisterDTO {
  subject: string;
  notes?: string;
}
interface ParentRegisterDTO extends BaseRegisterDTO { }

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value && confirmPassword.value && password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
    }
    return null;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
  readonly API_BASE_URL = 'https://estigo.tryasp.net/api/';
  readonly API_URLS = {
    Student: `${this.API_BASE_URL}Admin/AllStudent`,
    Teacher: `${this.API_BASE_URL}Admin/AllTeacher`,
    Parent: `${this.API_BASE_URL}Admin/AllParents`,
    RegisterAdmin: `${this.API_BASE_URL}Auth/register/admin`,
    RegisterStudent: `${this.API_BASE_URL}Auth/register/student`,
    RegisterTeacher: `${this.API_BASE_URL}Auth/register/teacher`,
    RegisterParent: `${this.API_BASE_URL}Auth/register/parent`
  };

  displayedUsers: any[] = [];
  selectedRole: 'Student' | 'Teacher' | 'Parent' = 'Teacher';
  availableRoles: ('Student' | 'Teacher' | 'Parent')[] = ['Student', 'Teacher', 'Parent'];
  isLoading: boolean = false;
  error: string | null = null;
  isModalOpen: boolean = false;
  registerForm!: FormGroup;
  isSubmitting: boolean = false;
  modalError: string | null = null;
  modalSuccess: string | null = null;
  registrationRoles: ('Admin' | 'Student' | 'Teacher' | 'Parent')[] = ['Admin', 'Student', 'Teacher', 'Parent'];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.fetchUsers(this.selectedRole);
    this.initializeForm();
  }

  selectRole(role: 'Student' | 'Teacher' | 'Parent'): void {
    if (role !== this.selectedRole) {
      this.selectedRole = role;
      this.displayedUsers = [];
      this.error = null;
      this.fetchUsers(role);
    }
  }

  fetchUsers(role: 'Student' | 'Teacher' | 'Parent'): void {
    if (!this.http) {
        console.error("HttpClient not injected correctly!");
        this.error = "Configuration error: HttpClient not available.";
        return;
      }
      const apiUrl = this.API_URLS[role];
      if (!apiUrl) {
          console.error("Invalid role selected:", role);
          this.error = `Invalid role '${role}' selected.`;
          return;
      }
      console.log(`Fetching ${role}s from:`, apiUrl);
      this.isLoading = true;
      this.error = null;
      let requestObservable;
      if (role === 'Student') requestObservable = this.http.get<Student[]>(apiUrl);
      else if (role === 'Teacher') requestObservable = this.http.get<Teacher[]>(apiUrl);
      else if (role === 'Parent') requestObservable = this.http.get<Parent[]>(apiUrl);
      else requestObservable = this.http.get<any[]>(apiUrl);

      requestObservable.subscribe({
          next: (data) => {
            this.displayedUsers = data;
            this.isLoading = false;
            console.log(`${role}s fetched successfully:`, this.displayedUsers);
            if (this.displayedUsers.length === 0) {
              console.log(`No ${role}s found.`);
            }
          },
          error: (err: HttpErrorResponse) => {
            console.error(`Error fetching ${role}s:`, err);
            this.error = `Failed to fetch ${role}s. Status: ${err.status}. Please try again later.`;
            this.isLoading = false;
            this.displayedUsers = [];
          }
        });
  }

  openAddUserModal(): void {
    this.isModalOpen = true;
    this.modalError = null;
    this.modalSuccess = null;
    const defaultRole = this.registrationRoles[0];
    this.registerForm.reset({ role: defaultRole, level: null });
    this.updateFormValidators(defaultRole);
  }

  closeModal(): void {
     this.isModalOpen = false;
     this.isSubmitting = false;
  }

  initializeForm(): void {
     this.registerForm = this.fb.group({
      role: [this.registrationRoles[0], Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone: [''],
      birthDate: [''],
      track: [''],
      level: [null],
      parentPhone: [''],
      subject: [''],
      notes: ['']
    }, { validators: passwordMatchValidator });

    this.registerForm.get('role')?.valueChanges.subscribe(roleValue => {
      if(roleValue) {
           this.updateFormValidators(roleValue);
      }
    });
  }

  updateFormValidators(role: string): void {
      const studentFields = ['track', 'level', 'parentPhone', 'phone', 'birthDate'];
      const teacherFields = ['subject'];
      const allRoleSpecificFields = [...studentFields, ...teacherFields];

      allRoleSpecificFields.forEach(fieldName => {
          const control = this.registerForm.get(fieldName);
          if (control) {
               control.clearValidators();
               control.updateValueAndValidity();
          }
      });

      if (role === 'Student') {
        studentFields.forEach(fieldName => {
          this.registerForm.get(fieldName)?.setValidators(Validators.required);
        });
      } else if (role === 'Teacher') {
        teacherFields.forEach(fieldName => {
           this.registerForm.get(fieldName)?.setValidators(Validators.required);
        });
      }

      allRoleSpecificFields.forEach(fieldName => {
          this.registerForm.get(fieldName)?.updateValueAndValidity();
      });
  }

  onRegisterSubmit(): void {
    this.modalError = null;
    this.modalSuccess = null;
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      console.warn('Form is invalid. Errors:', this.registerForm.errors);
      this.modalError = 'Please fill in all required fields correctly.';
      Object.keys(this.registerForm.controls).forEach(key => {
        const controlErrors = this.registerForm.get(key)?.errors;
        if (controlErrors) {
          console.log('Invalid Control:', key, 'Errors:', controlErrors);
        }
      });
      this.focusFirstInvalidControl();
      return;
    }

    if (!this.http) {
        this.modalError = "Configuration error: Cannot send request.";
        console.error("HttpClient is not available in onRegisterSubmit.");
        return;
    }

    this.isSubmitting = true;
    const formValue = this.registerForm.value;
    const selectedRegRole = formValue.role as 'Admin' | 'Student' | 'Teacher' | 'Parent';

    let apiUrl = '';
    let payload: any = {};

    const commonPayload = {
        name: formValue.name,
        email: formValue.email,
        gender: formValue.gender,
        password: formValue.password
    };

    try {
        switch(selectedRegRole) {
            case 'Admin':
                apiUrl = this.API_URLS.RegisterAdmin;
                payload = { ...commonPayload } as AdminRegisterDTO;
                break;
            case 'Student':
                apiUrl = this.API_URLS.RegisterStudent;
                const levelValue = parseInt(formValue.level, 10);
                if (isNaN(levelValue)) {
                     throw new Error("Level must be a valid number.");
                }
                payload = {
                    ...commonPayload,
                    phone: formValue.phone,
                    birthDate: formValue.birthDate,
                    track: formValue.track,
                    level: levelValue,
                    parentPhone: formValue.parentPhone
                } as StudentRegisterDTO;
                break;
            case 'Teacher':
                apiUrl = this.API_URLS.RegisterTeacher;
                // Create FormData because backend expects [FromForm]
                const formData = new FormData();
                formData.append('name', formValue.name);
                formData.append('email', formValue.email);
                formData.append('gender', formValue.gender);
                formData.append('password', formValue.password);
                formData.append('subject', formValue.subject);

                // Only append notes if it has a non-empty value
                if (formValue.notes && formValue.notes.trim() !== '') {
                    formData.append('notes', formValue.notes.trim());
                }
                // Assign the FormData object to the payload
                payload = formData;
                // Note: HttpClient handles the Content-Type for FormData automatically.
                // DO NOT set Content-Type header manually here.
                break;
            // ***** END MODIFIED Teacher Case *****

            case 'Parent':
                apiUrl = this.API_URLS.RegisterParent;
                payload = { ...commonPayload } as ParentRegisterDTO; // Send JSON
                break;
            default:
                throw new Error("Invalid role selected for registration.");
        }
    } catch (error: any) {
        console.error("Error preparing payload:", error);
        this.modalError = error.message || "Failed to prepare registration data.";
        this.isSubmitting = false;
        return;
    }


    console.log(`Registering ${selectedRegRole} to ${apiUrl} with payload:`, payload); // Log the payload (FormData won't show details easily here)

    // --- Perform HTTP POST Request ---
    // The HttpClient call remains the same, it detects FormData payload
    this.http.post<any>(apiUrl, payload)
      .subscribe({
        next: (response) => {
          // ... (success handling remains the same - check previous versions if needed) ...
          console.log('Registration successful:', response);
          this.modalSuccess = (response && response.message) ? response.message : `${selectedRegRole} registered successfully!`;
          this.isSubmitting = false;
          setTimeout(() => {
            this.closeModal();
            if (this.availableRoles.includes(selectedRegRole as any) && selectedRegRole === this.selectedRole) {
                 console.log(`Refreshing ${this.selectedRole} list after adding a new user.`);
                 this.fetchUsers(this.selectedRole);
            }
          }, 1500);
        },
        error: (err: HttpErrorResponse) => {
           // ... (error handling remains the same - check previous versions if needed) ...
          console.error('Registration failed:', err);
          this.isSubmitting = false;
          let errorMessages = [];
          if (err.error) {
              if (typeof err.error === 'string') errorMessages.push(err.error);
              else if (Array.isArray(err.error)) errorMessages = err.error.map((e: any) => e.description || e.errorMessage || JSON.stringify(e));
              else if (typeof err.error === 'object') {
                  if (err.error.errors && typeof err.error.errors === 'object') errorMessages = Object.values(err.error.errors).flat();
                  else if (err.error.message) errorMessages.push(err.error.message);
                  else if (err.error.title) errorMessages.push(err.error.title);
                  else { try { errorMessages.push(JSON.stringify(err.error)); } catch { /* ignore */ } }
              }
          }
          if (errorMessages.length === 0) errorMessages.push(`Error: ${err.status} - ${err.statusText}. Failed to register user.`);
          this.modalError = errorMessages.join(' ');
        }
      });
  }

   // --- Helper Methods ---

   // Helper getter for easy access to form controls in the template
   get f() { return this.registerForm.controls; }

   // Helper getter for the currently selected role in the registration form
   get selectedRegisterRole(): string { return this.registerForm.get('role')?.value || ''; }

   // Utility to focus the first invalid control for better UX
   focusFirstInvalidControl(): void {
     // ... (focusFirstInvalidControl implementation remains the same) ...
      for (const key of Object.keys(this.registerForm.controls)) {
       const control = this.registerForm.get(key);
       if (control && control.invalid) {
         try {
           const element = document.querySelector(`[formControlName="${key}"]`);
           if (element && typeof (element as HTMLElement).focus === 'function') {
             (element as HTMLElement).focus();
             console.log(`Focusing on invalid control: ${key}`);
             break;
           }
         } catch (e) {
           console.error(`Error focusing on element for control ${key}:`, e);
         }
       }
     }
   }
}