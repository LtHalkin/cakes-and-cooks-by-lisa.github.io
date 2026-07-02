// ===========================================================
// Cakes & Cooks by Lisa — product catalogue
// Edit this list to add/remove designs. Each product needs a
// matching image at src/images/products/<image>.jpg
// (falls back to a styled placeholder if the file is missing)
// ===========================================================
const PRODUCTS = [
  {
    id: "celebration-classic",
    name: "Classic Celebration Cake",
    description: "Two-tier vanilla or chocolate sponge, smooth buttercream, fresh flowers or simple piping. The everyday showstopper.",
    price: 65,
    mode: "buy",
    image: "celebration-classic.jpg"
  },
  {
    id: "cupcake-box",
    name: "Cupcake Box (dozen)",
    description: "A dozen mixed cupcakes — pick two flavours from vanilla, chocolate, red velvet or lemon. Great for offices and parties.",
    price: 35,
    mode: "buy",
    image: "cupcake-box.jpg"
  },
  {
    id: "cookie-box",
    name: "Decorated Cookie Box (dozen)",
    description: "Hand-iced sugar cookies to match any theme or colour palette. Perfect party favours.",
    price: 30,
    mode: "buy",
    image: "cookie-box.jpg"
  },
  {
    id: "christening-cake",
    name: "Christening Cake",
    description: "Soft pastels, delicate piping and a topper to match. Serves approx. 25.",
    price: 85,
    mode: "buy",
    image: "christening-cake.jpg"
  },
  {
    id: "birthday-bespoke",
    name: "Bespoke Birthday Cake",
    description: "Fully custom — sculpted shapes, character cakes, drip finishes or photo prints. Tell me the theme.",
    price: null,
    mode: "enquire",
    image: "birthday-bespoke.jpg"
  },
  {
    id: "wedding-cake",
    name: "Wedding Cake",
    description: "Multi-tier bespoke wedding cakes, sugar flowers and finishes tailored to your day. Priced per tier and guest count.",
    price: null,
    mode: "enquire",
    image: "wedding-cake.jpg"
  },
  {
    id: "croquembouche",
    name: "Croquembouche Tower",
    description: "A traditional choux pastry tower, spun sugar and all, for christenings and celebrations that want something different.",
    price: null,
    mode: "enquire",
    image: "croquembouche.jpg"
  },
  {
    id: "novelty-sculpted",
    name: "Novelty Sculpted Cake",
    description: "3D carved cakes — favourite characters, hobbies, pets, whatever the celebration calls for.",
    price: null,
    mode: "enquire",
    image: "novelty-sculpted.jpg"
  }
];

const grid = document.getElementById("productGrid");
const designSelect = document.getElementById("design");

function euro(n){
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function renderProducts(filter = "all"){
  grid.innerHTML = "";
  const items = PRODUCTS.filter(p => filter === "all" ? true : p.mode === filter);

  items.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-photo">
        <img src="images/products/${p.image}" alt="${p.name}" onerror="this.classList.add('broken')">
        <span class="fallback-label">Photo of "${p.name}" goes here</span>
        <span class="price-tag ${p.mode === 'enquire' ? 'tag-enquire' : ''}">
          ${p.mode === "buy" ? `From ${euro(p.price)}` : "Bespoke"}
        </span>
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="product-actions">
          ${p.mode === "buy"
            ? `<button class="btn btn-primary btn-small btn-block" data-buy="${p.id}">Order now &mdash; ${euro(p.price)}</button>`
            : `<button class="btn btn-ghost btn-small btn-block" data-enquire="${p.id}">Enquire about this design</button>`
          }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function populateDesignSelect(){
  PRODUCTS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    designSelect.appendChild(opt);
  });
}

// ---- filter chips ----
document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    renderProducts(chip.dataset.filter);
  });
});

// ---- card actions (event delegation) ----
grid?.addEventListener("click", async (e) => {
  const buyBtn = e.target.closest("[data-buy]");
  const enquireBtn = e.target.closest("[data-enquire]");

  if (buyBtn){
    const product = PRODUCTS.find(p => p.id === buyBtn.dataset.buy);
    buyBtn.disabled = true;
    const originalText = buyBtn.textContent;
    buyBtn.textContent = "Redirecting to checkout…";
    try {
      await startCheckout(product);
    } catch (err){
      console.error(err);
      buyBtn.textContent = originalText;
      buyBtn.disabled = false;
      alert("Sorry, checkout couldn't start. Please try again or use the enquiry form below.");
    }
    return;
  }

  if (enquireBtn){
    const product = PRODUCTS.find(p => p.id === enquireBtn.dataset.enquire);
    designSelect.value = product.name;
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    document.getElementById("name").focus({ preventScroll: true });
  }
});

// ---- Stripe checkout ----
async function startCheckout(product){
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.price
    })
  });

  if (!res.ok) throw new Error("Checkout session request failed");
  const data = await res.json();
  if (data.url){
    window.location.href = data.url;
  } else {
    throw new Error("No checkout URL returned");
  }
}

// ---- contact form (mailto fallback, no backend required) ----
const ORDER_EMAIL = "hello@cakesandcooksbylisa.ie"; // TODO: replace with Lisa's real email

document.getElementById("orderForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  const subject = `Cake enquiry: ${data.design || "General"} — ${data.name}`;
  const body =
`Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "-"}
Design: ${data.design || "Not specified"}
Date needed: ${data.date || "Not specified"}

Message:
${data.message || "-"}`;

  const mailto = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
});

// ---- mobile nav ----
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".main-nav a").forEach(a => {
  a.addEventListener("click", () => mainNav.classList.remove("is-open"));
});

// ---- footer year ----
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- init ----
populateDesignSelect();
renderProducts();
