// roadmap.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- IMPORT CommonModule

interface RoadmapStep {
  title: string;
  desc: string;
}

@Component({
  selector: 'app-roadmap',
  standalone: true, // <--- MARK as standalone
  imports: [CommonModule], // <--- IMPORT CommonModule here
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.css']
})
export class RoadmapComponent {
  selectedRoadmap: 'EST' | 'IG' | null = null;
  currentRoadmapTitle: string = '';
  currentSteps: RoadmapStep[] = [];

  // Placeholder data for EST Roadmap
  estSteps: RoadmapStep[] = [
    {
      title: 'EST Subject Selection',
      desc: 'Choose which EST modules you need (e.g., EST I, EST II) based on the faculty requirements of your target university.'
    },
    {
      title: 'Create a Study Plan',
      desc: 'Develop a schedule covering core topics like Math and English, and include any specific EST II subjects if required. Plan daily or weekly study sessions.'
    },
    {
      title: 'Register for the EST Exam',
      desc: 'Sign up on the official EST platform during registration period. Make sure to pay fees on time and save your confirmation.'
    },
    {
      title: 'Practice with Official Mock Tests',
      desc: 'Take real EST practice exams under timed conditions to get familiar with question types and exam format.'
    },
    {
      title: 'Review Weak Areas & Practice',
      desc: 'After each mock test, identify your weak topics and focus revision on them. Use extra resources (books, videos) to strengthen these points.'
    },
    {
      title: 'Sit for the EST Exam & Follow Up',
      desc: 'Take the actual EST on the scheduled date. After results are out, check your score and decide if you need to retake any module or proceed with university application.'
    }
  ];

  // Existing IGCSE data
  igcseSteps: RoadmapStep[] = [
    {
      title: 'Choose Your Subjects',
      desc: 'Select 5–7 subjects including core subjects (Math, English, Science) and electives relevant to your future studies.'
    },
    {
      title: 'Register with British Council',
      desc: 'Register for IGCSE exams through the British Council Egypt for the desired examination session.'
    },
    {
      title: 'Create a 2-Year Study Plan',
      desc: 'Develop a detailed 2-year study plan covering all syllabus topics for your chosen IGCSE subjects.'
    },
    {
      title: 'Take Mock Exams',
      desc: 'Regularly take practice and mock exams to assess your understanding and exam readiness.'
    },
    {
      title: 'Focus on Past Papers',
      desc: 'Intensively work through past papers and refine your exam techniques and time management skills.'
    },
    {
      title: 'Sit for IGCSE Exams',
      desc: 'Sit for your IGCSE exams in the May/June or October/November examination sessions.'
    }
  ];

  showRoadmap(type: 'EST' | 'IG') {
    console.log('showRoadmap called with type:', type);

    // If the same button is clicked again, hide the roadmap (toggle behavior)
    if (this.selectedRoadmap === type) {
      this.selectedRoadmap = null;
      this.currentRoadmapTitle = '';
      this.currentSteps = [];
      console.log('Toggling off. selectedRoadmap:', this.selectedRoadmap);
      return;
    }

    this.selectedRoadmap = type;
    console.log('selectedRoadmap set to:', this.selectedRoadmap);

    if (type === 'EST') {
      this.currentRoadmapTitle = 'EST Qualification Roadmap in Egypt';
      this.currentSteps = this.estSteps;
    } else if (type === 'IG') {
      this.currentRoadmapTitle = 'IGCSE Qualification Roadmap in Egypt';
      this.currentSteps = this.igcseSteps;
    }
    console.log('Current title:', this.currentRoadmapTitle);
    console.log('Current steps:', this.currentSteps);
  }
}