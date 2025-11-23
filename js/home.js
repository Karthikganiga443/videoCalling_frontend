const BACKEND_URL = "https://videocalling-backend-c85u.onrender.com";
const FRONTEND_URL = "https://video-calling-frontend-kappa.vercel.app";

const nameInput = document.getElementById("nameInput");
const meetingInput = document.getElementById("meetingInput");
const passwordInput = document.getElementById("passwordInput");
const joinCreateBtn = document.getElementById("joinCreateBtn");
const statusEl = document.getElementById("status");

joinCreateBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const meetingId = meetingInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !meetingId || !password) {
    statusEl.textContent = "Fill all fields";
    return;
  }

  statusEl.textContent = "Checking meeting...";

  try {
    const res = await fetch(`${BACKEND_URL}/api/meetings/join-or-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, meetingId, password })
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Error";
      return;
    }

    // redirect to frontend meeting page
    location.href =
      `${FRONTEND_URL}/meeting.html?id=${meetingId}&name=${encodeURIComponent(name)}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Backend not reachable.";
  }
};
