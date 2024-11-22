import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FirestoreDataService } from '../firestore-data.service';
import { ActivatedRoute } from '@angular/router';
import { log } from 'console';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent {
  userId: string | null = null;
  firestore: Firestore = inject(Firestore);
  data: any[] = [];

  // Old code remains intact, no change here.
  constructor(private route: ActivatedRoute, private firestoreDataService: FirestoreDataService) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    console.log('Extracted User ID:', this.userId);

    this.firestoreDataService.getUserData(this.userId).subscribe(data => {


      if (Array.isArray(data)) {
        this.data = data.map(item => {
          return {
            ...item,
            contacts: this.parseJsonArray(item.contacts || '[]'),
            callLogs: this.parseJsonArray(item.callLogs || '[]'),
            smsLogs: this.parseJsonArray(item.smsLogs || '[]'),
            location: this.parseLocation(item.location || '{}'),
            showContacts: false,
            showCallLogs: false,
            showSmsLogs: false
          };
        });
      } else if (data && typeof data === 'object') {
        this.data = [{
          ...data,
          contacts: this.parseJsonArray(data.contacts || '[]'),
          callLogs: this.parseJsonArray(data.callLogs || '[]'),
          smsLogs: this.parseJsonArray(data.smsLogs || '[]'),
          location: this.parseLocation(data.location || '{}'),
          showContacts: false,
          showCallLogs: false,
          showSmsLogs: false
        }];
      }


      this.checkSafety();
    });


  }

  toggleData(type: string, item: any): void {
    switch (type) {
      case 'contacts':
        item.showContacts = !item.showContacts;
        break;
      case 'callLogs':
        item.showCallLogs = !item.showCallLogs;
        break;
      case 'smsLogs':
        item.showSmsLogs = !item.showSmsLogs;
        break;
    }
  }

  private parseJsonArray(jsonString: string): any[] {
    if (!jsonString) {
      console.warn('Received empty string for JSON parsing');
      return []; // Return an empty array if the string is empty
    }

    // Modify the JSON string to ensure valid formatting
    let modifiedJsonString = jsonString
      .replace(/([{,])\s*(\w+)\s*=/g, '$1"$2":') // Wrap keys in quotes
      .replace(/date=([\dT:+-]+)/g, '"date":"$1"') // Fix date format for "date" keys
      .replace(/:\s*([^,"{}]+)/g, ': "$1"') // Wrap unquoted values in quotes
      .replace(/=\s*/g, ': ') // Replace equals with colons
      .replace(/""/g, '"') // Remove extra quotes
      .replace(/"(\s+)/g, '"$1') // Remove spaces right after quotes
      .replace(/([,":])\s*"/g, '$1"') // Remove spaces before opening quotes
      .replace(/"\s*(\w)/g, '"$1') // Ensure no space before word after quote
      .replace(/"\s*([^"]+?)\s*"/g, '"$1"') // Trim spaces around strings
      .replace(/(\d{4}-\d{2}-\d{2}T\d{2}): (\d{2}:\d{2}[+-]\d{4})/g, '$1$2') // Fix date format
      .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
      .replace(/:\s*""/g, ': ""') // Fix empty string values
      .replace(/"(.*?)"/g, (match) => match.replace(/(\s+)/g, ' ')); // Fix any extra spaces inside strings

    try {
      return JSON.parse(modifiedJsonString);
    } catch (error: any) {

      // Fallback: Attempt to parse known structures
      const fallbackData = this.handleFallbackParsing(modifiedJsonString);
      return fallbackData || []; // Return fallback data or empty array
    }
  }


  private handleFallbackParsing(fallbackString: string): any[] {
    const fallbackData: any[] = [];

    // Extract individual JSON-like objects
    const matches = fallbackString.match(/(\{[^}]*\})/g);
    if (matches) {
      matches.forEach(match => {
        try {
          // Clean and fix formatting issues in the extracted string
          const cleanedString = match
            .replace(/(\w+)\s*=/g, '"$1":') // Replace key=value with "key":
            .replace(/:\s*([^",}]+)/g, ': "$1"') // Quote unquoted values
            .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
            .replace(/"([ ]+|")/g, '"') // Remove spaces right after quotes
            .replace(/([,":])\s*"/g, '$1"') // Remove spaces before opening quotes
            .replace(/"\s*(\w)/g, '"$1'); // Ensure no space before word after quote

          const parsedObject = JSON.parse(cleanedString);
          fallbackData.push(parsedObject);
        } catch (e: any) {
          console.warn('Fallback parsing error:');
        }
      });
    }

    return fallbackData;
  }

  private parseLocation(locationString: string): { latitude: number | null; longitude: number | null } {
    if (!locationString) {
      console.warn('Received empty string for location parsing');
      return { latitude: null, longitude: null }; // Return null values if the string is empty
    }


    // Remove the braces and replace the '=' with ':'
    const modifiedLocationString = locationString
      .replace(/[{}]/g, '') // Remove curly braces
      .replace(/(\w+)=/g, '"$1":') // Wrap keys in quotes
      .replace(/,/g, ', '); // Ensure proper spacing for JSON



    try {
      const locationData = JSON.parse(`{${modifiedLocationString}}`);
      return {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };
    } catch (error: any) {
      console.error('Parsing error for location:');
      return { latitude: null, longitude: null }; // Return null values on error
    }
  }

  // New functionality starts here

  userName: string = '';  // To store the user's name
  isUnsafe: boolean = false; // Flag to toggle "Safe" or "Unsafe"
  private readonly LOCATION_BOUNDARY = {
    lat: 20.560797,  // Latitude of the "unsafe" location
    lng: 74.525070,  // Longitude of the "unsafe" location
    radius: 0.5        // Reduce the radius if you want the unsafe area to fall outside
  };
  // Example coordinates (New York)

  private checkSafety(): void {
    console.log("IN SAFETY CHECK");

    let unsafeLocation = false;
    let unsafeLogs = false;

    // Check if the location is outside the boundary
    this.data.forEach(item => {
      const location = item.location;
      console.log('Location:', location);

      if (location.latitude && location.longitude) {
        const distance = this.calculateDistance(
          location.latitude, location.longitude,
          this.LOCATION_BOUNDARY.lat, this.LOCATION_BOUNDARY.lng
        );
        console.log('Distance:', distance);

        // Log if the location is within the boundary
        if (distance > this.LOCATION_BOUNDARY.radius) {
          unsafeLocation = true; // Location is outside the safe radius
        }
      } else {
        console.warn('Invalid location data:', location);
      }

      // Check SMS logs and call logs for risky sentiment or keywords
      unsafeLogs = this.checkForNegativeSentiments(item.smsLogs) || this.checkForNegativeSentiments(item.callLogs);
      console.log('Unsafe Location:', unsafeLocation, 'Unsafe Logs:', unsafeLogs); // Debugging
    });

    // Set safety status based on location and logs check
    this.isUnsafe = unsafeLocation || unsafeLogs;
    console.log('Safety Status:', this.isUnsafe ? 'Unsafe' : 'Safe'); // Debugging
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Returns distance in km

    console.log(`Calculated Distance: ${distance} km`);
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private checkForNegativeSentiments(logs: any[]): boolean {
    // Check for any negative or risky sentiments in the logs
    const riskyKeywords = ['help', 'danger', 'urgent', 'call police', 'UPI'];

    console.log('Checking logs for risky keywords:', logs); // Debugging the logs

    return logs.some(log => {
      if (log.message) {
        console.log(`Checking message: ${log.message}`);
        return riskyKeywords.some(keyword => log.message.includes(keyword));
      }
      return false;
    });
  }

}
