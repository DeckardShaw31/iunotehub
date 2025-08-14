// firebase-config.js (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// TODO: Dán cấu hình dự án Firebase của bạn ở đây:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

/*
Gợi ý Security Rules (tối thiểu cho demo, hãy siết chặt khi lên production):

// Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read: if true;
      allow create: if request.time < timestamp.date(2099,1,1); // demo
      allow update, delete: if false; // chặn sửa/xóa (demo)
    }
  }
}

// Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{allPaths=**} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2099,1,1)
        && request.resource.size < 20 * 1024 * 1024
        && request.resource.contentType.matches('application/pdf|image/.*|application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
  }
}

*/
