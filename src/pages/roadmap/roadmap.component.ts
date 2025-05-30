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
      desc: 'Select required EST subjects (EST I, EST II) based on your target university and faculty requirements in Egypt.'
    },
    {
      title: 'Register for EST',
      desc: 'Register for EST exams through the official EST platform during the designated registration periods.'
    },
    {
      title: 'EST Study Plan',
      desc: 'Create a comprehensive study plan focusing on Math, English, and subject tests for EST II if applicable.'
    },
    {
      title: 'Take Official Practice Tests',
      desc: 'Utilize official EST practice tests to familiarize yourself with the exam format and question types.'
    },
    {
      title: 'Review and Targeted Practice',
      desc: 'Identify weak areas from practice tests and focus your revision on those topics. Practice consistently.'
    },
    {
      title: 'Sit for EST Exams',
      desc: 'Take your EST exams on the scheduled dates. Ensure you are familiar with test center regulations.'
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