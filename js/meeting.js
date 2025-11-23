const BACKEND_URL = "https://videocalling-backend-c85u.onrender.com";

// IMPORTANT: connect socket to backend domain
const socket = io(BACKEND_URL, {
  transports: ["websocket"], // helps Render be stable
});

const params = new URLSearchParams(location.search);
const meetingId = params.get("id");
const name = params.get("name") || "anonymous";

document.getElementById("meetingTitle").textContent = `Meeting: ${meetingId}`;
document.getElementById("userLabel").textContent = `You are: ${name}`;

const localVideo = document.getElementById("localVideo");
const videosGrid = document.getElementById("videosGrid");

const muteBtn = document.getElementById("muteBtn");
const videoBtn = document.getElementById("videoBtn");
const leaveBtn = document.getElementById("leaveBtn");

let localStream;
let peers = {}; // socketId -> RTCPeerConnection
let isMuted = false;
let isVideoOff = false;

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

function createPeer(targetId) {
  const peer = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.ontrack = (e) => attachRemoteStream(targetId, e.streams[0]);

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", { target: targetId, candidate: e.candidate });
    }
  };

  peers[targetId] = peer;
  return peer;
}

function attachRemoteStream(socketId, stream) {
  let videoEl = document.getElementById(`remote-${socketId}`);
  if (!videoEl) {
    videoEl = document.createElement("video");
    videoEl.id = `remote-${socketId}`;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videosGrid.appendChild(videoEl);
  }
  videoEl.srcObject = stream;
}

function removeRemoteVideo(socketId) {
  const videoEl = document.getElementById(`remote-${socketId}`);
  if (videoEl) videoEl.remove();
}

socket.on("existing-users", async (users) => {
  for (const user of users) {
    const peer = createPeer(user.socketId);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("offer", {
      target: user.socketId,
      offer
    });
  }
});

socket.on("offer", async ({ offer, from }) => {
  const peer = createPeer(from);

  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", {
    target: from,
    answer
  });
});

socket.on("answer", async ({ answer, from }) => {
  const peer = peers[from];
  if (!peer) return;
  await peer.setRemoteDescription(answer);
});

socket.on("ice-candidate", async ({ candidate, from }) => {
  const peer = peers[from];
  if (!peer) return;
  try {
    await peer.addIceCandidate(candidate);
  } catch (err) {
    console.error("ICE error:", err);
  }
});

socket.on("user-left", ({ socketId }) => {
  if (peers[socketId]) peers[socketId].close();
  delete peers[socketId];
  removeRemoteVideo(socketId);
});

// UI controls
muteBtn.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
};

videoBtn.onclick = () => {
  isVideoOff = !isVideoOff;
  localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
  videoBtn.textContent = isVideoOff ? "Video On" : "Video Off";
};

leaveBtn.onclick = () => {
  socket.disconnect();
  Object.values(peers).forEach(p => p.close());
  peers = {};
  location.href = "/";
};

(async () => {
  await initMedia();
  socket.emit("join-meeting", { meetingId, name });
})();
