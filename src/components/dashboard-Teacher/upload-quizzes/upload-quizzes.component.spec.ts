import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadQuizzesComponent } from './upload-quizzes.component';

describe('UploadQuizzesComponent', () => {
  let component: UploadQuizzesComponent;
  let fixture: ComponentFixture<UploadQuizzesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadQuizzesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadQuizzesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
