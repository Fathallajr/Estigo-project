import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GHeaderNotUserComponent } from '../../shared/g-header-not-user/g-header-not-user.component'; 
import { FooterComponent } from '../../shared/footer/footer.component';
import { GHeaderProfileComponent } from '../../shared/g-header-profile/g-header-profile.component'; 
import { MathComponent } from "../../components/courses/math/math.component";
import { BiologyComponent } from "../../components/courses/biology/biology.component";
import { EnglishComponent } from "../../components/courses/english/english.component";
import { PhysicsComponent } from "../../components/courses/physics/physics.component";
import { ChemistryComponent } from "../../components/courses/chemistry/chemistry.component";


@Component({
  selector: 'app-courses-page',
  standalone: true,
  imports: [CommonModule, FooterComponent, GHeaderProfileComponent, GHeaderNotUserComponent, MathComponent, BiologyComponent, EnglishComponent, PhysicsComponent, ChemistryComponent],
  templateUrl: './courses-page.component.html',
  styleUrl: './courses-page.component.css'
})
export class CoursesPageComponent {
  

}