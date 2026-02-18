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
  showView('main'); // Start with the main category cards

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

    // 2. Fetch Subscribers
    try {
      const subResponse = await fetch(`${API_URL}/subscribers`, {
        headers: { "Authorization": token },
      });
      const subData = await subResponse.json();
      const efvMailSectionBox = document.getElementById("efv-mail-section");

      efvMailSectionBox.innerHTML = "";

      if (subData.length === 0) {
        const emptyMsg = "<p style='text-align:center; color:#666;'>No subscribers found.</p>";
        efvMailSectionBox.innerHTML = emptyMsg;
      }

      subData.forEach(s => {
        // Create card helper
        const createSubCard = (borderColor) => {
          const card = document.createElement("div");
          card.className = "data-card";
          card.style.borderLeftColor = borderColor;
          const dateStr = s.created_at || s.createdAt || new Date().toISOString();
          const date = new Date(dateStr).toLocaleString();

          card.innerHTML = `
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                          <p style="font-size:16px;"><strong>📧 Email:</strong> ${s.email}</p>
                          <p style="font-size:12px; color:#666;"><strong>Subscribed at:</strong> ${date}</p>
                      </div>
                      <button style="padding:5px 10px; font-size:12px; background: #e74c3c; color:white; border:none; border-radius:4px; cursor:pointer; width:auto !important;" onclick="deleteSubscriber('${s._id}')">
                          Delete
                      </button>
                  </div>
              `;
          return card;
        };

        // Add to EFV Web > Mail Section
        efvMailSectionBox.appendChild(createSubCard("#2980b9"));
      });

    } catch (err) {
      console.error("Failed to load subscribers", err);
      document.getElementById("efv-mail-section").innerHTML = "<p style='color:red; text-align:center;'>Error loading subscribers.</p>";
    }

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

// 🗑️ DELETE SUBSCRIBER
async function deleteSubscriber(id) {
  const confirmDelete = confirm("Are you sure you want to remove this subscriber permanently?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("uwo_token");

  try {
    const response = await fetch(`${API_URL}/subscribers/${id}`, {
      method: "DELETE",
      headers: { "Authorization": token },
    });

    if (response.ok) {
      showDashboard();
    } else {
      alert("Failed to delete subscriber");
    }
  } catch (error) {
    alert("Error deleting subscriber");
  }
}

// 🔄 NAVIGATION LOGIC
function showView(viewName) {
  const mainMenu = document.getElementById("main-menu");
  const uwoView = document.getElementById("uwo-view");
  const efvView = document.getElementById("efv-view");
  const title = document.getElementById("dashboardTitle");
  const logoutBtn = document.getElementById("logoutBtn");

  // Reset displays
  mainMenu.style.display = "none";
  uwoView.style.display = "none";
  efvView.style.display = "none";
  logoutBtn.style.display = "block";

  if (viewName === 'main') {
    mainMenu.style.display = "grid";
    title.style.display = "block";
  } else if (viewName === 'uwo') {
    uwoView.style.display = "block";
    title.style.display = "none";
  } else if (viewName === 'efv') {
    efvView.style.display = "block";
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
