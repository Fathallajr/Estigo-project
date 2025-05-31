import { Component, OnInit, OnDestroy, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of, Observable, ObservableInput } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

declare var CanvasJS: any; // Make sure CanvasJS is loaded globally or imported correctly

// Interface for user data stored in localStorage
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string; // "Student" or "Teacher"
}

// Interface for the prediction data from /model-values endpoint
interface PredictionData {
  attendance_rate: number;
  average_quiz_score: number;
  quizzes_completion_rate: number;
  final_exam_attempts: number;
  final_exam_score: number;
  education_system_IGCSE: number; // Assuming 1 for IGCSE, 0 for EST
}

// Interface for the prediction result from /model-result endpoint
interface PredictionResult {
  predicted_grade: string;
}

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './prediction.component.html',
  styleUrls: ['./prediction.component.css']
})
export class PredictionComponent implements OnInit, OnDestroy, AfterViewChecked {

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);

  // State properties
  categoryId: number = 1;
  targetStudentId: string | null = null;
  targetStudentName: string | null = null;

  predictionData: PredictionData | null = null;
  predictedGrade: string | null = null;
  educationSystem: string = '';

  isLoading: boolean = true;
  error: string | null = null;
  loggedInUser: UserData | null = null;

  private subscriptions: Subscription = new Subscription();
  private charts: any[] = [];
  private shouldRenderCharts = false;

  ngOnInit(): void {
    this.loadLoggedInUser();

    if (!this.loggedInUser) {
      this.error = "User data not found. Please log in to view predictions.";
      this.isLoading = false;
      return;
    }

    const routeParamsSub = this.route.paramMap.pipe(
      tap((params: ParamMap) => {
        this.clearPreviousState(); // Reset visual state, but not studentId/categoryId yet
        this.isLoading = true; // Assume loading will start
        this.error = null; // Clear previous errors

        const categoryParam = params.get('categoryId');
        this.categoryId = categoryParam ? parseInt(categoryParam, 10) : 1;

        if (this.loggedInUser?.role === 'Teacher' || this.loggedInUser?.role === 'Parent') {
          const studentIdFromRoute = params.get('studentId');
          if (studentIdFromRoute) {
            this.targetStudentId = studentIdFromRoute;
            this.targetStudentName = null; // Reset, would need to fetch if required
          } else {
            this.error = "Teachers must select a specific student. Student ID missing in URL.";
            this.isLoading = false; // Stop loading, error occurred
            this.targetStudentId = null;
          }
        } else if (this.loggedInUser?.role === 'Student') {
          this.targetStudentId = this.loggedInUser.id;
          this.targetStudentName = this.loggedInUser.name;
        } else {
          this.error = "Unable to determine user role or student for predictions.";
          this.isLoading = false; // Stop loading, error occurred
          this.targetStudentId = null;
        }
      }),
      switchMap((): ObservableInput<[PredictionData | null, PredictionResult | null] | null> => {
        if (this.targetStudentId && this.isLoading) { // Check isLoading; if false, an error occurred in tap
          return this.fetchPredictionDetails();
        } else {
          // If no targetStudentId or error in tap, complete without fetching by returning of(null)
          // isLoading would already be false if an error in tap occurred
          return of(null);
        }
      })
    ).subscribe({
      next: (apiResult) => { // apiResult is [PredictionData | null, PredictionResult | null] | null
        if (apiResult === null) {
 
            if (!this.error && !this.targetStudentId) {
                 this.error = "Cannot load predictions without a student context.";
            }
            if(!this.error && this.targetStudentId) { // fetchPredictionDetails might have returned null due to its own handled error
                 this.error = "Failed to retrieve some or all prediction details.";
            }
            this.isLoading = false; // Ensure loading is false
            return;
        }

        // apiResult is [data, result]
        const [data, result] = apiResult;
        let errorsAccumulator: string[] = [];

        if (data) {
          this.predictionData = data;
          this.educationSystem = data.education_system_IGCSE === 1 ? 'IGCSE' : 'EST';
          this.shouldRenderCharts = true;
        } else {
          errorsAccumulator.push('Failed to fetch performance metrics.');
          this.shouldRenderCharts = false;
        }

        if (result) {
          this.predictedGrade = result.predicted_grade;
        } else {
          errorsAccumulator.push('Failed to fetch predicted grade.');
          this.predictedGrade = null;
        }

        if (errorsAccumulator.length > 0) {
          this.error = errorsAccumulator.join(' ');
          if (!data && !result) this.predictionData = null; // Ensure data is null if both API calls fail
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error in prediction data pipeline:", err);
        this.error = "An unexpected error occurred while loading prediction data.";
        this.isLoading = false;
        this.predictionData = null;
        this.predictedGrade = null;
        this.shouldRenderCharts = false;
      }
    });
    this.subscriptions.add(routeParamsSub);
  }

  ngAfterViewChecked(): void {
    if (this.shouldRenderCharts && this.predictionData && !this.isLoading && typeof CanvasJS !== 'undefined' && CanvasJS.Chart) {
      this.renderCharts();
      this.shouldRenderCharts = false;
      this.cdRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  private clearPreviousState(): void {
    // Clears data related to the previous fetch, not studentId/categoryId which are from route
    this.predictionData = null;
    this.predictedGrade = null;
    this.educationSystem = '';
    // this.error = null; // Error is cleared at the start of the tap operator
    // this.isLoading = true; // isLoading is set at the start of the tap operator
    this.shouldRenderCharts = false;
    this.destroyCharts();
  }

  private loadLoggedInUser(): void {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        this.loggedInUser = JSON.parse(userDataString) as UserData;
        if (!this.loggedInUser?.id || !this.loggedInUser?.role) {
          console.error('Critical user data (ID or Role) missing from localStorage:', this.loggedInUser);
          this.loggedInUser = null;
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        this.loggedInUser = null;
      }
    }
  }

  private fetchPredictionDetails(): Observable<[PredictionData | null, PredictionResult | null]> {
    // targetStudentId is assumed to be valid here due to checks in switchMap condition
    // isLoading is managed by the main pipeline (tap/subscribe)

    const dataUrl = `https://estigo.tryasp.net/api/Prediction/model-values/${this.targetStudentId}/${this.categoryId}`;
    const resultUrl = `https://estigo.tryasp.net/api/Prediction/model-result/${this.targetStudentId}/${this.categoryId}`;

    const predictionData$ = this.http.get<PredictionData>(dataUrl).pipe(
      catchError(err => {
        console.error('API Error fetching Prediction Data:', err);
        return of(null); // Return null for this stream on error
      })
    );

    const predictionResult$ = this.http.get<PredictionResult>(resultUrl).pipe(
      catchError(err => {
        console.error('API Error fetching Prediction Result:', err);
        return of(null); // Return null for this stream on error
      })
    );

    return forkJoin([predictionData$, predictionResult$]).pipe(
      catchError(forkJoinError => {
        console.error('Unexpected error in forkJoin for prediction details:', forkJoinError);
        // Ensure the main pipeline's `next` handler still receives a value of the expected type.
        return of([null, null] as [PredictionData | null, PredictionResult | null]);
      })
    );
  }

  private renderCharts(): void {
    this.destroyCharts();

    if (this.predictionData && typeof CanvasJS !== 'undefined' && CanvasJS.Chart) {
      this.createAttendanceChart('chartContainer1', this.predictionData.attendance_rate);
      this.createAvgQuizScoreChart('chartContainer2', this.predictionData.average_quiz_score);
      this.createCompletionRateChart('chartContainer3', this.predictionData.quizzes_completion_rate);
    } else if (!this.predictionData) {
        console.warn("RenderCharts called but predictionData is null.");
    } else if (typeof CanvasJS === 'undefined' || !CanvasJS.Chart) {
        console.error("CanvasJS or CanvasJS.Chart is not available for rendering charts.");
        const chartErrorMsg = "Chart library failed to load.";
        this.error = this.error ? `${this.error} ${chartErrorMsg}` : chartErrorMsg;
    }
  }

  private createChart(containerId: string, options: any): any {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
      console.error(`Chart container with ID '${containerId}' not found.`);
      const chartErrorMsg = `Chart container '${containerId}' missing.`;
      this.error = this.error ? `${this.error} ${chartErrorMsg}` : chartErrorMsg;
      return null;
    }
    if (typeof CanvasJS === 'undefined' || !CanvasJS.Chart) {
        console.error("CanvasJS or CanvasJS.Chart is not available for chart creation.");
        containerElement.innerHTML = '<p style="color: red;">Chart library not loaded.</p>';
        return null;
    }

    try {
      const chart = new CanvasJS.Chart(containerId, options);
      chart.render();
      this.charts.push(chart);
      return chart;
    } catch (e) {
      console.error(`Error rendering chart in container '${containerId}':`, e);
      const chartErrorMsg = `Failed to render chart: ${options?.title?.text || containerId}.`;
      this.error = this.error ? `${this.error} ${chartErrorMsg}` : chartErrorMsg;
      if (containerElement) containerElement.innerHTML = '<p style="color: red;">Chart failed to load.</p>';
      return null;
    }
  }

  private createAttendanceChart(containerId: string, rate: number): void {
    if (rate === undefined || rate === null) { console.warn(`Attendance rate data missing for chart ${containerId}`); return; }
    this.createChart(containerId, {
      theme: "light2", exportEnabled: false, animationEnabled: true,
      title: { text: `Attendance Rate` },
      data: [{
        type: "pie", startAngle: 25, toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true, legendText: "{label}", indexLabelFontSize: 16, indexLabel: "{label} - {y}%",
        dataPoints: [ { y: rate, label: "Attended" }, { y: 100 - rate, label: "Absent" } ]
      }]
    });
  }

  private createAvgQuizScoreChart(containerId: string, score: number): void {
    if (score === undefined || score === null) { console.warn(`Average quiz score data missing for chart ${containerId}`); return; }
    this.createChart(containerId, {
      theme: "light2", exportEnabled: false, animationEnabled: true,
      title: { text: `Average Quiz Score` },
      data: [{
        type: "pie", startAngle: 25, toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true, legendText: "{label}", indexLabelFontSize: 16, indexLabel: "{label} - {y}%",
        dataPoints: [ { y: score, label: "Score Achieved" }, { y: 100 - score, label: "Possible Improvement" }]
      }]
    });
  }

  private createCompletionRateChart(containerId: string, rate: number): void {
    if (rate === undefined || rate === null) { console.warn(`Quiz completion rate data missing for chart ${containerId}`); return; }
    this.createChart(containerId, {
      theme: "light2", exportEnabled: false, animationEnabled: true,
      title: { text: `Quizzes Completion Rate` },
      data: [{
        type: "pie", startAngle: 25, toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true, legendText: "{label}", indexLabelFontSize: 16, indexLabel: "{label} - {y}%",
        dataPoints: [ { y: rate, label: "Completed" }, { y: 100 - rate, label: "Not Completed" }]
      }]
    });
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          console.warn("Error destroying chart:", e);
          if (chart.container && chart.container.id) {
            const el = document.getElementById(chart.container.id);
            if (el) el.innerHTML = '';
          }
        }
      }
    });
    this.charts = [];
  }
}