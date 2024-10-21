import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(), provideFirebaseApp(() => initializeApp({"projectId":"covert-ec769","appId":"1:906008186095:web:45e2a13ca621f56b35df1a","databaseURL":"https://covert-ec769-default-rtdb.firebaseio.com","storageBucket":"covert-ec769.appspot.com","apiKey":"AIzaSyCwsrbEHXLaxJHGeraREqgNoMx7ThDL0CQ","authDomain":"covert-ec769.firebaseapp.com","messagingSenderId":"906008186095","measurementId":"G-NJ7MHKLHNE"})), provideFirestore(() => getFirestore())]
};
