import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-acourses',
  imports: [],
  templateUrl: './upload-acourses.component.html',
  styleUrl: './upload-acourses.component.css'
})
export class UploadAcoursesComponent {
  @Output() backClicked = new EventEmitter<void>();

  goBack() {
    this.backClicked.emit();
  }
}
