import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { CommonModule } from '@angular/common'; // Needed for ngFor, ngIf

// --- Interfaces ---
interface UserData {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}
interface TeacherLesson {
  lessonId: number;
  lessonTitle: string;
}
interface QuizQuestion {
  id: number; // Typically 0 for new questions sent to backend
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}
// ViewModel to hold question data and its UI state
interface QuestionViewModel {
  data: QuizQuestion;
  isCollapsed: boolean;
}
// Payload for the API request
interface ExamPayload {
  id: number; // Typically 0 for creation
  examTitle: string;
  examDescription: string;
  grade: string;
  lessonId: number;
  final: boolean; // <-- ADDED: Flag to indicate if it's a final exam
  questions: QuizQuestion[]; // Uses the original QuizQuestion interface
}

@Component({
  selector: 'app-upload-quizzes',
  standalone: true,
  imports: [
    FormsModule, // Import FormsModule for ngModel
    CommonModule // Import CommonModule for ngFor, ngIf, etc.
  ],
  templateUrl: './upload-quizzes.component.html',
  styleUrls: ['./upload-quizzes.component.css']
})
export class UploadQuizzesComponent implements OnInit {

  // --- Properties ---
  teacherLessons: TeacherLesson[] = [];
  selectedLessonId: number | null = null;
  quizData = {
    examTitle: '',
    examDescription: '', // Keep even if not editable in UI for now
    grade: '',           // Keep even if not editable in UI for now
    isFinal: false      // <-- ADDED: State for the final exam checkbox
  };
  // Use the ViewModel array to manage questions and their state
  questionsViewModel: QuestionViewModel[] = [];
  teacherId: string | null = null; // To store the logged-in teacher's ID

  // API Endpoints
  readonly LESSONS_API_URL = 'https://estigo.tryasp.net/api/Teacher/teacher-lessons';
  readonly ADD_EXAM_API_URL = 'https://estigo.tryasp.net/api/Teacher/add-exam';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log("UploadQuizzesComponent initialized.");
    this.loadTeacherId();

    if (this.teacherId) {
      this.fetchTeacherLessons();
    } else {
      console.error("Teacher ID not found in local storage on init. Cannot fetch lessons.");
    }

    if (this.questionsViewModel.length === 0) {
      this.addInitialQuestion();
    }
  }

  loadTeacherId(): void {
     try {
       const userDataString = localStorage.getItem('userData');
       if (userDataString) {
         const userData: UserData = JSON.parse(userDataString);
         this.teacherId = userData.id || null;
         console.log("Loaded teacherId:", this.teacherId);
       } else {
         console.warn("No user data found in local storage.");
         this.teacherId = null;
       }
     } catch (error) {
       console.error('Error parsing user data from local storage:', error);
       this.teacherId = null;
     }
  }

  fetchTeacherLessons(): void {
    if (!this.teacherId) {
       console.error("Cannot fetch lessons - teacherId is missing.");
       this.teacherLessons = [];
       return;
    }

    console.log(`Attempting to fetch lessons for teacherId: ${this.teacherId}`);
    let params = new HttpParams().set('teacherId', this.teacherId);

    this.http.get<TeacherLesson[]>(this.LESSONS_API_URL, { params: params })
      .subscribe({
        next: (lessons) => {
          console.log("Lessons received:", lessons);
          this.teacherLessons = lessons ?? [];
          if(this.teacherLessons.length === 0) {
            console.warn("Received an empty array of lessons.");
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error("Error fetching lessons:", error);
          this.teacherLessons = [];
          alert(`Failed to load lessons. Status: ${error.status}. Check console for details.`);
        }
      });
  }

  addInitialQuestion(): void {
    this.questionsViewModel.push({
        data: { id: 0, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
        isCollapsed: false
    });
  }

  addQuestion(): void {
    const lastIndex = this.questionsViewModel.length - 1;
    if (lastIndex >= 0) {
       this.questionsViewModel[lastIndex].isCollapsed = true;
    }
    this.questionsViewModel.push({
        data: { id: 0, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
        isCollapsed: false
    });
  }

  removeQuestion(index: number): void {
    if (this.questionsViewModel.length > 1) {
        this.questionsViewModel.splice(index, 1);
        const newLastIndex = this.questionsViewModel.length - 1;
        if (newLastIndex >= 0 && this.questionsViewModel[newLastIndex].isCollapsed) {
             this.questionsViewModel[newLastIndex].isCollapsed = false;
        }
    } else {
        alert("A quiz must have at least one question.");
    }
  }

  toggleQuestionCollapse(index: number): void {
    if (this.questionsViewModel[index]) {
      this.questionsViewModel[index].isCollapsed = !this.questionsViewModel[index].isCollapsed;
    }
  }

  onSubmit(): void {
    const questionsData: QuizQuestion[] = this.questionsViewModel
        .map(vm => ({ ...vm.data, id: 0 }));

    if (!this.selectedLessonId || !this.quizData.examTitle.trim() || questionsData.length === 0 || questionsData.some(q => !q.questionText.trim())) {
      alert("Please select a lesson, enter a quiz title, and ensure all questions have text.");
      return;
    }

    // Construct the final payload including the 'final' flag
    const payload: ExamPayload = {
      id: 0,
      examTitle: this.quizData.examTitle.trim(),
      examDescription: this.quizData.examDescription.trim(), // Use value from quizData
      grade: this.quizData.grade.trim(),                   // Use value from quizData
      lessonId: this.selectedLessonId,
      final: this.quizData.isFinal, // <-- ADDED: Map the checkbox state to the payload
      questions: questionsData
    };

    console.log("Submitting Quiz Payload:", JSON.stringify(payload, null, 2));

    this.http.post(this.ADD_EXAM_API_URL, payload)
      .subscribe({
        next: (response) => {
          console.log("Quiz submitted successfully:", response);
          alert("Quiz submitted successfully!");
          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {
           console.error("Error submitting quiz:", error);
           let errorMsg = `Failed to submit quiz. Status: ${error.status}`;
           if (error.error) {
             if (typeof error.error === 'string') { errorMsg += `\nMessage: ${error.error}`; }
             else if (error.error.title) { errorMsg += `\n${error.error.title}`; }
             else if (error.error.message) { errorMsg += `\nMessage: ${error.error.message}`; }
             else if (error.error.errors) { errorMsg += `\nValidation Errors: ${JSON.stringify(error.error.errors)}`; }
           }
           alert(errorMsg + "\nCheck console for more details.");
        }
      });
  }

  resetForm(): void {
     this.quizData = { examTitle: '', examDescription: '', grade: '', isFinal: false };
     this.questionsViewModel = [];
     this.addInitialQuestion();
     this.selectedLessonId = null;
  }

  trackQuestionByIndex(index: number, item: QuestionViewModel): number {
    return index;
  }

}