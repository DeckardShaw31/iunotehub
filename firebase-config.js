// firebase-config.js (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// TODO: Dán cấu hình dự án Firebase của bạn ở đây:
  const firebaseConfig = {
    apiKey: "AIzaSyB2LSgDxfxID3SRTzl1AsP6euilFPjnuAw",
    authDomain: "iunotehub.firebaseapp.com",
    projectId: "iunotehub",
    storageBucket: "iunotehub.firebasestorage.app",
    messagingSenderId: "209319401101",
    appId: "1:209319401101:web:b42d3d156e291a428d34c4",
    measurementId: "G-6F7P3RBFTZ"
  };

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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
