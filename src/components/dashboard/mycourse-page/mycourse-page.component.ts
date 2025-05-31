import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

interface CourseDetail {
  lessonTitle: string;
  lessonVideo: string | null;
  examTitle: string | null;
  examId: number | null;
  isLive: boolean;
}

@Component({
  selector: 'app-mycourse-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mycourse-page.component.html',
  styleUrls: ['./mycourse-page.component.css'] // This will use your provided CSS
})
export class MycoursePageComponent implements OnInit, OnDestroy {

  courseDetails: CourseDetail[] = [];
  currentVideoUrl: string | null = null;
  currentLessonTitle: string | null = null;
  selectedLesson: CourseDetail | null = null;

  isViewingExamPrompt: boolean = false;
  selectedExamTitle: string | null = null;
  selectedExamId: number | null = null;

  isLoading: boolean = true;
  error: string | null = null;
  courseId: string | null = null; // Public for template access
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.courseId = params.get('id');
        if (this.courseId) {
          this.fetchCourseDetails(this.courseId);
        } else {
          this.error = 'Course ID not found in route.';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchCourseDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.resetViewState();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = userData?.id || '';
    const apiUrl = `https://estigo.tryasp.net/api/Lesson/GetCourseDetails/${id}/${userId}`;

    this.http.get<CourseDetail[]>(apiUrl)
      .pipe(
        takeUntil(this.destroy$),
        map(data => data.map(lesson => ({ ...lesson, isLive: lesson.isLive || false }))),
        catchError((err: HttpErrorResponse) => {
          console.error('API Error:', err);
          this.error = 'Failed to load course details. Please try again later.';
          if (err.status === 404) {
            this.error = 'Course content not found or you may not have access.';
          }
          this.isLoading = false;
          return throwError(() => err);
        })
      )
      .subscribe(data => {
        this.courseDetails = data;

        let lessonToSelect: CourseDetail | undefined;

        lessonToSelect = this.courseDetails.find(
            lesson => !lesson.isLive && this.isValidVideoUrl(lesson.lessonVideo)
        );

        if (!lessonToSelect) {
            lessonToSelect = this.courseDetails.find(
                lesson => lesson.isLive && this.isValidVideoUrl(lesson.lessonVideo)
            );
        }

        if (!lessonToSelect && this.courseDetails.length > 0) {
            lessonToSelect = this.courseDetails[0];
        }

        if (lessonToSelect) {
             this.selectLesson(lessonToSelect);
        } else {
            this.currentLessonTitle = 'No content available for this course';
            this.selectedLesson = null;
            this.currentVideoUrl = null;
        }
        this.isLoading = false;
      });
  }

  selectLesson(lesson: CourseDetail): void {
    this.selectedLesson = lesson;
    this.currentLessonTitle = lesson.lessonTitle;
    this.isViewingExamPrompt = false;
    this.selectedExamId = null;
    this.selectedExamTitle = null;

    if (lesson.isLive) {
      this.currentVideoUrl = null; // No direct video player for live links
    } else {
      if (this.isValidVideoUrl(lesson.lessonVideo)) {
        this.currentVideoUrl = lesson.lessonVideo;
      } else {
        this.currentVideoUrl = null;
      }
    }
  }

  prepareExam(lesson: CourseDetail, event: Event): void {
    event.stopPropagation();
    if (lesson.examId) {
      this.selectedLesson = lesson;
      this.currentLessonTitle = lesson.lessonTitle;
      this.isViewingExamPrompt = true;
      this.selectedExamTitle = lesson.examTitle;
      this.selectedExamId = lesson.examId;
      this.currentVideoUrl = null;
    }
  }

  startExam(): void {
    if (this.selectedExamId && this.courseId) {
      console.log(`Navigating to exam with ID: ${this.selectedExamId} for course ${this.courseId}`);
      this.router.navigate(['/quiz', this.selectedExamId], {
        queryParams: { courseId: this.courseId }
      });
    }
  }

  isValidVideoUrl(url: string | null): boolean {
    return !!url && url.toLowerCase() !== 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('rtsp://') || url.startsWith('mms://'));
  }

  resetViewState(): void {
    this.currentVideoUrl = null;
    this.currentLessonTitle = null;
    this.selectedLesson = null;
    this.isViewingExamPrompt = false;
    this.selectedExamTitle = null;
    this.selectedExamId = null;
  }
}