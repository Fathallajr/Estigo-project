import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-aquizzes',
  imports: [],
  templateUrl: './upload-aquizzes.component.html',
  styleUrl: './upload-aquizzes.component.css'
})
export class UploadAQuizzesComponent {
  @Output() backClicked = new EventEmitter<void>();

  goBack() {
    this.backClicked.emit();
  }
}
