// src/app/routes.ts (or your main routing file)

import { Routes } from '@angular/router';
import { HomePageComponent } from '../pages/home-page/home-page.component';
import { CoursesPageComponent } from '../pages/courses-page/courses-page.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component'; // Student Dashboard
// import { TeacherDashboardPageComponent } from '../pages/teacher-dashboard-page/teacher-dashboard-page.component'; // Assuming you have one for MainTcontentComponent
import { AboutUsComponent } from '../pages/about-us/about-us.component';
import { LoginComponent } from '../pages/login/login.component';
import { PaymentComponent } from '../pages/payment/payment.component';
import { RegisterComponent } from '../pages/register/register.component';
import { RoadmapComponent } from '../pages/roadmap/roadmap.component';
import { CourseVideoComponent } from './../pages/course-video/course-video.component';
import { CourseDetailsComponent } from '../components/courses/course-details/course-details.component';
import { CourseVmComponent } from '../components/courses/course-vm/course-vm.component';
import { CourseSearchComponent } from '../components/courses/course-search/course-search.component';
import { MycoursePageComponent } from '../components/dashboard/mycourse-page/mycourse-page.component';
import { QuizComponent } from '../components/dashboard/quiz/quiz.component';
import { PredictionComponent } from '../components/dashboard/prediction/prediction.component'; // Used by both students and teachers
import { AuthGuard } from '../guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'courses', component: CoursesPageComponent},

    // Student Dashboard (likely hosts MainContentComponent)
    { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent},

    // Teacher Dashboard (assuming MainTcontentComponent is part of a teacher-specific dashboard page)
    // Example: If MainTcontentComponent is directly routable or part of a TeacherDashboardPageComponent
    // { path: 'teacher-dashboard', canActivate: [AuthGuard], component: TeacherDashboardPageComponent },
    // If MainTcontentComponent is the TeacherDashboardPageComponent itself, you might have:
    // { path: 'teacher-dashboard', canActivate: [AuthGuard], component: MainTcontentComponent }, // Adjust if needed

    { path: "aboutus", component: AboutUsComponent},
    { path: "login", component: LoginComponent},
    { path: "payment/:id", component: PaymentComponent},
    { path: "register", component: RegisterComponent},
    { path: "roadmap", component: RoadmapComponent},
    { path: "video", component: CourseVideoComponent},
    { path: "course/:id", component: CourseDetailsComponent},
    { path: "course-vm/:id", component: CourseVmComponent},
    { path: 'course-s/:term', component: CourseSearchComponent },
    { path: "myCourse/:id", component: MycoursePageComponent},
    { path: "quiz/:id", component: QuizComponent},

    // ROUTE 1: For a student viewing their OWN prediction for a specific category
    // Navigated to by MainContentComponent (student dashboard)
    {
        path: "predict/:categoryId",
        component: PredictionComponent,
        canActivate: [AuthGuard] // Student needs to be logged in
    },

    // ROUTE 2: For a teacher/parent viewing a SPECIFIC STUDENT's prediction
    // Navigated to by MainTcontentComponent (teacher dashboard)
    {
        path: 'student-prediction/:studentId/:categoryId',
        component: PredictionComponent,
        canActivate: [AuthGuard] // Teacher/Parent needs to be authenticated
    },

    // Default and wildcard routes (adjust as needed)
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // Or '/home'
    // { path: '**', redirectTo: '/dashboard' } // Or a 404 page
];