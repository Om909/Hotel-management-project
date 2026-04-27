// Admin dashboard: theme, color, scroll reveal, OTP login, bookings, cancel

const body = document.body;
const themeBtn = document.getElementById("theme-toggle");
const themeSelect = document.getElementById("color-theme");

// --------- Theme toggle ---------
if (themeBtn && localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
  themeBtn.textContent = "☀️";
}

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    if (body.classList.contains("light-mode")) {
      localStorage.setItem("theme", "light");
      themeBtn.textContent = "☀️";
    } else {
      localStorage.setItem("theme", "dark");
      themeBtn.textContent = "🌙";
    }
  });
}

// --------- Color theme ---------
if (themeSelect) {
  const saved = localStorage.getItem("color-theme");
  if (saved) {
    body.classList.add(saved + "-theme");
    themeSelect.value = saved;
  }

  themeSelect.addEventListener("change", () => {
    body.classList.remove("pink-theme", "blue-theme", "green-theme");
    const theme = themeSelect.value;
    if (theme !== "default") {
      body.classList.add(theme + "-theme");
    }
    localStorage.setItem("color-theme", theme);
  });
}

// --------- Scroll Reveal ---------
const reveals = document.querySelectorAll(".reveal");

function revealElements() {
  const windowHeight = window.innerHeight;

  reveals.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealElements);
window.addEventListener("load", revealElements);

// --------- Admin logic ---------
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("admin-login-form");
const loginStatus = document.getElementById("admin-login-status");
const adminStatus = document.getElementById("admin-status");
const bookingRows = document.getElementById("booking-rows");
const refreshBtn = document.getElementById("refresh-btn");
const logoutBtn = document.getElementById("logout-btn");
const sendOtpBtn = document.getElementById("send-otp-btn");

function getToken() {
  return localStorage.getItem("adminToken");
}

function setToken(token) {
  localStorage.setItem("adminToken", token);
}

function clearToken() {
  localStorage.removeItem("adminToken");
}

function showDashboard() {
  if (loginSection) loginSection.classList.add("hidden");
  if (dashboardSection) dashboardSection.classList.remove("hidden");
  fetchBookings();
}

function showLogin() {
  if (dashboardSection) dashboardSection.classList.add("hidden");
  if (loginSection) loginSection.classList.remove("hidden");
  clearToken();
}

// ----- Send OTP -----
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async () => {
    const emailEl = document.getElementById("admin-email");
    const email = emailEl.value.trim();

    if (!email) {
      loginStatus.textContent = "Please enter email first.";
      loginStatus.style.color = "#ff8b8b";
      return;
    }

    loginStatus.textContent = "Sending OTP...";
    loginStatus.style.color = "";

    try {
      const res = await fetch("/api/admin/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginStatus.textContent = data.message || "Failed to send OTP";
        loginStatus.style.color = "#ff8b8b";
        return;
      }
      loginStatus.textContent = "OTP sent to your email.";
      loginStatus.style.color = "#7df58b";
    } catch (err) {
      console.error(err);
      loginStatus.textContent = "Server error while sending OTP.";
      loginStatus.style.color = "#ff8b8b";
    }
  });
}

// ----- Verify OTP & Login -----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginStatus.textContent = "Verifying OTP...";
    loginStatus.style.color = "";

    const email = document.getElementById("admin-email").value.trim();
    const otp = document.getElementById("admin-otp").value.trim();

    if (!email || !otp) {
      loginStatus.textContent = "Email and OTP are required.";
      loginStatus.style.color = "#ff8b8b";
      return;
    }

    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginStatus.textContent = data.message || "Login failed";
        loginStatus.style.color = "#ff8b8b";
        return;
      }
      setToken(data.token);
      loginStatus.textContent = "";
      showDashboard();
    } catch (err) {
      console.error(err);
      loginStatus.textContent = "Server error during login.";
      loginStatus.style.color = "#ff8b8b";
    }
  });
}

async function fetchBookings() {
  if (adminStatus) {
    adminStatus.textContent = "Loading bookings...";
    adminStatus.style.color = "";
  }
  if (bookingRows) bookingRows.innerHTML = "";
  try {
    const res = await fetch("/api/admin/bookings", {
      headers: {
        Authorization: "Bearer " + getToken(),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      if (adminStatus) {
        adminStatus.textContent = data.message || "Failed to fetch bookings";
        adminStatus.style.color = "#ff8b8b";
      }
      if (res.status === 401 || res.status === 403) showLogin();
      return;
    }
    if (adminStatus) adminStatus.textContent = "";
    if (!data.length) {
      if (bookingRows) {
        bookingRows.innerHTML = "<tr><td colspan='6'>No bookings yet.</td></tr>";
      }
      return;
    }
    if (bookingRows) {
      data.forEach((b) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${b.fullName}</td>
          <td>${b.email}</td>
          <td>${new Date(b.bookingDate).toLocaleDateString()}</td>
          <td><span class="badge">${b.roomType}</span></td>
          <td>${new Date(b.createdAt).toLocaleString()}</td>
          <td>
            <button class="btn small secondary" data-id="${b._id}">Cancel</button>
          </td>
        `;
        bookingRows.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
    if (adminStatus) {
      adminStatus.textContent = "Server error";
      adminStatus.style.color = "#ff8b8b";
    }
  }
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", fetchBookings);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    showLogin();
  });
}

if (bookingRows) {
  bookingRows.addEventListener("click", async (e) => {
    if (e.target.matches("button[data-id]")) {
      const id = e.target.getAttribute("data-id");
      if (!confirm("Cancel this booking?")) return;
      try {
        const res = await fetch("/api/admin/bookings/" + id, {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + getToken(),
          },
        });
        const data = await res.json();
        if (!res.ok) {
          if (adminStatus) {
            adminStatus.textContent =
              data.message || "Failed to cancel booking";
            adminStatus.style.color = "#ff8b8b";
          }
          return;
        }
        if (adminStatus) {
          adminStatus.textContent = "Booking cancelled";
          adminStatus.style.color = "#7df58b";
        }
        fetchBookings();
      } catch (err) {
        console.error(err);
        if (adminStatus) {
          adminStatus.textContent = "Server error";
          adminStatus.style.color = "#ff8b8b";
        }
      }
    }
  });
}

// Auto-show dashboard if token exists
if (getToken()) {
  showDashboard();
}
