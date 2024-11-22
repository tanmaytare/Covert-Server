import { Routes } from '@angular/router';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },// Redirect to a default route
  { path: 'home', component: LayoutComponent }, // Make sure this route doesn't cause duplication
  { path: 'user/:id', component: UserDetailComponent }  // User detail page
];
