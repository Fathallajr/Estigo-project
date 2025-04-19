import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Course {
  courseId: number;
  courseTitle: string;
  imageBase64: string;
  price: number;
  teacherName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private apiUrl = 'https://estigo.tryasp.net/api/Course';

  constructor(private http: HttpClient) {}

  getCoursesByCategory(categoryId: number): Observable<Course[]> {
    const endpoint = `${this.apiUrl}/category/limited/${categoryId}`;
    return this.http.get<Course[]>(endpoint).pipe(
      catchError(this.handleError<Course[]>('getCoursesByCategory', []))
    );
  }

  private handleError<T>(operation: any, result?: T) {
    return (error: any): Observable<T> => {
      console.error(error.message);
      return of(result as T);
    };
  }
}