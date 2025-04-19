import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-main-acontent',
  imports: [],
  templateUrl: './main-acontent.component.html',
  styleUrl: './main-acontent.component.css'
})
export class MainAcontentComponent {
  @Output() navigateToSettings = new EventEmitter<void>();

  onSystemSettingsClick() {
    this.navigateToSettings.emit();
  }
}
