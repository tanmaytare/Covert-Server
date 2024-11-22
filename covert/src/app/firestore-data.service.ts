import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { doc, getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreDataService {
  constructor(private firestore: Firestore) {}

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
}
