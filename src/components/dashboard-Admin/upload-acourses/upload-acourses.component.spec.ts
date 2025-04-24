import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAcoursesComponent } from './upload-acourses.component';

describe('UploadAcoursesComponent', () => {
  let component: UploadAcoursesComponent;
  let fixture: ComponentFixture<UploadAcoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAcoursesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAcoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
