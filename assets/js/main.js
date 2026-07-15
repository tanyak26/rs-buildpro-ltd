const toggle = document.querySelector("[data-menu-toggle]");

if (toggle) {
  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();

const form = document.querySelector("[data-enquiry-form]");
const status = document.querySelector("[data-form-status]");

if (form && status) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const service = String(data.get("service") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent(`RS BuildPro Ltd enquiry - ${service || "Project"}`);
    const body = encodeURIComponent([
      `Name: ${name}`,
      `Phone: ${data.get("phone") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Service: ${service}`,
      "",
      "Project details:",
      message
    ].join("\n"));
    status.textContent = "Opening your email app with the project details ready to send.";
    window.location.href = `mailto:info@rsbuildproltd.co.uk?subject=${subject}&body=${body}`;
  });
}
