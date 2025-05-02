import { CourseVmComponent } from '../components/courses/course-vm/course-vm.component';
import { Routes } from '@angular/router';
import { HomePageComponent } from '../pages/home-page/home-page.component';
import { CoursesPageComponent } from '../pages/courses-page/courses-page.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { AboutUsComponent } from '../pages/about-us/about-us.component';
import { LoginComponent } from '../pages/login/login.component';
import { PaymentComponent } from '../pages/payment/payment.component';
import { RegisterComponent } from '../pages/register/register.component';
import { RoadmapComponent } from '../pages/roadmap/roadmap.component';
import { CourseVideoComponent } from './../pages/course-video/course-video.component';
import { CourseDetailsComponent } from '../components/courses/course-details/course-details.component';
import { CourseSearchComponent } from '../components/courses/course-search/course-search.component';
import { MycoursePageComponent } from '../components/dashboard/mycourse-page/mycourse-page.component';
import { QuizComponent } from '../components/dashboard/quiz/quiz.component';
import { AuthGuard } from '../guards/auth.guard';
import { PredictionComponent } from '../components/dashboard/prediction/prediction.component';



export const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'courses', component: CoursesPageComponent},
    {path:  'dashboard' , canActivate: [AuthGuard], component: DashboardComponent},
    {path: "aboutus", component: AboutUsComponent},
    {path: "login", component:LoginComponent},
     {path: "payment/:id", component:PaymentComponent},
     {path:"register",component:RegisterComponent},
     {path:"roadmap",component:RoadmapComponent},
     {path:"video",component:CourseVideoComponent},
     {path:"course/:id",component:CourseDetailsComponent},
     {path:"course-vm/:id",component:CourseVmComponent},
     { path: 'course-s/:term', component: CourseSearchComponent },
     {path:"myCourse/:id",component:MycoursePageComponent},
     {path:"quiz/:id",component:QuizComponent},
     {path:"predict",component:PredictionComponent},
     {path:"predict/:number",component:PredictionComponent}
     
];