import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Import Router
import { Subscription, Subject, map, tap, takeUntil } from 'rxjs';

// Interface matching the NEW API response structure
interface ApiQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // Added correct answer field
}

// Modified internal interface to include correct answer
interface QuizQuestion {
  id: number; // Generated based on index
  text: string;
  options: { letter: string; text: string }[];
  correctAnswer: string; // Store the correct answer letter (A, B, C, D)
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule,RouterLink], // HttpClient provided globally, CommonModule for directives
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute); // Inject ActivatedRoute
  private router = inject(Router); // Inject Router for navigation

  // --- Configuration ---
  readonly quizTitle = 'Quiz'; // Title can be dynamic later if needed
  private baseApiUrl = 'https://est.runasp.net/api/Exam/GetQuestionsByExam/';

  // --- Component State ---
  questions: QuizQuestion[] = [];
  totalQuestions: number = 0;
  currentQuestionIndex: number = 0;
  userAnswers: { [key: number]: string } = {};
  quizSubmitted: boolean = false;
  isReviewing: boolean = false;
  score: number = 0;
  resultMessage: string = '';

  // --- Private Properties ---
  private questionSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>(); // For unsubscribing from route params
  public examId: string | null = null; // To store the ID from the route
  private courseId: string | null = null; // To store the course ID for navigation back

  constructor() {
    // Constructor logic can go here if needed
  }

  ngOnInit(): void {
    // Subscribe to route parameters to get the exam ID
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id'); // Assuming the route param is named 'id'
        if (id) {
          // Reset state if the ID changes while the component is active
          if (this.examId && this.examId !== id) {
             this.resetQuizStateBeforeLoad();
          }
          this.examId = id;
          this.loadQuestions(this.examId); // Load questions with the retrieved ID
        } else {
          // Handle missing ID case - perhaps navigate away or show a message
          // For now, it just won't load questions.
          this.resetQuizStateBeforeLoad(); // Ensure clean state
          this.cdRef.detectChanges();
        }
      });

    // Get the courseId from query parameters if available
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.courseId = params.get('courseId');
      });
  }

  ngOnDestroy(): void {
    this.questionSubscription?.unsubscribe();
    this.destroy$.next(); // Trigger unsubscription from route params
    this.destroy$.complete();
  }

  // Helper to reset state variables before loading new data
  private resetQuizStateBeforeLoad(): void {
      this.questions = [];
      this.totalQuestions = 0;
      this.currentQuestionIndex = 0;
      this.userAnswers = {};
      this.quizSubmitted = false;
      this.isReviewing = false;
      this.score = 0;
      this.resultMessage = '';
      this.cdRef.detectChanges(); // Ensure UI reflects reset state immediately
  }

  loadQuestions(examId: string): void {
    const questionsApiUrl = `${this.baseApiUrl}${examId}`; // Construct API URL dynamically

    // Ensure state is reset *before* the API call
    this.resetQuizStateBeforeLoad();

    this.questionSubscription?.unsubscribe(); // Unsubscribe from previous fetch if any

    this.questionSubscription = this.http.get<ApiQuestion[]>(questionsApiUrl)
      .pipe(
        map(apiQuestions => {
          if (!Array.isArray(apiQuestions)) {
             return [];
          }
          return this.transformApiData(apiQuestions);
        }),
        tap(transformedQuestions => {
          this.questions = transformedQuestions;
          this.totalQuestions = this.questions.length;

          if (this.totalQuestions > 0) {
            this.startQuiz(); // Start only if questions were loaded
          } else {
            // No questions loaded, UI handled by *ngIf in template
          }
          this.cdRef.detectChanges(); // Update UI after loading/transforming
        })
        // Removed catchError and finalize
      )
      .subscribe({
        // 'next' logic handled in 'tap'
        error: (err) => {
          // Basic error logging if needed, but UI won't show specific message
          console.error(`Failed to load questions for exam ${examId}:`, err);
          this.resetQuizStateBeforeLoad(); // Clear state on error
        }
        // 'complete' logic can be added if needed
      });
  }

  private transformApiData(apiQuestions: ApiQuestion[]): QuizQuestion[] {
    if (!Array.isArray(apiQuestions)) { return []; }

    return apiQuestions.map((apiQ, index) => {
        // Basic validation
        if (typeof apiQ?.questionText !== 'string' || !apiQ.questionText.trim() ||
            typeof apiQ?.optionA !== 'string' ||
            typeof apiQ?.optionB !== 'string' ||
            typeof apiQ?.optionC !== 'string' ||
            typeof apiQ?.optionD !== 'string' ||
            typeof apiQ?.correctAnswer !== 'string' ||
            !['A', 'B', 'C', 'D'].includes(apiQ.correctAnswer.toUpperCase())) {
            return null; // Skip invalid items silently
        }
        return {
            id: index + 1,
            text: apiQ.questionText,
            options: [
                { letter: 'A', text: apiQ.optionA },
                { letter: 'B', text: apiQ.optionB },
                { letter: 'C', text: apiQ.optionC },
                { letter: 'D', text: apiQ.optionD },
            ],
            correctAnswer: apiQ.correctAnswer.toUpperCase(),
        };
    }).filter(q => q !== null) as QuizQuestion[];
  }

  startQuiz(): void {
    if (this.totalQuestions === 0) {
        return; // Should not happen if called after load check, but safe guard
    }
    // Reset relevant state (already done in resetQuizStateBeforeLoad, but ensure correct index)
    this.currentQuestionIndex = 0;
    this.quizSubmitted = false;
    this.isReviewing = false;
    this.cdRef.detectChanges(); // Ensure UI reflects started state
  }


  selectOption(questionId: number, optionLetter: string): void {
    if (!this.quizSubmitted && !this.isReviewing) {
      this.userAnswers[questionId] = optionLetter;
      // Change detection usually handled by template binding event
    }
  }

  navigate(direction: 'prev' | 'next'): void {
    // Allow navigation if actively taking the quiz OR if reviewing answers
    if (this.quizSubmitted && !this.isReviewing) {
        return; // Only block navigation on the final results screen, not during review
    }

    // ... rest of the function remains the same
    if (direction === 'prev' && !this.isFirstQuestion) {
      this.currentQuestionIndex--;
    } else if (direction === 'next' && !this.isLastQuestion) {
      this.currentQuestionIndex++;
    }
    // Ensure the view updates after changing the index
    this.cdRef.markForCheck();
  }

  submitQuiz(): void {
    if (this.quizSubmitted) {
        return;
    }

    this.quizSubmitted = true;
    this.isReviewing = false;
    this.calculateScore(); // Calculate score first

    // TODO: Optional: Send answers to backend if needed
    // if (this.examId) {
    //    const submissionData = { examId: this.examId, answers: this.userAnswers };
    //    this.http.post('/api/Exam/SubmitAnswers', submissionData).subscribe(...)
    // }

    this.cdRef.detectChanges(); // Ensure results view is shown
  }

  calculateScore(): void {
    let correctCount = 0;
    this.questions.forEach(question => {
      if (this.userAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    this.score = correctCount;
    // Provide more engaging result messages based on score percentage
    const percentage = this.totalQuestions > 0 ? (this.score / this.totalQuestions) * 100 : 0;
    if (percentage === 100) {
      this.resultMessage = `Perfect score! You got ${this.score}/${this.totalQuestions} correct! 🎉`;
    } else if (percentage >= 75) {
      this.resultMessage = `Great job! You scored ${this.score} out of ${this.totalQuestions}.`;
    } else if (percentage >= 50) {
      this.resultMessage = `Good effort. You scored ${this.score} out of ${this.totalQuestions}.`;
    } else {
      this.resultMessage = `You scored ${this.score} out of ${this.totalQuestions}. Keep practicing!`;
    }
  }

  reviewAnswers(): void {
    if (!this.quizSubmitted || this.totalQuestions === 0) {
        return;
    }
    this.isReviewing = true;
    this.currentQuestionIndex = 0; // Start review from the first question
    this.cdRef.detectChanges();
  }

  // Modified to navigate back to the course page with the specific video
  finishQuizOrReview(): void {
    if (this.courseId) {
      // Navigate back to the course page with the course ID
      this.router.navigate(['/myCourse', this.courseId]);
    } else {
      // Fallback: Navigate to dashboard if no course ID is available
      this.router.navigate(['/dashboard']);
    }
  }

  // --- Helper Getters for Template ---
  get currentQuestionData(): QuizQuestion | null {
    return (this.questions.length > 0 && this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.totalQuestions)
      ? this.questions[this.currentQuestionIndex]
      : null;
  }

  get progressPercentage(): number {
    return this.totalQuestions > 0 ? ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100 : 0;
  }

  get isFirstQuestion(): boolean {
    return this.currentQuestionIndex === 0;
  }

  get isLastQuestion(): boolean {
    return this.totalQuestions > 0 && this.currentQuestionIndex === this.totalQuestions - 1;
  }

  // Method for template class binding
  isSelected(questionId: number, optionLetter: string): boolean {
    return this.userAnswers[questionId] === optionLetter;
  }

}