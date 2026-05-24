// 1. Firebase Modules ko Import karein via CDN URL (Plain JS ke liye zaroori hai)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. Aapki Real Firebase Configuration (Jo aapne dhoond li hai)
const firebaseConfig = {
  apiKey: "AIzaSyCz2wEPn6Ez1nQ-JaKmkcQY2qH_IYgkCXs",
  authDomain: "smart-planner-app-d6b4c.firebaseapp.com",
  databaseURL: "https://smart-planner-app-d6b4c-default-rtdb.firebaseio.com", // Aapka Realtime Database URL
  projectId: "smart-planner-app-d6b4c",
  storageBucket: "smart-planner-app-d6b4c.firebasestorage.app",
  messagingSenderId: "634653751466",
  appId: "1:634653751466:web:c97cf0cf3a51f6039ab8d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let activeAlarmsList = []; // Memory mein alarms track karne ke liye

// --- UI Elements ---
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- Google Sign-In Logic ---
googleLoginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => alert("Login Error: " + err.message));
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Auth State Change Listener (Login/Logout detect karne ke liye)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        
        // User login hote hi uska specific data load karein
        loadTodos();
        loadAlarms();
        loadNotes();
        startAlarmEngine(); // Background check shuru karein
    } else {
        currentUser = null;
        authScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// --- 📝 TODO / TASKS FUNCTIONALITY ---
window.addTodo = function() {
    const taskText = document.getElementById('todo-input').value;
    const taskTime = document.getElementById('todo-time').value;

    if (!taskText) return alert("Task ka naam likhein!");

    const todoRef = ref(database, `users/${currentUser.uid}/todos`);
    push(todoRef, {
        title: taskText,
        reminderTime: taskTime || "No Reminder",
        timestamp: Date.now()
    });

    document.getElementById('todo-input').value = "";
    document.getElementById('todo-time').value = "";
};

function loadTodos() {
    const todoRef = ref(database, `users/${currentUser.uid}/todos`);
    onValue(todoRef, (snapshot) => {
        const listElement = document.getElementById('todo-list');
        listElement.innerHTML = "";
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                const li = document.createElement('li');
                li.style.margin = "10px 0";
                li.innerHTML = `
                    <strong>${data[key].title}</strong> - <small>${data[key].reminderTime}</small>
                    <button onclick="deleteItem('todos', '${key}')" style="margin-left:10px; background:red; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:4px;">X</button>
                `;
                listElement.appendChild(li);
            });
        }
    });
}

// --- ⏰ ALARM FUNCTIONALITY ---
window.setAlarm = function() {
    const alarmTime = document.getElementById('alarm-time').value;
    if (!alarmTime) return alert("Alarm ka waqt select karein!");

    const alarmRef = ref(database, `users/${currentUser.uid}/alarms`);
    push(alarmRef, {
        time: alarmTime,
        status: "active"
    });
    alert(`Alarm ${alarmTime} par set ho gaya!`);
};

function loadAlarms() {
    const alarmRef = ref(database, `users/${currentUser.uid}/alarms`);
    onValue(alarmRef, (snapshot) => {
        const listElement = document.getElementById('alarm-list');
        listElement.innerHTML = "";
        activeAlarmsList = [];
        const data = snapshot.val();

        if (data) {
            Object.keys(data).forEach(key => {
                activeAlarmsList.push({ id: key, time: data[key].time });
                const li = document.createElement('li');
                li.style.margin = "10px 0";
                li.innerHTML = `
                    ⏰ Alarm: <strong>${data[key].time}</strong>
                    <button onclick="deleteItem('alarms', '${key}')" style="margin-left:10px; background:red; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:4px;">Remove</button>
                `;
                listElement.appendChild(li);
            });
        }
    });
}

// Background Alarm Engine (Har second check karega computer time se match karke)
function startAlarmEngine() {
    setInterval(() => {
        const now = new Date();
        const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        activeAlarmsList.forEach(alarm => {
            if (alarm.time === currentTimeString) {
                let audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
                audio.play();
                alert(`⏰ ALARM TIME!! It's ${alarm.time}`);
                activeAlarmsList = activeAlarmsList.filter(a => a.id !== alarm.id); // Baar baar ring hone se bachayein
            }
        });
    }, 1000);
}

// --- 📓 NOTES DIARY FUNCTIONALITY ---
window.saveNote = function() {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;

    if (!title || !content) return alert("Title aur Content dono likhein!");

    const notesRef = ref(database, `users/${currentUser.uid}/notes`);
    push(notesRef, {
        title: title,
        content: content,
        date: new Date().toLocaleDateString()
    });

    document.getElementById('note-title').value = "";
    document.getElementById('note-content').value = "";
};

function loadNotes() {
    const notesRef = ref(database, `users/${currentUser.uid}/notes`);
    onValue(notesRef, (snapshot) => {
        const gridElement = document.getElementById('notes-list');
        gridElement.innerHTML = "";
        const data = snapshot.val();

        if (data) {
            Object.keys(data).forEach(key => {
                const card = document.createElement('div');
                card.style.border = "1px solid #ccc";
                card.style.padding = "15px";
                card.style.borderRadius = "8px";
                card.style.background = "#fff";
                card.style.margin = "10px 0";
                card.innerHTML = `
                    <h3>${data[key].title}</h3>
                    <p>${data[key].content}</p>
                    <small style="color:#666;">${data[key].date}</small><br><br>
                    <button onclick="deleteItem('notes', '${key}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Delete Note</button>
                `;
                gridElement.appendChild(card);
            });
        }
    });
}

// --- 🗑️ UNIVERSAL DELETE FUNCTION ---
window.deleteItem = function(path, id) {
    const itemRef = ref(database, `users/${currentUser.uid}/${path}/${id}`);
    remove(itemRef);
};

// --- Tab Switching Navigation ---
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    if (event && event.target) {
        event.target.classList.add('active');
    }
};