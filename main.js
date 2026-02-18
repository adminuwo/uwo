// 🔹 LOCAL BACKEND API URL
const API_URL = "https://uwo-backend-743928421487.asia-south1.run.app/api";

// UI helpers
function toggleDrawer() {
  const drawer = document.getElementById("mobileDrawer");
  if (drawer) drawer.classList.toggle("open");
}

function openPage(page) {
  window.location.href = page;
}

// CONTACT FORM ONLY
async function sendMessage() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;
  const purpose = document.getElementById("purpose").value;

  if (!name || !email || !message) {
    alert("Please fill all fields😒");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, purpose })
    });

    if (response.ok) {
      alert("✅ Message sent😎");
    } else {
      alert("❌ Something went wrong😐");
    }
  } catch (error) {
    alert("❌ Something went wrong😐");
    console.error(error);
  }
}
