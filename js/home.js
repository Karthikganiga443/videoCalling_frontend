const BACKEND_URL = "https://videocalling-backend-c85u.onrender.com";

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

    // if server returns non-json (rare), avoid crash
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      statusEl.textContent = data.error || "Error";
      return;
    }

    location.href = `/meeting.html?id=${meetingId}&name=${encodeURIComponent(name)}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Backend not reachable";
  }
};
