import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FirestoreDataService } from '../firestore-data.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MatCardModule,RouterOutlet,CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  userIds: any[] = [];

  constructor(
    private firestoreDataService: FirestoreDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('AppComponent Initialized');
    if (this.userIds.length === 0) { // Check to avoid multiple fetches
      console.log('Fetching user list...');
      this.firestoreDataService.getUserList().subscribe((data) => {
        this.userIds = data.map((item) => item.id);
        console.log('Fetched User IDs:', this.userIds);
      });
    }
  }

  // Handle card click to navigate to user details page
  onCardClick(userId: string) {
    this.router.navigate([`/user/${userId}`]);
  }
}
