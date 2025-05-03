// roadmap.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-roadmap',
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.css']
})
export class RoadmapComponent {
  steps = [
    {
      title: 'Choose Your Subjects',
      desc: 'Select 5–7 subjects including core (Math, English, Science) and electives'
    },
    {
      title: 'Register with British Council',
      desc: 'Register for IGCSE exams through the British Council Egypt'
    },
    {
      title: 'Study Plan',
      desc: 'Create a 2-year study plan covering all syllabus topics'
    },
    {
      title: 'Mock Exams',
      desc: 'Take practice exams to assess your readiness'
    },
    {
      title: 'Final Preparation',
      desc: 'Focus on past papers and exam techniques'
    },
    {
      title: 'Take Exams',
      desc: 'Sit for your IGCSE exams in May/June or Oct/Nov sessions'
    }
  ];
}
