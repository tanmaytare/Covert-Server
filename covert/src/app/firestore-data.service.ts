import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, docData } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreDataService {
  constructor(private firestore: Firestore) {}

  async triggerCameraCommand() {
    try {
      const commandRef = doc(this.firestore, 'commands', 'camera_command');
      await setDoc(commandRef, { command: 'capture_photo' });
      console.log('Camera command triggered successfully.');
    } catch (error) {
      console.error('Error triggering camera command:', error);
    }
  }

  getUserList(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'user_data');
    return collectionData(usersCollection, { idField: 'id' });
  }

  getUserData(userId: string|null): Observable<any> {
    const userDoc = doc(this.firestore, `user_data/${userId}`);
    return docData(userDoc);
  }

  getData(collectionPath: string): Observable<any[]> {
    const colRef = collection(this.firestore, collectionPath);
    return collectionData(colRef); // Fetch data using the new Firestore API
  }

  getImageBase64(username: string): Observable<string | null> {
    const photoDocRef = doc(this.firestore, 'photos', username);
    return docData(photoDocRef).pipe(
      map((data: any) => data?.imageBase64 || null)  
    );
  }
}
