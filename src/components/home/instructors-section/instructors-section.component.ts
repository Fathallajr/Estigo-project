import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-instructors-section',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './instructors-section.component.html',
  styleUrl: './instructors-section.component.css'
})
export class InstructorsSectionComponent {
 

}