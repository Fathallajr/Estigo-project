import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Added HttpErrorResponse
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Import Router
import { Subscription, Subject, map, tap, takeUntil, catchError, finalize, throwError } from 'rxjs'; // Added missing imports

// Interface matching the NEW API response structure for GETTING questions
interface ApiQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  // If the API returns a questionId for each question, add it here:
  // questionId?: number;
}

// Modified internal interface to include correct answer
interface QuizQuestion {
  id: number; // Generated based on index, or from ApiQuestion.questionId if available
  text: string;
  options: { letter: string; text: string }[];
  correctAnswer: string; // Store the correct answer letter (A, B, C, D)
}

// Interface for the QuestionAnswer part of the submission payload
interface QuestionAnswerPayload {
  questionId: number;
  selectedOption: string;
  isCorrect: boolean;
}

// Interface for the entire submission payload
interface QuizSubmissionPayload {
  studentId: string;
  examId: number;
  score: number; // Overall percentage score
  questionAnswers: QuestionAnswerPayload[];
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // --- Configuration ---
  readonly quizTitle = 'Quiz';
  private baseApiUrl = 'https://estigo.runasp.net/api/Exam/GetQuestionsByExam/';
  private submitScoreApiUrl = 'https://estigo.runasp.net/api/Exam/SubmitQuizScore';

  // --- Component State ---
  questions: QuizQuestion[] = [];
  totalQuestions: number = 0;
  currentQuestionIndex: number = 0;
  userAnswers: { [key: number]: string } = {}; // key is QuizQuestion.id
  quizSubmitted: boolean = false;
  isReviewing: boolean = false;
  score: number = 0; // Raw score (number of correct answers)
  resultMessage: string = '';
  isLoading: boolean = false; // Added for loading state

  // --- Private Properties ---
  private questionSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  public examId: string | null = null;
  private courseId: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          if (this.examId && this.examId !== id) {
            this.resetQuizStateBeforeLoad();
          }
          this.examId = id;
          this.loadQuestions(this.examId);
        } else {
          this.errorMessage = "Exam ID not found in route."; // Set error message
          this.isLoading = false;
          this.resetQuizStateBeforeLoad();
          this.cdRef.detectChanges();
        }
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.courseId = params.get('courseId');
      });
  }

  ngOnDestroy(): void {
    this.questionSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  errorMessage: string | null = null; // For displaying errors to user

  private resetQuizStateBeforeLoad(): void {
    this.questions = [];
    this.totalQuestions = 0;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.quizSubmitted = false;
    this.isReviewing = false;
    this.score = 0;
    this.resultMessage = '';
    this.errorMessage = null; // Clear any previous error messages
    this.cdRef.detectChanges();
  }

  loadQuestions(examId: string): void {
    const questionsApiUrl = `${this.baseApiUrl}${examId}`;
    this.resetQuizStateBeforeLoad();
    this.isLoading = true;
    this.errorMessage = null;

    this.questionSubscription?.unsubscribe();

    this.questionSubscription = this.http.get<ApiQuestion[]>(questionsApiUrl)
      .pipe(
        map(apiQuestions => {
          if (!Array.isArray(apiQuestions)) {
            console.warn(`API response for exam ${examId} is not an array.`);
            return [];
          }
          return this.transformApiData(apiQuestions);
        }),
        tap(transformedQuestions => {
          this.questions = transformedQuestions;
          this.totalQuestions = this.questions.length;
          if (this.totalQuestions > 0) {
            this.startQuiz();
          } else {
            this.errorMessage = "No questions found for this exam.";
          }
        }),
        catchError((err: HttpErrorResponse) => {
          console.error(`Failed to load questions for exam ${examId}:`, err);
          this.errorMessage = `Failed to load questions. Server responded with: ${err.status} ${err.statusText}. Please try again later.`;
          if (err.error && typeof err.error === 'string') {
            this.errorMessage += ` Details: ${err.error}`;
          }
          this.resetQuizStateBeforeLoad(); // Clear state on error
          return throwError(() => err); // Re-throw the error
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe(); // Error handling is now done in catchError
  }

  private transformApiData(apiQuestions: ApiQuestion[]): QuizQuestion[] {
    if (!Array.isArray(apiQuestions)) { return []; }

    return apiQuestions.map((apiQ, index) => {
      // If ApiQuestion includes its own `questionId`, use it. Otherwise, use index.
      // const questionId = apiQ.questionId !== undefined ? apiQ.questionId : index + 1;
      const questionId = index + 1; // Assuming API doesn't send questionId yet

      if (typeof apiQ?.questionText !== 'string' || !apiQ.questionText.trim() ||
          typeof apiQ?.optionA !== 'string' ||
          typeof apiQ?.optionB !== 'string' ||
          typeof apiQ?.optionC !== 'string' ||
          typeof apiQ?.optionD !== 'string' ||
          typeof apiQ?.correctAnswer !== 'string' ||
          !['A', 'B', 'C', 'D'].includes(apiQ.correctAnswer.toUpperCase())) {
        console.warn('Skipping invalid question data:', apiQ);
        return null;
      }
      return {
        id: questionId,
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
    if (this.totalQuestions === 0) return;
    this.currentQuestionIndex = 0;
    this.quizSubmitted = false;
    this.isReviewing = false;
    this.cdRef.detectChanges();
  }

  selectOption(questionId: number, optionLetter: string): void {
    if (!this.quizSubmitted && !this.isReviewing) {
      this.userAnswers[questionId] = optionLetter;
    }
  }

  navigate(direction: 'prev' | 'next'): void {
    if (this.quizSubmitted && !this.isReviewing) return;

    if (direction === 'prev' && !this.isFirstQuestion) {
      this.currentQuestionIndex--;
    } else if (direction === 'next' && !this.isLastQuestion) {
      this.currentQuestionIndex++;
    }
    this.cdRef.markForCheck();
  }

  submitQuiz(): void {
    if (this.quizSubmitted) return;

    this.quizSubmitted = true;
    this.isReviewing = false;
    this.calculateScore(); // Sets this.score (raw) and this.resultMessage

    const userDataStr = localStorage.getItem('userData');
    if (userDataStr && this.examId) {
      try {
        const userData = JSON.parse(userDataStr);
        const studentId = userData.id;

        if (!studentId) {
          console.error('Student ID not found in user data');
          this.errorMessage = "Could not submit score: Student ID missing.";
          return;
        }

        const scorePercentage = this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;

        const questionAnswers: QuestionAnswerPayload[] = this.questions.map(q => {
          const selectedOpt = this.userAnswers[q.id] || ''; // Default to empty string if not answered
          return {
            questionId: q.id, // Using our client-generated ID (index + 1)
            selectedOption: selectedOpt,
            isCorrect: selectedOpt === q.correctAnswer
          };
        });

        const submissionPayload: QuizSubmissionPayload = {
          studentId: studentId,
          examId: parseInt(this.examId, 10), // Ensure examId is a number
          score: scorePercentage,
          questionAnswers: questionAnswers
        };

        this.http.post<{ message: string, score: number }>(this.submitScoreApiUrl, submissionPayload)
          .pipe(
            catchError((err: HttpErrorResponse) => {
                console.error('Failed to submit quiz score:', err);
                this.errorMessage = `Failed to submit score. Server responded with: ${err.status}. Please try again or contact support.`;
                if (err.error && typeof err.error === 'string') {
                    this.errorMessage += ` Details: ${err.error}`;
                } else if (err.error && err.error.message) {
                    this.errorMessage += ` Details: ${err.error.message}`;
                }
                // Even if submission fails, the user sees their local score calculation.
                return throwError(() => err);
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Quiz score submitted successfully:', response);
              // this.resultMessage is already set by calculateScore()
              // Optionally update resultMessage with server confirmation if needed:
              // this.resultMessage += ` (Server confirmed: ${response.message})`;
            }
            // Error handled by catchError
          });
      } catch (error) {
        console.error('Error processing user data or building submission:', error);
        this.errorMessage = "An internal error occurred while preparing your score submission.";
      }
    } else {
      console.warn('Missing user data or exam ID for score submission');
      this.errorMessage = "Could not submit score: User data or Exam ID missing.";
    }
    this.cdRef.detectChanges();
  }

  calculateScore(): void {
    let correctCount = 0;
    this.questions.forEach(question => {
      if (this.userAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    this.score = correctCount; // Raw score
    const percentage = this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;

    if (percentage === 100) {
      this.resultMessage = `Perfect score! You got ${this.score}/${this.totalQuestions} correct (${percentage}%)! 🎉`;
    } else if (percentage >= 75) {
      this.resultMessage = `Great job! You scored ${this.score} out of ${this.totalQuestions} (${percentage}%).`;
    } else if (percentage >= 50) {
      this.resultMessage = `Good effort. You scored ${this.score} out of ${this.totalQuestions} (${percentage}%).`;
    } else {
      this.resultMessage = `You scored ${this.score} out of ${this.totalQuestions} (${percentage}%). Keep practicing!`;
    }
  }

  reviewAnswers(): void {
    if (!this.quizSubmitted || this.totalQuestions === 0) return;
    this.isReviewing = true;
    this.currentQuestionIndex = 0;
    this.cdRef.detectChanges();
  }

  finishQuizOrReview(): void {
    if (this.courseId) {
      this.router.navigate(['/myCourse', this.courseId]);
    } else {
      this.router.navigate(['/dashboard']); // Fallback
    }
  }

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

  isSelected(questionId: number, optionLetter: string): boolean {
    return this.userAnswers[questionId] === optionLetter;
  }
}