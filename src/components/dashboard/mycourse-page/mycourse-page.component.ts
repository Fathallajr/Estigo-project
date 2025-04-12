import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

interface CourseDetail {
  lessonTitle: string;
  lessonVideo: string | null;
  examTitle: string | null;
  examId: number | null;
}

@Component({
  selector: 'app-mycourse-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mycourse-page.component.html',
  styleUrls: ['./mycourse-page.component.css']
})
export class MycoursePageComponent implements OnInit, OnDestroy {

  courseDetails: CourseDetail[] = [];
  currentVideoUrl: string | null = null;
  currentLessonTitle: string | null = null;
  selectedLesson: CourseDetail | null = null; // Keep track of the selected lesson item

  // State for exam prompt
  isViewingExamPrompt: boolean = false;
  selectedExamTitle: string | null = null;
  selectedExamId: number | null = null;

  isLoading: boolean = true;
  error: string | null = null;
  private courseId: string | null = null;
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
    this.resetViewState(); // Reset view when fetching new course
    const apiUrl = `https://est.runasp.net/api/Lesson/GetCourseDetails/${id}`;

    this.http.get<CourseDetail[]>(apiUrl)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('API Error:', err);
          this.error = 'Failed to load course details. Please try again later.';
          this.isLoading = false;
          return throwError(() => err);
        })
      )
      .subscribe(data => {
        this.courseDetails = data;
        const firstLessonWithVideo = this.courseDetails.find(
            lesson => this.isValidVideoUrl(lesson.lessonVideo)
        );
        if (firstLessonWithVideo) {
             this.selectLesson(firstLessonWithVideo); // Select first lesson with video
        } else if (this.courseDetails.length > 0) {
            // If no video, select the first lesson anyway to show something
            this.selectLesson(this.courseDetails[0]);
        } else {
            this.currentLessonTitle = 'No content available for this course';
        }
        this.isLoading = false;
      });
  }

  selectLesson(lesson: CourseDetail): void {
    this.selectedLesson = lesson; // Track the selected list item
    this.currentLessonTitle = lesson.lessonTitle;
    this.isViewingExamPrompt = false; // Switch back to video view
    this.selectedExamId = null;
    this.selectedExamTitle = null;

    if (this.isValidVideoUrl(lesson.lessonVideo)) {
      this.currentVideoUrl = lesson.lessonVideo;
    } else {
      this.currentVideoUrl = null; // No valid video for this lesson
    }
  }

  prepareExam(lesson: CourseDetail, event: Event): void {
    event.stopPropagation(); // Prevent triggering selectLesson when clicking exam
    if (lesson.examId) {
      this.selectedLesson = lesson; // Keep the lesson highlighted
      this.currentLessonTitle = lesson.lessonTitle; // Keep lesson title context
      this.isViewingExamPrompt = true;
      this.selectedExamTitle = lesson.examTitle;
      this.selectedExamId = lesson.examId;
      this.currentVideoUrl = null; // Hide video player
    }
  }

  startExam(): void {
    if (this.selectedExamId && this.courseId) {
      console.log(`Navigating to exam with ID: ${this.selectedExamId}`);
      // Navigate to the quiz route with courseId as query parameter
      this.router.navigate(['/quiz', this.selectedExamId], {
        queryParams: { courseId: this.courseId }
      });
    }
  }

  isValidVideoUrl(url: string | null): boolean {
    return !!url && url !== 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  }

  resetViewState(): void {
    this.courseDetails = [];
    this.currentVideoUrl = null;
    this.currentLessonTitle = null;
    this.selectedLesson = null;
    this.isViewingExamPrompt = false;
    this.selectedExamTitle = null;
    this.selectedExamId = null;
    this.isLoading = true;
    this.error = null;
  }
}