import { Component, OnInit, OnDestroy, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

declare var CanvasJS: any;

interface PredictionData {
  attendance_rate: number;
  average_quiz_score: number;
  quizzes_completion_rate: number;
  final_exam_attempts: number;
  final_exam_score: number;
  education_system_IGCSE: number;
}

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

  selectedNumber: number = 1; // Corresponds to categoryId
  studentId: string | null = null;
  predictionData: PredictionData | null = null;
  predictedGrade: string | null = null;
  educationSystem: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  private routeSub: Subscription | null = null;
  private dataSub: Subscription | null = null; 
  private charts: any[] = [];
  private shouldRenderCharts = false;

  ngOnInit(): void {
    this.getStudentIdFromLocalStorage();

    this.routeSub = this.route.paramMap.subscribe(params => {
      const numberParam = params.get('number');
      const newNumber = numberParam ? parseInt(numberParam, 10) : 1;

      if (newNumber !== this.selectedNumber || (!this.predictionData && !this.predictedGrade)) {
          this.selectedNumber = newNumber;
          this.clearPreviousState();
          if (this.studentId) {
              this.fetchAllData(); // Call the combined fetch function
          } else {
              this.isLoading = false;
          }
      }
    });
  }

  ngAfterViewChecked(): void {
      if (this.shouldRenderCharts && this.predictionData && !this.isLoading && typeof CanvasJS !== 'undefined') {
          this.renderCharts();
          this.shouldRenderCharts = false;
          this.cdRef.detectChanges();
      }
  }


  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.dataSub?.unsubscribe();
    this.destroyCharts();
  }

  private clearPreviousState(): void {
      this.predictionData = null;
      this.predictedGrade = null; 
      this.error = null;
      this.isLoading = true;
      this.shouldRenderCharts = false;
      this.destroyCharts();
  }

  private getStudentIdFromLocalStorage(): void {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.studentId = userData?.id ?? null;
        if (!this.studentId) {
           console.error('Student ID not found in userData:', userData);
           this.error = 'Student ID not found in local storage.';
           this.isLoading = false;
        }
      } else {
        this.error = 'User data not found in local storage.';
        this.isLoading = false;
      }
    } catch (e) {
      console.error('Error reading or parsing user data from local storage:', e);
      this.error = 'Failed to load student data.';
      this.isLoading = false;
    }
  }

  private fetchAllData(): void {
    if (!this.studentId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;
    const categoryId = this.selectedNumber; 
    const dataUrl = `https://localhost:5071/api/Prediction/model-values/${this.studentId}/${categoryId}`;
    const resultUrl = `https://localhost:5071/api/Prediction/model-result/${this.studentId}/${categoryId}`;

    const predictionData$ = this.http.get<PredictionData>(dataUrl).pipe(
        catchError(err => {
            console.error('API Error (Prediction Data):', err);
            return of(null);
        })
    );
    const predictionResult$ = this.http.get<PredictionResult>(resultUrl).pipe(
        catchError(err => {
            console.error('API Error (Prediction Result):', err);
            return of(null);
        })
    );

    // Use forkJoin to wait for both requests
    this.dataSub = forkJoin([predictionData$, predictionResult$]).subscribe({
      next: ([data, result]) => {
        let errors: string[] = [];

        if (data) {
            this.predictionData = data;
            this.educationSystem = data.education_system_IGCSE === 1 ? 'IGCSE' : 'EST';
            this.shouldRenderCharts = true; // Enable chart rendering
        } else {
            errors.push('Failed to fetch performance metrics.');
            this.shouldRenderCharts = false; // Disable chart rendering if data failed
        }

        if (result) {
            this.predictedGrade = result.predicted_grade;
        } else {
            errors.push('Failed to fetch predicted grade.');
            this.predictedGrade = null; // Ensure grade is null on error
        }

        this.isLoading = false; // Set loading false after both complete
        if (errors.length > 0) {
            this.error = errors.join(' ');
        }
        // No need to call renderCharts here, ngAfterViewChecked handles it
      },
      error: (err) => {
        console.error('Combined API Error:', err);
        this.error = 'An unexpected error occurred while fetching prediction details.';
        this.isLoading = false;
        this.shouldRenderCharts = false;
        this.predictionData = null;
        this.predictedGrade = null;
      }
    });
  }

 private renderCharts(): void {
     this.destroyCharts();

     if (this.predictionData) { // Ensure data exists before trying to use it
        this.createAttendanceChart('chartContainer1', this.predictionData.attendance_rate);
        this.createAvgQuizScoreChart('chartContainer2', this.predictionData.average_quiz_score);
        this.createCompletionRateChart('chartContainer3', this.predictionData.quizzes_completion_rate);
     }
  }

  private createChart(containerId: string, options: any): any {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
        console.error(`Chart container with ID '${containerId}' not found in the DOM.`);
        const errorContainer = document.createElement('div');
        errorContainer.textContent = `Chart container '${containerId}' missing.`;
        errorContainer.style.color = 'red';
        const chartsGrid = document.querySelector('.charts-grid');
        chartsGrid?.appendChild(errorContainer);
        return null;
    }

    try {
        const chart = new CanvasJS.Chart(containerId, options);
        chart.render();
        this.charts.push(chart);
        return chart;
    } catch (e) {
        console.error(`Error rendering chart in container '${containerId}':`, e);
        const errorMessage = `Could not render chart '${options?.title?.text || containerId}'.`;
        this.error = this.error ? `${this.error}\n${errorMessage}` : errorMessage;
        containerElement.innerHTML = 'Chart failed to load.';
        return null;
    }
  }

  private createAttendanceChart(containerId: string, rate: number): void {
    this.createChart(containerId, {
      theme: "light2",
      exportEnabled: false,
      animationEnabled: true,
      title: { text: `Attendance Rate` },
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true,
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y}%",
        dataPoints: [
          { y: rate, label: "Attended" },
          { y: 100 - rate, label: "Absent" },
        ]
      }]
    });
  }

  private createAvgQuizScoreChart(containerId: string, score: number): void {
    this.createChart(containerId, {
      theme: "light2",
      exportEnabled: false,
      animationEnabled: true,
      title: { text: `Average Quiz Score` },
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true,
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y}%",
        dataPoints: [
          { y: score, label: "Score Achieved" },
          { y: 100 - score, label: "Possible Improvement" },
        ]
      }]
    });
  }

  private createCompletionRateChart(containerId: string, rate: number): void {
    this.createChart(containerId, {
      theme: "light2",
      exportEnabled: false,
      animationEnabled: true,
      title: { text: `Quizzes Completion Rate` },
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true,
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y}%",
        dataPoints: [
          { y: rate, label: "Completed" },
          { y: 100 - rate, label: "Not Completed" },
        ]
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
            if(chart.container && chart.container.id) {
                const el = document.getElementById(chart.container.id);
                if (el) el.innerHTML = '';
            }
        }
      }
    });
    this.charts = [];
  }
}