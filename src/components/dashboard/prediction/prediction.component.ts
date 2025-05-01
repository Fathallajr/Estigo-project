declare var CanvasJS: any;
import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  styleUrls: ['./prediction.component.css']
})
export class PredictionComponent implements AfterViewInit {

  private readonly containers = [
    'chartContainer1',
    'chartContainer2',
    'chartContainer3',
    'chartContainer4'
  ];

  ngAfterViewInit(): void {
    // نعمل ريندر لكل واحد فيهم
    this.containers.forEach(id => this.createChart(id));
  }

  private createChart(containerId: string): void {
    const chart = new CanvasJS.Chart(containerId, {
      theme: "light2",
      exportEnabled: false,
      animationEnabled: true,
      title: { text: "Exp prediction" },
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y}%",
        showInLegend: true,
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y}%",
        dataPoints: [
          { y: 50, label: "success" },
          { y: 20, label: "failed" },
          
        ]
      }]
    });
    chart.render();
  }
}
