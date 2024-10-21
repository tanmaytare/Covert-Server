import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FirestoreDataService } from '../firestore-data.service';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css'] // Fixed typo from styleUrl to styleUrls
})
export class DisplayComponent {
  firestore: Firestore = inject(Firestore);
  data: any[] = [];

  constructor(private firestoreDataService: FirestoreDataService) {}

  ngOnInit(): void {
    this.firestoreDataService.getData('user_data').subscribe(data => {
      this.data = data.map(item => {
        return {
          ...item,
          contacts: this.parseJsonArray(item.contacts || '[]'),
          callLogs: this.parseJsonArray(item.callLogs || '[]'),
          smsLogs: this.parseJsonArray(item.smsLogs || '[]'),
          location: this.parseLocation(item.location || '{}') // Parse the location
        };
      });
      console.log('Processed Data:', this.data);
    });
  }

  private parseJsonArray(jsonString: string): any[] {
    if (!jsonString) {
      console.warn('Received empty string for JSON parsing');
      return []; // Return an empty array if the string is empty
    }

    console.log('Original JSON String:', jsonString);

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
      .replace(/:\s*""/g, ': ""'); // Fix empty string values

    console.log('Modified JSON String:', modifiedJsonString);

    try {
      return JSON.parse(modifiedJsonString);
    } catch (error: any) {
      console.error('Parsing error:', error.message, 'for string:', modifiedJsonString);
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
        } catch (e:any) {
          console.warn('Fallback parsing error:', e.message, 'for match:', match);
        }
      });
    }

    return fallbackData;
  }

  private parseLocation(locationString: string): { latitude: number | null; longitude: number |null } {
    if (!locationString) {
      console.warn('Received empty string for location parsing');
      return { latitude: null, longitude: null }; // Return null values if the string is empty
    }

    console.log('Original Location String:', locationString);

    // Remove the braces and replace the '=' with ':'
    const modifiedLocationString = locationString
      .replace(/[{}]/g, '') // Remove curly braces
      .replace(/(\w+)=/g, '"$1":') // Wrap keys in quotes
      .replace(/,/g, ', '); // Ensure proper spacing for JSON

    console.log('Modified Location String:', modifiedLocationString);

    try {
      const locationData = JSON.parse(`{${modifiedLocationString}}`);
      return {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };
    } catch (error:any) {
      console.error('Parsing error for location:', error.message, 'for string:', modifiedLocationString);
      return { latitude: null, longitude: null }; // Return null values on error
    }
  }
}
