import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Course {
  courseId: number;
  courseTitle: string;
  imageBase64: string;
  price: number;
  teacherName: string;
}

@Component({
  selector: 'app-math',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './math.component.html',
  styleUrl: './math.component.css'
})
export class MathComponent implements OnInit {
  courses: Course[] = [];

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('http://est.runasp.net/api/Course/category/limited/1');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      this.courses = data;
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }
}
