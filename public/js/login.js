"use strict";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.className = "form-msg err";
    msg.textContent = "Please enter your email and password.";
    return;
  }

  btn.disabled = true;
  msg.className = "form-msg";
  msg.textContent = "Signing in…";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed.");
    msg.className = "form-msg ok";
    msg.textContent = "Success — redirecting…";
    window.location.href = "/admin";
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = err.message || "Login failed.";
    btn.disabled = false;
  }
});
