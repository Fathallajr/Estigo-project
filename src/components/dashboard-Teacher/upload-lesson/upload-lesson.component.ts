import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Keep HttpClient & HttpHeaders for first call
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


interface UserData { id: string; }
interface TeacherCourse { courseId: number; courseTitle: string; }
interface NewLesson { lessonTitle: string; lessonDescription: string; lessonContent: string; lessonVideo: string; }
interface LessonPayload extends NewLesson { lessonId: number; courseId: number; }

@Component({
  selector: 'app-upload-lesson',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upload-lesson.component.html',
  styleUrls: ['./upload-lesson.component.css'] // Keep for basic layout
})
export class UploadLessonComponent implements OnInit {

  // --- Properties ---
  teacherCourses: TeacherCourse[] = [];
  selectedCourseId: number | null = null;
  lessonData: NewLesson = {
    lessonTitle: '',
    lessonDescription: '',
    lessonContent: '',
    lessonVideo: ''
  };
  teacherId: string | null = null;
  selectedVideoName: string | null = null;

  // API Endpoints
  readonly COURSES_API_URL = 'https://estigo.tryasp.net/api/Teacher/teacher-courses';
  readonly LESSON_API_URL = 'https://estigo.tryasp.net/api/Lesson';
  readonly VIDEO_BASE_URL = 'https://estigo.tryasp.net/';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Directly try to get ID and fetch courses
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData: UserData = JSON.parse(userDataString);
        this.teacherId = userData.id || null;
        if (this.teacherId) {
          this.fetchTeacherCourses();
        }
      }
    } catch (e) { console.error("Error getting teacher ID", e); }
  }

  fetchTeacherCourses(): void {
    // Convert to GET request with teacherId as query parameter
    const url = `${this.COURSES_API_URL}?teacherId=${this.teacherId}`;
    
    this.http.get<TeacherCourse[]>(url)
      .subscribe(courses => {
        this.teacherCourses = courses;
        console.log("Courses fetched:", courses);
      });
      // No .error() handling
  }

  onVideoSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedVideoName = file.name;
      this.lessonData.lessonVideo = this.VIDEO_BASE_URL + file.name;
    }
  }

  onSubmit(): void {
    if (!this.selectedCourseId || !this.lessonData.lessonTitle || !this.teacherId) {
      console.warn("Missing course selection or lesson title.");
      alert("Please select a course and enter a lesson title.");
      return;
    }

    const payload: LessonPayload = {
      lessonId: 0,
      courseId: this.selectedCourseId,
      ...this.lessonData
    };

    // Let Angular handle default headers (usually application/json for object payload)
    this.http.post(this.LESSON_API_URL, payload)
      .subscribe(() => {
         console.log("Lesson possibly added for course:", this.selectedCourseId);
         alert("Lesson submitted!"); // Minimal feedback
         // Optionally reset form fields
         this.lessonData = { lessonTitle: '', lessonDescription: '', lessonContent: '', lessonVideo: '' };
         // Keep course selected: this.selectedCourseId = null;
      });
      // No .error() handling
  }
}