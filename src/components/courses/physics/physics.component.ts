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
  selector: 'app-physics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.css'
})
export class PhysicsComponent implements OnInit {
  courses: Course[] = [];

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('https://est.runasp.net/api/Course/category/limited/2');
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
