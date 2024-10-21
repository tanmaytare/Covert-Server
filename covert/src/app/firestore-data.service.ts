import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { doc, getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreDataService {
  constructor(private firestore: Firestore) {}

  getData(collectionPath: string): Observable<any[]> {
    const colRef = collection(this.firestore, collectionPath);
    return collectionData(colRef); // Fetch data using the new Firestore API
  }
}
