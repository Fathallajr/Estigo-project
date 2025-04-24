import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAlessonsComponent } from './upload-alessons.component';

describe('UploadAlessonsComponent', () => {
  let component: UploadAlessonsComponent;
  let fixture: ComponentFixture<UploadAlessonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAlessonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAlessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
