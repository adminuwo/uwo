// 🔐 LOCAL BACKEND API URL
const API_URL = "http://localhost:5000/api";

// ✅ LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("uwo_token", data.token);
      showDashboard();
    } else {
      alert("Login failed: " + data.message);
    }
  } catch (error) {
    alert("Login failed: Error connecting to server");
  }
}

// ✅ SHOW DASHBOARD
async function showDashboard() {
  const token = localStorage.getItem("uwo_token");
  if (!token) {
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    return;
  }

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  showView('uwo'); // Start directly with the UWO web management

  try {
    // 1. Fetch Contact Messages
    const response = await fetch(`${API_URL}/contacts`, {
      headers: { "Authorization": token },
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logout();
      return;
    }

    const contactsData = await response.json();
    const uwoContactsBox = document.getElementById("uwo-contacts");
    uwoContactsBox.innerHTML = "";

    // 1. UWO Web > Contacts (Filter Source = 'UWO')
    const uwoContacts = contactsData.filter(m => m.source === 'UWO' || !m.source);

    if (uwoContacts.length === 0) {
      uwoContactsBox.innerHTML = "<p style='text-align:center; color:#666;'>No contact messages found.</p>";
    }

    uwoContacts.forEach(m => {
      const card = document.createElement("div");
      card.className = "data-card";
      const date = new Date(m.created_at).toLocaleString();

      card.innerHTML = `
        <p><strong>Name:</strong> ${m.name}</p>
        <p><strong>Email:</strong> ${m.email}</p>
        <p><strong>Purpose:</strong> ${m.purpose || 'General'}</p>
        <p><strong>Message:</strong> ${m.message}</p>
        <p><strong>Date:</strong> ${date}</p>
        <button style="margin-top:10px; padding:6px 15px; font-size:13px; background: #e74c3c; color:white; border:none; border-radius:5px; cursor:pointer; width:auto !important;" onclick="deleteMessage('${m._id}')">
          Delete Message
        </button>
      `;
      uwoContactsBox.appendChild(card);
    });

    // 2. Fetch subscribers if needed

    // 2. Fetch Subscribers (Optional: Removed EFV related logic)

  } catch (error) {
    alert("Failed to load dashboard data");
    console.error(error);
  }
}


// 🗑️ DELETE MESSAGE
async function deleteMessage(id) {
  const confirmDelete = confirm("Are you sure you want to delete this message?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("uwo_token");

  try {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: "DELETE",
      headers: { "Authorization": token },
    });

    if (response.ok) {
      showDashboard();
    } else {
      alert("Delete failed");
    }
  } catch (error) {
    alert("Delete failed");
  }
}


function showView(viewName) {
  const mainMenu = document.getElementById("main-menu");
  const uwoView = document.getElementById("uwo-view");
  const title = document.getElementById("dashboardTitle");

  if (viewName === 'uwo') {
    if (mainMenu) mainMenu.style.display = "none";
    uwoView.style.display = "block";
    title.style.display = "none";
  }
}

// ✅ AUTO LOGIN IF TOKEN EXISTS
const token = localStorage.getItem("uwo_token");
if (token) {
  showDashboard();
}

// ✅ LOGOUT
function logout() {
  localStorage.removeItem("uwo_token");
  location.reload();
}
