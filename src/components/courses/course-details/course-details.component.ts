import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface CourseDetails {
  courseId: number;
  courseTitle: string;
  description: string;
  logo: string;
  price: number;
  teacherName: string;
  lessons: string[];
}

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css'
})
export class CourseDetailsComponent implements OnInit {
  course: CourseDetails | null = null;
  isContentExpanded: boolean = false;

  constructor(private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(params => {
      const courseId = params['id'];
      this.fetchCourseDetails(courseId);
    });
  }

  private async fetchCourseDetails(courseId: string): Promise<void> {
    const response = await fetch(`https://est.runasp.net/api/Course/${courseId}/details`);
    if (!response.ok) {
      throw new Error('Failed to fetch course details');
    }
    this.course = await response.json();
  }

  toggleContent(): void {
    this.isContentExpanded = !this.isContentExpanded;
  }
}
