import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsfV19SLzcVelg5Z5bjp3h1EJiStFLeoI",
  authDomain: "ecowarrior-app-1.firebaseapp.com",
  projectId: "ecowarrior-app-1",
  storageBucket: "ecowarrior-app-1.appspot.com",
  messagingSenderId: "204162169811",
  appId: "1:204162169811:web:3c78268b4add17159c0d26",
  measurementId: "G-66HRM9N0KY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function logAuditTrail(action, location, previousState, newState) {
  
  try {
    const logEntry = {
      timestamp: serverTimestamp(),
      action,
      location,
      previousState: previousState || null,
      newState: newState || null,
    };
    console.log("Adding log entry to Firestore:", logEntry);

    await addDoc(collection(db, "auditTrail"), logEntry);
    console.log("Audit trail logged successfully:", logEntry);
  } catch (error) {
    console.error("Error logging audit trail:", error);
  }
}

//this function will generate or render audit trail logs
function renderAuditTrail(){
  const auditTrailTable = document.querySelector("#auditTrailTable");
  
  const auditTrailTableBody = auditTrailTable.querySelector("tbody");
  if (!auditTrailTableBody) {
    console.error("Audit trail table body not found");
    return;
  }

  auditTrailTableBody.innerHTML = "";

  onSnapshot(collection(db, "auditTrail"), (snapshot) => {
    

    if (snapshot.empty) { 
      const row = auditTrailTableBody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 4;
      cell.textContent = "No action from the admin yet.";
      return;
    }

    //Filling the table with logs
    snapshot.forEach((doc) => {
      const log = doc.data();
      const row = auditTrailTableBody.insertRow();

       //formatting the timestamp
       const timestamp = log.timestamp?.toDate().toLocaleString()|| "No Date";

       //adding cells to the row  
       row.insertCell(0).textContent = timestamp;
       row.insertCell(1).textContent = log.action;
       row.insertCell(2).textContent = log.location;

       //the details column and its format
       const detailsCell = row.insertCell(3);

       if (log.action === "Add New Practice") {

        const title = log.newState?.title || "Unknown";
        const description = log.newState?.description || "No Description";
        const status =  log.newState?.status || "Unknown";

        detailsCell.innerHTML=`
        <strong>Title:</strong> ${title}<br>
        <strong>Description:</strong> ${description}<br> 
        <strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}
        `;
       }

       //if it is editing practice
       else if (log.action ==="Edit Practice") {
        const previousTitle = log.previousState?.title || "Unknown";
        const previousDescription = log.previousState?.description || "No Description";

        const newTitle = log.newState?.title || "Unknown";
        const newDescription = log.newState?.description || "No Description";

        detailsCell.innerHTML = `
        <strong>Previous Title:</strong> ${previousTitle}<br>
        <strong>Previous Description:</strong> ${previousDescription}<br>
        <strong>Current Title:</strong> ${newTitle}<br>
        <strong>Current Description:</strong> ${newDescription}
        `
       }
       
       // if it is updating the feedback status
       else if (log.action === "Update Feedback Status") {
       const feedbackId = log.previousState?.feedbackId || log.newState?.feedbackId || "Unknown";
       const oldStatus = log.previousState?.status || "Unknown";
       const newStatus = log.newState?.status || "Unknown";

       detailsCell.innerHTML = `
       <strong>Feedback ID:</strong> ${feedbackId}<br>
       <strong>Previous Status:</strong> ${oldStatus}<br>
       <strong>New Status:</strong> ${newStatus}`;
       }
       
       //if it is enabling/disabling practice
       else {
       const title = log.previousState?.title || log.newState?.title || "Unknown";
       const previousState = log.previousState
       ? Object.entries(log.previousState)
       .filter(([key]) => key !== "title") 
       .map(([key, value]) => `${key} = ${value}`)
       .join(", ")
      : "None";
       const newState = log.newState
   ? Object.entries(log.newState)
       .filter(([key]) => key !== "title") 
       .map(([key, value]) => `${key} = ${value}`)
       .join(", ")
      : "None";

       detailsCell.innerHTML = `
       <strong>Title:</strong> ${title}<br>
       <strong>Previous:</strong> ${previousState}<br>
       <strong>New: </strong> ${newState}`;
       }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAuditTrail();
});
