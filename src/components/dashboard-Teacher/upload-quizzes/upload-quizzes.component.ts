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
  questions: QuizQuestion[]; // Uses the original QuizQuestion interface
}

@Component({
  selector: 'app-upload-quizzes',
  standalone: true,
  imports: [
    FormsModule, // Import FormsModule for ngModel
    CommonModule // Import CommonModule for ngFor, ngIf, etc.
    // HttpClientModule is typically imported in AppModule or bootstrapApplication, not usually here directly for standalone
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
    examDescription: '',
    grade: ''
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
      // Optionally display an error message to the user in the template
    }

    // Ensure there's at least one question block displayed initially (expanded)
    if (this.questionsViewModel.length === 0) {
      this.addInitialQuestion(); // Use a specific method for the first one
    }
  }

  // Function to load teacher ID from local storage
  loadTeacherId(): void {
     try {
       const userDataString = localStorage.getItem('userData'); // Use your actual key
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

  // Fetch lessons for the logged-in teacher
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
          this.teacherLessons = lessons ?? []; // Handle null/undefined response
          if(this.teacherLessons.length === 0) {
            console.warn("Received an empty array of lessons.");
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error("Error fetching lessons:", error);
          this.teacherLessons = []; // Clear lessons on error
          alert(`Failed to load lessons. Status: ${error.status}. Check console for details.`);
        }
      });
  }

  // Method to add the very first question (always expanded)
  addInitialQuestion(): void {
    this.questionsViewModel.push({
        data: {
          id: 0, // Use 0 for new items
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A' // Default correct answer
        },
        isCollapsed: false // First question starts expanded
    });
  }

  // Method to add a new question AND collapse the previous one
  addQuestion(): void {
    // 1. Collapse the last question if it exists
    const lastIndex = this.questionsViewModel.length - 1;
    if (lastIndex >= 0) {
       this.questionsViewModel[lastIndex].isCollapsed = true;
    }

    // 2. Add the new blank question (expanded by default)
    this.questionsViewModel.push({
        data: {
          id: 0,
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A'
        },
        isCollapsed: false // New question is always expanded
    });
  }

  // Method to remove a question by its index
  removeQuestion(index: number): void {
    if (this.questionsViewModel.length > 1) {
        this.questionsViewModel.splice(index, 1);
        // Optional: If we removed the *last* question, ensure the *new last* question is expanded
        const newLastIndex = this.questionsViewModel.length - 1;
        if (newLastIndex >= 0 && this.questionsViewModel[newLastIndex].isCollapsed) {
             this.questionsViewModel[newLastIndex].isCollapsed = false; // Expand the new last one
        }
    } else {
        alert("A quiz must have at least one question.");
    }
  }

  // Method to manually toggle the collapsed state of a question
  toggleQuestionCollapse(index: number): void {
    if (this.questionsViewModel[index]) {
      // If we are expanding a question, optionally collapse others
      // if (!this.questionsViewModel[index].isCollapsed) {
      //    // Collapse all others (optional behavior)
      //    this.questionsViewModel.forEach((vm, i) => {
      //      if (i !== index) vm.isCollapsed = true;
      //    });
      // }
      this.questionsViewModel[index].isCollapsed = !this.questionsViewModel[index].isCollapsed;
    }
  }

  // Method to handle form submission
  onSubmit(): void {
    // Extract only the question data for the payload
    const questionsData: QuizQuestion[] = this.questionsViewModel
        .map(vm => ({ ...vm.data, id: 0 })); // Ensure ID is 0 for creation payload

    // Basic validation check
    if (!this.selectedLessonId || !this.quizData.examTitle.trim() || questionsData.length === 0 || questionsData.some(q => !q.questionText.trim())) {
      alert("Please select a lesson, enter a quiz title, and ensure all questions have text.");
      return;
    }

    // Construct the final payload
    const payload: ExamPayload = {
      id: 0, // Backend likely ignores or requires 0 for new exam
      examTitle: this.quizData.examTitle.trim(),
      examDescription: this.quizData.examDescription.trim(),
      grade: this.quizData.grade.trim(),
      lessonId: this.selectedLessonId,
      questions: questionsData
    };

    console.log("Submitting Quiz Payload:", JSON.stringify(payload, null, 2)); // Pretty print payload

    this.http.post(this.ADD_EXAM_API_URL, payload)
      .subscribe({
        next: (response) => { // Capture response if needed
          console.log("Quiz submitted successfully:", response);
          alert("Quiz submitted successfully!");
          this.resetForm(); // Clear the form on success
        },
        error: (error: HttpErrorResponse) => {
           console.error("Error submitting quiz:", error);
           let errorMsg = `Failed to submit quiz. Status: ${error.status}`;
           // Attempt to parse backend error message
           if (error.error) {
             if (typeof error.error === 'string') {
               errorMsg += `\nMessage: ${error.error}`;
             } else if (error.error.title) {
               errorMsg += `\n${error.error.title}`;
             } else if (error.error.message) { // Common structure
               errorMsg += `\nMessage: ${error.error.message}`;
             } else if (error.error.errors) { // Validation errors
               errorMsg += `\nValidation Errors: ${JSON.stringify(error.error.errors)}`;
             }
           }
           alert(errorMsg + "\nCheck console for more details.");
        }
      });
  }

  // Method to reset the form fields
  resetForm(): void {
     this.quizData = { examTitle: '', examDescription: '', grade: '' };
     this.questionsViewModel = []; // Clear the view model array
     this.addInitialQuestion(); // Add one blank, expanded question back
     this.selectedLessonId = null; // Reset lesson selection
  }


  trackQuestionByIndex(index: number, item: QuestionViewModel): number {
    // Using the index is a simple and effective tracking strategy here.
    return index;
  }

} // End of class