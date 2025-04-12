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
  selector: 'app-english',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './english.component.html',
  styleUrl: './english.component.css'
})
export class EnglishComponent implements OnInit {
  courses: Course[] = [];

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('https://est.runasp.net/api/Course/category/limited/5');
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
