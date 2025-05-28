import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../../components/home/hero-section/hero-section.component';
import { FeaturesSectionComponent } from '../../components/home/features-section/features-section.component';
import { WhatIsEstigoSectionComponent } from '../../components/home/what-is-estigo-section/what-is-estigo-section.component';
import { ClassroomSectionComponent } from '../../components/home/classroom-section/classroom-section.component';
import { InterfaceSectionComponent } from '../../components/home/interface-section/interface-section.component';
import { ToolsSectionComponent } from '../../components/home/tools-section/tools-section.component';
import { AssessmentsSectionComponent } from '../../components/home/assessments-section/assessments-section.component';
import { ClassManagementSectionComponent } from '../../components/home/CTA/CTA.component';
import { PopularCoursesSectionComponent } from '../../components/home/popular-courses-section/popular-courses-section.component';
import { InstructorsSectionComponent } from '../../components/home/instructors-section/instructors-section.component';
import { GHeaderProfileComponent } from "../../shared/g-header-profile/g-header-profile.component";
import { FooterComponent } from '../../shared/footer/footer.component';
import { GHeaderNotUserComponent } from '../../shared/g-header-not-user/g-header-not-user.component';


@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [
    CommonModule,
    HeroSectionComponent,
    FeaturesSectionComponent,
    WhatIsEstigoSectionComponent,
    ClassroomSectionComponent,
    InterfaceSectionComponent,
    ToolsSectionComponent,
    AssessmentsSectionComponent,
    ClassManagementSectionComponent,
    PopularCoursesSectionComponent,
    InstructorsSectionComponent,
    FooterComponent,
    GHeaderProfileComponent,
    GHeaderNotUserComponent
],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

}