import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-alessons',
  imports: [],
  templateUrl: './upload-alessons.component.html',
  styleUrl: './upload-alessons.component.css'
})
export class UploadAlessonsComponent {
  @Output() backClicked = new EventEmitter<void>();

  goBack() {
    this.backClicked.emit();
  }
}
