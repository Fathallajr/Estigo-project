declare var CanvasJS: any;

import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  styleUrls: ['./prediction.component.css']
})
export class PredictionComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const chart = new CanvasJS.Chart("chartContainer", {
      theme: "light2",
      exportEnabled: false,
      animationEnabled: true,
      title: {
        text: "EstiGo prediction"
      },
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: "true",
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y}%",
        dataPoints: [
          { y: 50, label: "Attendance" },
          { y: 20, label: "Avg quiz score" },
         { y: 20, label: "Final Exam Score" },
         { y: 10, label: "Student Exam Avg" },
        ]
      }]
    });
    chart.render();
  }
}
