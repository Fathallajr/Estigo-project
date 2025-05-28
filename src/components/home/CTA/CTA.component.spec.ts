import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassManagementSectionComponent } from './CTA.component';

describe('ClassManagementSectionComponent', () => {
  let component: ClassManagementSectionComponent;
  let fixture: ComponentFixture<ClassManagementSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassManagementSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassManagementSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
