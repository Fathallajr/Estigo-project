import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAQuizzesComponent } from './upload-aquizzes.component';

describe('UploadAQuizzesComponent', () => {
  let component: UploadAQuizzesComponent;
  let fixture: ComponentFixture<UploadAQuizzesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAQuizzesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAQuizzesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
