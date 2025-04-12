import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router'; // Import ActivatedRoute and RouterModule
import { CommonModule } from '@angular/common';          // Import CommonModule for *ngFor, *ngIf etc.

interface Course {
  courseId: number;
  courseTitle: string;
  imageBase64: string; // Keep as string, prefix will be added
  price: number;
  teacherName: string;
}

@Component({
  selector: 'app-course-search',
  standalone: true, // Make sure it's standalone if others are
  imports: [
      CommonModule,   // Needed for *ngFor, *ngIf, async pipe etc.
      RouterModule    // Often needed in components displaying data (e.g., links)
  ],
  templateUrl: './course-search.component.html',
  styleUrl: './course-search.component.css'
})
export class CourseSearchComponent implements OnInit { // Implement OnInit

  courses: Course[] = [];
  searchTerm: string | null = null; // Store the search term from the route
  isLoading: boolean = false;
  error: string | null = null;

  // Inject ActivatedRoute to access route parameters
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.error = null;
    // Subscribe to route parameter changes
    this.route.paramMap.subscribe(params => {
      this.searchTerm = params.get('term'); // 'term' must match the route definition (:term)
      console.log('Search term received:', this.searchTerm);

      if (this.searchTerm) {
        this.fetchCourseDetails(this.searchTerm);
      } else {
        // Handle the case where no search term is provided (e.g., navigated to /course-s directly)
        console.log('No search term provided in the URL.');
        this.courses = []; // Clear previous results
        this.isLoading = false;
        // Optionally, display a message or default content
        this.error = "Please enter a search term in the header.";
      }
    });
  }

  async fetchCourseDetails(search: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.courses = []; // Clear previous results before fetching new ones

    try {
      const response = await fetch(`https://est.runasp.net/api/Course/search?keyword=${encodeURIComponent(search)}`); // Encode the search term for the URL
      if (!response.ok) {
        throw new Error(`Network response was not ok (Status: ${response.status})`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
          this.courses = data.map((course: any) => ({
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            imageBase64: course.imageBase64 , 
            price: course.price,
            teacherName: course.teacherName
          }));
      } else {
          console.warn("Received non-array data from API:", data);
          this.courses = []; // Ensure courses is an empty array
          this.error = "Unexpected data format received from server.";
      }


    } catch (error) {
      console.error('Error fetching courses:', error);
      this.error = 'Failed to fetch courses. Please try again later.';
      this.courses = []; // Clear courses on error
    } finally {
        this.isLoading = false; // Stop loading indicator regardless of success/failure
    }
  }
}