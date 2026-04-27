// THEME TOGGLE + COLOR THEME + SCROLL REVEAL + BOOKING

const body = document.body;
const themeBtn = document.getElementById("theme-toggle");
const themeSelect = document.getElementById("color-theme");

// --------- Load saved theme ---------
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

// --------- Color theme handling ---------
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

// --------- Booking form ---------
const form = document.getElementById("booking-form");
const statusEl = document.getElementById("booking-status");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (statusEl) {
      statusEl.textContent = "Submitting...";
      statusEl.style.color = "";
    }

    const payload = {
      fullName: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      bookingDate: document.getElementById("booking-date").value,
      roomType: document.getElementById("room-type").value,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (statusEl) {
          statusEl.textContent = data.message || "Booking failed.";
          statusEl.style.color = "#ff8b8b";
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = "Booking successful! 🎉";
        statusEl.style.color = "#7df58b";
      }
      form.reset();
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = "Server error. Try again later.";
        statusEl.style.color = "#ff8b8b";
      }
    }
  });
}
