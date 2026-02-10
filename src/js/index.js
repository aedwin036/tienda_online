import {
  products,
  cart,
  addToCartLogic,
  updateQuantityLogic,
  removeFromCartLogic,
  clearCartLogic,
} from "./app.js";

// Variable local para mostrar total en UI
let cartTotal = 0;

// ==================== FUNCIONES DEL CARRITO ====================

// Elementos del DOM
const productsGrid = document.getElementById("productsGrid");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotalElement = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartIcon = document.getElementById("cartIcon");
const emptyCart = document.getElementById("emptyCart");
const checkoutModal = document.getElementById("checkoutModal");
const closeModal = document.getElementById("closeModal");
const checkoutForm = document.getElementById("checkoutForm");
const productModal = document.getElementById("productModal");
const closeProductModal = document.getElementById("closeProductModal");
const productModalTitle = document.getElementById("productModalTitle");
const productModalImage = document.getElementById("productModalImage");
const productModalCategory = document.getElementById("productModalCategory");
const productModalPrice = document.getElementById("productModalPrice");
const productModalDetails = document.getElementById("productModalDetails");
const closeProductDetails = document.getElementById("closeProductDetails");

// ==================== EVENT DELEGATION (CORRECCIÓN) ====================
// Este listener se asigna INMEDIATAMENTE, fuera del setTimeout.
// Captura clics en cartItems aunque su contenido cambie dinámicamente.
if (cartItems) {
  cartItems.addEventListener("click", (e) => {
    const target = e.target;
    const decreaseBtn = target.closest(".decrease-btn");
    const increaseBtn = target.closest(".increase-btn");
    const removeBtn = target.closest(".remove-btn");

    if (decreaseBtn) {
      updateQuantityLogic(Number(decreaseBtn.dataset.id), -1);
      updateCartDisplay();
    } else if (increaseBtn) {
      updateQuantityLogic(Number(increaseBtn.dataset.id), 1);
      updateCartDisplay();
    } else if (removeBtn) {
      removeFromCartLogic(Number(removeBtn.dataset.id));
      updateCartDisplay();
    }
  });
}

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("site-loader");

  // Esperar 3 segundos para mostrar el loader y luego inicializar la app
  setTimeout(() => {
    renderProducts();
    updateCartDisplay();

    requestAnimationFrame(() => {
      loader.classList.add("hidden");
    });


    // Event listeners
    cartIcon.addEventListener("click", () => {
      document
        .querySelector(".cart-section")
        .scrollIntoView({ behavior: "smooth" });
    });

    checkoutBtn.addEventListener("click", () => {
      if (cart.length > 0) {
        checkoutModal.classList.add("active");
      }
    });

    closeModal.addEventListener("click", () => {
      checkoutModal.classList.remove("active");
    });

    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) {
        checkoutModal.classList.remove("active");
      }
    });

    checkoutForm.addEventListener("submit", submitOrder);

    // Product details modal events (read-only)
    if (closeProductModal)
      closeProductModal.addEventListener("click", () =>
        productModal.classList.remove("active"),
      );
    if (closeProductDetails)
      closeProductDetails.addEventListener("click", () =>
        productModal.classList.remove("active"),
      );
    if (productModal)
      productModal.addEventListener("click", (e) => {
        if (e.target === productModal) productModal.classList.remove("active");
      });

    // Ocultar loader con transición y eliminar del DOM
    if (loader) {
      loader.classList.add("loader-hidden");
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 500);
    }

    // Inicializar rotación del banner principal
    if (typeof initHeroBannerRotation === "function") initHeroBannerRotation();
    // Inicializar navbar derecho y paneles
    if (typeof initRightNav === "function") initRightNav();
  }, 2000);
});

// Renderizar productos
function renderProducts() {
  productsGrid.innerHTML = "";
  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    // Soporta `images` (array) o `image` (string) para compatibilidad
    // Si `image` es una cadena con varias URLs separadas por comas, dividirla en array
    let imagesArr = [];
    if (product.images && Array.isArray(product.images)) {
      imagesArr = product.images;
    } else if (product.image && typeof product.image === "string") {
      // Detectar si tiene varias URLs separadas por coma
      if (product.image.includes(",")) {
        imagesArr = product.image
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        imagesArr = [product.image.trim()];
      }
    }

    // Construir HTML de miniaturas si existen varias imágenes
    let thumbsHtml = "";
    if (imagesArr.length > 1) {
      thumbsHtml = '<div class="product-thumbnails">';
      imagesArr.forEach((src, i) => {
        thumbsHtml += `<img src="${src}" data-index="${i}" class="product-thumb ${i === 0 ? "active" : ""}">`;
      });
      thumbsHtml += "</div>";
    }

    productCard.innerHTML = `
                    <div class="image-gallery">
                        <div class="image-wrapper">
                            <img src="${imagesArr[0] || ""}" alt="${product.name}" class="product-main-image" data-current="0">
                            <button class="img-nav prev" aria-label="Anterior">‹</button>
                            <button class="img-nav next" aria-label="Siguiente">›</button>
                        </div>
                        ${thumbsHtml}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> Agregar al carrito
                        </button>
                        <p class="product-details">${product.details ? product.details : ""}</p>
                        <button class="details-btn" data-id="${product.id}" style="margin-top:8px; width:100%; padding:8px; border-radius:6px; background:#eef2ff; border:1px solid #e6eefc; cursor:pointer;">Detalles</button>
                    </div>
                `;

    productsGrid.appendChild(productCard);

    // Elementos para navegación de imágenes
    const mainImg = productCard.querySelector(".product-main-image");
    const prevBtn = productCard.querySelector(".img-nav.prev");
    const nextBtn = productCard.querySelector(".img-nav.next");
    const thumbs = productCard.querySelectorAll(".product-thumb");

    // Función para actualizar imagen principal y miniaturas activas
    function setImageByIndex(index) {
      if (!imagesArr.length) return;
      const idx =
        ((index % imagesArr.length) + imagesArr.length) % imagesArr.length; // wrap
      mainImg.src = imagesArr[idx];
      mainImg.dataset.current = idx;
      if (thumbs.length) {
        thumbs.forEach((t) => t.classList.remove("active"));
        const active = productCard.querySelector(
          `.product-thumb[data-index="${idx}"]`,
        );
        if (active) active.classList.add("active");
      }
    }

    // Listeners prev/next
    prevBtn.addEventListener("click", () => {
      const cur = parseInt(mainImg.dataset.current || "0", 10);
      setImageByIndex(cur - 1);
    });

    nextBtn.addEventListener("click", () => {
      const cur = parseInt(mainImg.dataset.current || "0", 10);
      setImageByIndex(cur + 1);
    });

    // Click en miniaturas
    if (thumbs.length) {
      thumbs.forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const idx = parseInt(thumb.dataset.index, 10);
          setImageByIndex(idx);
        });
      });
    }
    // Detalles button
    const detailsBtn = productCard.querySelector(".details-btn");
    if (detailsBtn) {
      detailsBtn.addEventListener("click", () =>
        openProductDetails(product.id),
      );
    }
  });

  // Agregar event listeners a los botones de agregar al carrito
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = parseInt(
        e.target.closest(".add-to-cart-btn").dataset.id,
      );
      addToCart(productId);
    });
  });
}

// Abrir modal de detalles y permitir edición de `product.details`
function openProductDetails(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  // ⚠️ Validar que los elementos del modal EXISTAN
  if (!productModalImage || !productModalTitle) {
    console.warn("Modal aún no está listo");
    return;
  }

  // Mostrar datos (solo lectura)
  productModalTitle.textContent = product.name;

  // Seleccionar primera imagen disponible
  let img = "";
  if (Array.isArray(product.images) && product.images.length) {
    img = product.images[0];
  } else if (typeof product.image === "string") {
    img = product.image.includes(",")
      ? product.image.split(",")[0].trim()
      : product.image;
  }

  if (img) {
    productModalImage.src = img;
    productModalImage.alt = product.name;
  } else {
    productModalImage.removeAttribute("src");
    productModalImage.alt = "Sin imagen";
  }

  productModalCategory.textContent = product.category || "";
  productModalPrice.textContent = product.price
    ? `$${product.price.toFixed(2)}`
    : "";
  productModalDetails.textContent =
    product.details || "No hay detalles disponibles para este producto.";

  productModal.classList.add("active");
}

// Funciones del carrito de compras

/**
 * Agrega un producto al carrito
 * Si el producto ya existe, aumenta su cantidad
 * @param {number} productId - ID único del producto
 */
function addToCart(productId) {
  // Usar lógica importada de app.js
  const added = addToCartLogic(productId);
  if (!added) return;

  // Actualizar UI
  updateCartDisplay();

  const button = document.querySelector(
    `.add-to-cart-btn[data-id="${productId}"]`,
  );
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Agregado';
    button.style.backgroundColor = "var(--success-color)";

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.backgroundColor = "";
    }, 1000);
  }
}

// Actualizar visualización del carrito
function updateCartDisplay() {
  cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartTotalElement.textContent = `$${cartTotal.toFixed(2)}`;

  checkoutBtn.disabled = cart.length === 0;

  // 🔥 LIMPIAR SOLO LOS PRODUCTOS (NO emptyCart)
  cartItems.querySelectorAll(".cart-item").forEach((item) => item.remove());

  // Mostrar/ocultar mensaje de carrito vacío
  if (cart.length === 0) {
    emptyCart.style.display = "block";
    // ⚠️ NO HACER 'return' aquí, necesitamos continuar
  } else {
    emptyCart.style.display = "none";
  }

  // Siempre renderizar los productos del carrito (aunque esté vacío, simplemente no agregará elementos)
  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>

            <div class="cart-item-quantity">
                <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
            </div>

            <button class="remove-btn" data-id="${item.id}" title="Remover producto">
                <i class="fas fa-trash"></i>
            </button>
        `;

    cartItems.appendChild(cartItem);
  });
}

// Enviar pedido por WhatsApp
function submitOrder(e) {
  e.preventDefault();

  // Obtener datos del formulario
  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const address = document.getElementById("customerAddress").value;
  const notes = document.getElementById("customerNotes").value;

  // Validar teléfono (eliminar caracteres no numéricos)
  const phoneNumber = phone.replace(/\D/g, "");

  // Crear mensaje para WhatsApp
  let message = `*NUEVO PEDIDO - MI TIENDA ONLINE*\n\n`;
  message += `*Cliente:* ${name}\n`;
  message += `*Teléfono:* ${phone}\n`;
  message += `*Dirección:* ${address}\n`;

  if (notes) {
    message += `*Notas:* ${notes}\n`;
  }

  message += `\n*PRODUCTOS:*\n`;

  cart.forEach((item) => {
    message += `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  message += `\n*TOTAL:* $${cartTotal.toFixed(2)}\n\n`;
  message += `Gracias por tu pedido 🙌`;

  // Enlace WhatsApp (CORRECTO)
  const whatsappLink = `https://wa.me/573108694173?text=${encodeURIComponent(message)}`;

  // Abrir WhatsApp en una nueva ventana
  window.open(whatsappLink, "_blank");

  // Cerrar modal y reiniciar carrito
  checkoutModal.classList.remove("active");

  // Mostrar mensaje de confirmación
  alert(
    `¡Pedido enviado con éxito! Se abrirá WhatsApp para que completes el envío.`,
  );

  // Reiniciar carrito
  clearCartLogic();
  updateCartDisplay();

  // Limpiar formulario
  checkoutForm.reset();
}

// Inicializa la rotación automática del banner principal (3 imágenes)
function initHeroBannerRotation() {
  const slides = document.querySelectorAll(".hero-banner .slides .slide");
  if (!slides || slides.length === 0) return;
  let current = 0;

  // Asegurar estado inicial
  slides.forEach((s, i) => {
    s.classList.toggle("active", i === 0);
  });

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 10000); // 10000ms = 10s
}

// Inicializa navbar derecho y paneles
function initRightNav() {
  const toggle = document.getElementById("rightNavToggle");
  const nav = document.getElementById("rightNav");
  const items = document.querySelectorAll(".right-nav-item");
  const panels = document.querySelectorAll(".side-panel");

  if (!toggle || !nav) return;

  // Toggle visual (simple open/close of the nav container)
  let navOpen = false;
  toggle.addEventListener("click", (evt) => {
    evt.stopPropagation();
    navOpen = !navOpen;
    nav.classList.toggle("open", navOpen);
    nav.setAttribute("aria-hidden", (!navOpen).toString());
    toggle.setAttribute("aria-expanded", navOpen.toString());
  });

  // Open a panel by id
  function openPanel(id) {
    closeAllPanels();
    const p = document.getElementById(id);
    if (!p) return;
    p.classList.add("open");
    p.setAttribute("aria-hidden", "false");
  }

  function closePanel(p) {
    if (!p) return;
    p.classList.remove("open");
    p.setAttribute("aria-hidden", "true");
  }

  function closeAllPanels() {
    panels.forEach((p) => closePanel(p));
  }

  // Items open their corresponding panel (and close the small nav)
  items.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const panelId = btn.dataset.panel;
      if (panelId) openPanel(panelId);
      // close the nav list after selecting
      navOpen = false;
      nav.classList.remove("open");
      nav.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      e.stopPropagation();
    });
  });

  // Close buttons inside panels
  document.querySelectorAll("[data-panel-close]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const panel = e.target.closest(".side-panel");
      if (panel) closePanel(panel);
    });
  });

  // Click outside a panel or nav closes panels and nav
  document.addEventListener("click", (e) => {
    const isInsidePanel = !!e.target.closest(".side-panel");
    const isToggleOrNav =
      !!e.target.closest("#rightNav") || !!e.target.closest("#rightNavToggle");
    if (!isInsidePanel && !isToggleOrNav) {
      closeAllPanels();
      // close nav as well
      navOpen = false;
      nav.classList.remove("open");
      nav.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Send help info via mailto: to the entered recipient
  const sendHelpBtn = document.getElementById("sendHelpBtn");
  if (sendHelpBtn) {
    sendHelpBtn.addEventListener("click", () => {
      const recipient = document.getElementById("helpRecipient").value.trim();
      const message = document.getElementById("helpMessage").value.trim();
      if (!recipient) {
        alert("Por favor ingresa un correo destinatario.");
        return;
      }
      // Validar formato básico de email
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(recipient)) {
        alert("Ingresa un correo válido.");
        return;
      }

      const subject = encodeURIComponent(
        "Solicitud de información - Mi Tienda Online",
      );
      const body = encodeURIComponent(
        message || "Solicito información adicional.",
      );
      const mailto = `mailto:${recipient}?subject=${subject}&body=${body}`;
      window.open(mailto, "_blank");

      // Cerrar panel
      const panel = document.getElementById("panel-ayuda");
      if (panel) closePanel(panel);
    });
  }
}
