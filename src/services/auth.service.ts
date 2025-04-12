import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface RegisterResponseTeacher {
  email: string;
  password: string;
  name: string;
  gender: string;
  Subject: string;
  notes: string;
}

interface RegisterResponseStudent {
  email: string;
  password: string;
  name: string;
  phone: string;
  gender: string;
  birthDate: string;
  track: string;
  level: number;
  parentPhone: string;
}

interface RegisterResponseParent {
  email: string;
  password: string;
  name: string;
  gender: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  isAuthenticated$: any;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object,private http: HttpClient){
    this.isBrowser = isPlatformBrowser(platformId);
    
    const initialAuthState = this.getInitialAuthState(); // check auth state before initializing behaviorSubject (so it dont apply 2 headers)

    // the auth behavior and observable (it sent to rest of the app to check authentication)
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(initialAuthState);
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  private getInitialAuthState(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>("https://est.runasp.net/api/Auth/login", { email, password })
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userData', JSON.stringify(response));
          }
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userData');
    }
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getUserData(): LoginResponse | null {
    if (!this.isBrowser) return null;
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  registerTeacher(data: RegisterResponseTeacher) {
    const formData = new FormData();
    formData.append('Email', data.email);
    formData.append('Password', data.password);
    formData.append('Name', data.name);
    formData.append('Gender', data.gender);
    formData.append('Subject', data.Subject);
    formData.append('Notes', data.notes);

    return this.http.post<LoginResponse>("https://est.runasp.net/api/Auth/register/teacher", formData);
  }

  registerStudent(data: RegisterResponseStudent) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<LoginResponse>("https://est.runasp.net/api/Auth/register/student", data, { headers });
  }

  registerParent(data: RegisterResponseParent) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<LoginResponse>("https://est.runasp.net/api/Auth/register/parent", data, { headers });
  }
} 