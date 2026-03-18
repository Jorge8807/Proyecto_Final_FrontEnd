// Hero carousel
(function () {
      var carousel = document.querySelector("[data-hero-carousel]");
      if (!carousel) return;

      var slides = Array.from(carousel.querySelectorAll("[data-slide]"));
      var prev = carousel.querySelector("[data-hero-prev]");
      var next = carousel.querySelector("[data-hero-next]");
      var category = carousel.querySelector("[data-hero-category]");
      var title = carousel.querySelector("[data-hero-title]");
      var price = carousel.querySelector("[data-hero-price]");
      var quoteLink = carousel.querySelector(".hero-quote-link");
      var currentNode = carousel.querySelector("[data-hero-current]");
      var totalNode = carousel.querySelector("[data-hero-total]");
      var current = 0;
      var timer;
      var touchStartX = 0;

      if (totalNode) {
        totalNode.textContent = String(slides.length).padStart(2, "0");
      }

      function render(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === current);
        });
        category.textContent = slides[current].dataset.category;
        title.textContent = slides[current].dataset.title;
        price.textContent = slides[current].dataset.price;
        if (quoteLink) {
          quoteLink.setAttribute("data-quote-interest", slides[current].dataset.title);
        }
        if (currentNode) {
          currentNode.textContent = String(current + 1).padStart(2, "0");
        }
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          render(current + 1);
        }, 5500);
      }

      function stop() {
        if (timer) window.clearInterval(timer);
      }

      prev.addEventListener("click", function () {
        render(current - 1);
        start();
      });

      next.addEventListener("click", function () {
        render(current + 1);
        start();
      });

      carousel.addEventListener("mouseenter", stop);
      carousel.addEventListener("mouseleave", start);
      carousel.addEventListener("touchstart", function (event) {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });
      carousel.addEventListener("touchend", function (event) {
        var diff = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 40) {
          render(current + (diff < 0 ? 1 : -1));
          start();
        }
      }, { passive: true });

      render(0);
      start();
    }());

// Mobile navigation
(function () {
      var toggle = document.querySelector(".menu-toggle");
      var panel = document.querySelector("#mobile-menu");
      if (!toggle || !panel) return;

      function closeMenu() {
        toggle.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
      }

      toggle.addEventListener("click", function () {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        panel.classList.toggle("is-open", !isOpen);
      });

      panel.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 980) closeMenu();
      });
    }());

// Header search and filtering
(function () {
      var form = document.querySelector(".search");
      var input = form ? form.querySelector('input[type="search"]') : null;
      var feedback = document.querySelector("[data-search-feedback]");
      var feedbackTitle = document.querySelector("[data-search-feedback-title]");
      var feedbackCopy = document.querySelector("[data-search-feedback-copy]");
      var clearButton = document.querySelector("[data-search-clear]");
      var activeQuery = "";
      var latestMatchCount = 0;
      var latestFirstMatch = null;
      var groups;

      if (!form || !input) return;

      groups = [
        {
          section: document.querySelector(".hero"),
          items: Array.from(document.querySelectorAll(".hero-grid")),
          highlightRoots: function (item) {
            return Array.from(item.querySelectorAll(".hero-copy, .hero-card"));
          }
        },
        {
          section: document.querySelector("#categories"),
          items: Array.from(document.querySelectorAll("#categories .tile"))
        },
        {
          section: document.querySelector("#featured"),
          items: Array.from(document.querySelectorAll("#featured .product"))
        },
        {
          section: document.querySelector("#offers"),
          items: Array.from(document.querySelectorAll("#offers .offer-card"))
        },
        {
          section: document.querySelector("#benefits"),
          items: Array.from(document.querySelectorAll("#benefits .benefit"))
        },
        {
          section: document.querySelector("#inspiration"),
          items: Array.from(document.querySelectorAll("#inspiration .inspiration-card"))
        }
      ];

      function normalize(text) {
        return (text || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      }

      function updateFeedback(query, matchCount) {
        if (!feedback || !feedbackTitle || !feedbackCopy) return;

        if (!query || matchCount > 0) {
          feedback.hidden = true;
          return;
        }

        feedbackTitle.textContent = "Sin resultados";
        feedbackCopy.textContent = 'No encontramos coincidencias para "' + input.value.trim() + '". Intenta con otro término.';
        feedback.hidden = false;
      }

      function getSearchText(item) {
        var altText = Array.from(item.querySelectorAll("img[alt]")).map(function (image) {
          return image.getAttribute("alt") || "";
        }).join(" ");

        return item.textContent + " " + altText;
      }

      function clearHighlights(root) {
        if (!root) return;

        root.querySelectorAll("mark.search-mark").forEach(function (mark) {
          var textNode = document.createTextNode(mark.textContent);
          mark.replaceWith(textNode);
          if (textNode.parentNode) textNode.parentNode.normalize();
        });
      }

      function getHighlightRanges(text, query) {
        var normalizedChars = [];
        var indexMap = [];
        var normalizedText;
        var ranges = [];
        var startIndex = 0;
        var matchIndex;

        for (var i = 0; i < text.length; i += 1) {
          var normalizedChar = normalize(text.charAt(i));

          for (var j = 0; j < normalizedChar.length; j += 1) {
            normalizedChars.push(normalizedChar.charAt(j));
            indexMap.push(i);
          }
        }

        normalizedText = normalizedChars.join("");

        while (query && (matchIndex = normalizedText.indexOf(query, startIndex)) !== -1) {
          var originalStart = indexMap[matchIndex];
          var originalEnd = indexMap[matchIndex + query.length - 1] + 1;

          ranges.push([originalStart, originalEnd]);
          startIndex = matchIndex + query.length;
        }

        return ranges;
      }

      function highlightTextNode(node, query) {
        var text = node.textContent;
        var ranges = getHighlightRanges(text, query);
        var fragment;
        var lastIndex = 0;

        if (!ranges.length) return;

        fragment = document.createDocumentFragment();

        ranges.forEach(function (range) {
          if (range[0] > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, range[0])));
          }

          var mark = document.createElement("mark");
          mark.className = "search-mark";
          mark.textContent = text.slice(range[0], range[1]);
          fragment.appendChild(mark);
          lastIndex = range[1];
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        node.parentNode.replaceChild(fragment, node);
      }

      function highlightMatches(root, query) {
        var walker;
        var textNodes = [];

        if (!root || !query) return;

        walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function (node) {
            var parent = node.parentNode;

            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.closest("script, style, mark.search-mark")) return NodeFilter.FILTER_REJECT;

            return NodeFilter.FILTER_ACCEPT;
          }
        });

        while (walker.nextNode()) {
          textNodes.push(walker.currentNode);
        }

        textNodes.forEach(function (node) {
          highlightTextNode(node, query);
        });
      }

      function updateSearch() {
        var query = normalize(input.value.trim());
        var matchCount = 0;
        var firstMatch = null;

        activeQuery = query;

        groups.forEach(function (group) {
          var visibleItems = 0;

          group.items.forEach(function (item) {
            var haystack = normalize(getSearchText(item));
            var isMatch = !query || haystack.indexOf(query) !== -1;
            var highlightRoots = typeof group.highlightRoots === "function" ? group.highlightRoots(item) : [item];

            item.hidden = !isMatch;
            item.classList.toggle("is-search-hidden", !isMatch);

            highlightRoots.forEach(function (root) {
              clearHighlights(root);
            });

            if (isMatch) {
              visibleItems += 1;
              matchCount += 1;

              highlightRoots.forEach(function (root) {
                highlightMatches(root, query);
              });

              if (!firstMatch) firstMatch = item;
            }
          });

          if (group.section) {
            group.section.hidden = !!query && visibleItems === 0;
          }
        });

        latestMatchCount = matchCount;
        latestFirstMatch = firstMatch;

        form.classList.toggle("has-value", !!query);
        updateFeedback(query, matchCount);
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (window.innerWidth <= 700 && !form.classList.contains("is-open")) {
          form.classList.add("is-open");
          input.focus();
          return;
        }

        updateSearch();

        if (!activeQuery) return;

        if (latestFirstMatch) {
          latestFirstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (feedback && !feedback.hidden) {
          feedback.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      input.addEventListener("input", updateSearch);

      form.addEventListener("click", function () {
        if (window.innerWidth <= 700) {
          form.classList.add("is-open");
          input.focus();
        }
      });

      input.addEventListener("blur", function () {
        if (window.innerWidth <= 700 && !input.value.trim()) {
          form.classList.remove("is-open");
        }
      });

      document.addEventListener("click", function (event) {
        if (window.innerWidth <= 700 && !form.contains(event.target) && !input.value.trim()) {
          form.classList.remove("is-open");
        }
      });

      if (clearButton) {
        clearButton.addEventListener("click", function () {
          input.value = "";
          form.classList.remove("has-value", "is-open");
          updateSearch();
          input.focus();
        });
      }

      updateSearch();
    }());

// Cart drawer and local cart state
(function () {
      var storageKey = "mi-espacio-ideal-cart";
      var countNode = document.querySelector("[data-cart-count]");
      var totalNode = document.querySelector("[data-cart-total]");
      var subtotalNode = document.querySelector("[data-cart-subtotal]");
      var itemsNode = document.querySelector("[data-cart-items]");
      var drawer = document.querySelector("[data-cart-drawer]");
      var overlay = document.querySelector("[data-cart-overlay]");
      var toast = document.querySelector("[data-cart-toast]");
      var openButton = document.querySelector("[data-cart-toggle]");
      var closeButton = document.querySelector("[data-cart-close]");
      var checkoutButton = document.querySelector(".cart-whatsapp-checkout");
      var addButtons = Array.from(document.querySelectorAll("[data-add-to-cart]"));
      var toastTimer;

      if (!countNode || !totalNode || !subtotalNode || !itemsNode || !drawer || !overlay || !openButton || !toast || !checkoutButton) return;

      function getCart() {
        try {
          return JSON.parse(window.localStorage.getItem(storageKey)) || [];
        } catch (error) {
          return [];
        }
      }

      function saveCart(cart) {
        window.localStorage.setItem(storageKey, JSON.stringify(cart));
      }

      function formatPrice(value) {
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0
        }).format(value);
      }

      function getCheckoutMessage(cart) {
        var totalItems = cart.reduce(function (sum, item) {
          return sum + item.quantity;
        }, 0);
        var subtotal = cart.reduce(function (sum, item) {
          return sum + (item.price * item.quantity);
        }, 0);
        var lines = [
          "Hola, quiero finalizar mi compra.",
          "",
          "Resumen del carrito:"
        ];

        cart.forEach(function (item) {
          lines.push("- " + item.name + " x" + item.quantity + " · " + formatPrice(item.price * item.quantity));
        });

        lines.push("");
        lines.push("Total de artículos: " + totalItems);
        lines.push("Subtotal: " + formatPrice(subtotal));

        return lines.join("\n");
      }

      function renderCart() {
        var cart = getCart();
        var totalItems = cart.reduce(function (sum, item) {
          return sum + item.quantity;
        }, 0);
        var subtotal = cart.reduce(function (sum, item) {
          return sum + (item.price * item.quantity);
        }, 0);

        countNode.textContent = totalItems;
        totalNode.textContent = totalItems;
        subtotalNode.textContent = formatPrice(subtotal);
        checkoutButton.href = "https://wa.me/525512345678?text=" + encodeURIComponent(
          cart.length ? getCheckoutMessage(cart) : "Hola, quiero información sobre mi carrito."
        );

        if (!cart.length) {
          itemsNode.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
          return;
        }

        itemsNode.innerHTML = cart.map(function (item) {
          return '<div class="cart-item">' +
            '<div><h4>' + item.name + '</h4><p>' + formatPrice(item.price) + '</p></div>' +
            '<div class="cart-item-meta">' +
              '<div class="cart-item-quantity">' +
                '<button type="button" class="cart-qty-btn" data-cart-action="decrease" data-cart-item="' + item.name + '" aria-label="Disminuir cantidad de ' + item.name + '">-</button>' +
                '<span>' + item.quantity + '</span>' +
                '<button type="button" class="cart-qty-btn" data-cart-action="increase" data-cart-item="' + item.name + '" aria-label="Aumentar cantidad de ' + item.name + '">+</button>' +
              '</div>' +
              '<button type="button" class="cart-item-remove" data-cart-action="remove" data-cart-item="' + item.name + '" aria-label="Eliminar ' + item.name + '">Eliminar</button>' +
            '</div>' +
          '</div>';
        }).join("");
      }

      function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        if (toastTimer) window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
          toast.classList.remove("is-visible");
        }, 2200);
      }

      function openCart() {
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        overlay.hidden = false;
      }

      function closeCart() {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        overlay.hidden = true;
      }

      addButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          var cart = getCart();
          var name = button.dataset.productName;
          var price = Number(button.dataset.productPrice);
          var existing = cart.find(function (item) {
            return item.name === name;
          });

          if (existing) {
            existing.quantity += 1;
          } else {
            cart.push({ name: name, price: price, quantity: 1 });
          }

          saveCart(cart);
          renderCart();
          showToast(name + " agregado al carrito");
          openCart();
        });
      });

      itemsNode.addEventListener("click", function (event) {
        var actionButton = event.target.closest("[data-cart-action]");
        var cart;
        var name;
        var action;
        var item;

        if (!actionButton) return;

        cart = getCart();
        name = actionButton.getAttribute("data-cart-item");
        action = actionButton.getAttribute("data-cart-action");
        item = cart.find(function (entry) {
          return entry.name === name;
        });

        if (!item) return;

        if (action === "increase") {
          item.quantity += 1;
          showToast(name + " agregado al carrito");
        } else if (action === "decrease") {
          item.quantity -= 1;
          if (item.quantity <= 0) {
            cart = cart.filter(function (entry) {
              return entry.name !== name;
            });
            showToast(name + " eliminado del carrito");
          } else {
            showToast("Cantidad actualizada");
          }
        } else if (action === "remove") {
          cart = cart.filter(function (entry) {
            return entry.name !== name;
          });
          showToast(name + " eliminado del carrito");
        }

        saveCart(cart);
        renderCart();
      });

      openButton.addEventListener("click", openCart);
      if (closeButton) closeButton.addEventListener("click", closeCart);
      overlay.addEventListener("click", closeCart);
      checkoutButton.addEventListener("click", function (event) {
        if (!getCart().length) {
          event.preventDefault();
          showToast("Agrega productos antes de finalizar");
        }
      });

      renderCart();
}());

// Scroll-to-top progress button
(function () {
      var button = document.querySelector("[data-scroll-top]");
      var progress = document.querySelector(".scroll-top-progress");
      if (!button || !progress) return;

      var radius = 22;
      var circumference = 2 * Math.PI * radius;
      progress.style.strokeDasharray = String(circumference);
      progress.style.strokeDashoffset = String(circumference);

      function updateScrollButton() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = docHeight > 0 ? scrollTop / docHeight : 0;
        progress.style.strokeDashoffset = String(circumference - (circumference * ratio));
        button.classList.toggle("is-visible", scrollTop > 260);
      }

      button.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      window.addEventListener("scroll", updateScrollButton, { passive: true });
      updateScrollButton();
    }());

// Active nav state on scroll
(function () {
      var header = document.querySelector(".site-header");
      var links = Array.from(document.querySelectorAll('.menu a[href^="#"], #mobile-menu a[href^="#"]'));
      var sections = links.map(function (link) {
        var id = link.getAttribute("href");
        var section = document.querySelector(id);

        if (!section) return null;

        return {
          id: id,
          section: section
        };
      }).filter(Boolean).filter(function (entry, index, array) {
        return array.findIndex(function (candidate) {
          return candidate.id === entry.id;
        }) === index;
      });

      if (!header || !links.length || !sections.length) return;

      function setActiveLink(id) {
        links.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === id);
        });
      }

      function updateActiveSection() {
        var headerOffset = header.offsetHeight + 18;
        var scrollPosition = window.scrollY + headerOffset;
        var currentId = sections[0].id;

        sections.forEach(function (entry) {
          if (entry.section.offsetTop <= scrollPosition) {
            currentId = entry.id;
          }
        });

        setActiveLink(currentId);
      }

      window.addEventListener("scroll", updateActiveSection, { passive: true });
      window.addEventListener("resize", updateActiveSection);
      updateActiveSection();
    }());

// Exit intent popup
(function () {
      var popup = document.querySelector("[data-exit-popup]");
      var overlay = document.querySelector("[data-exit-popup-overlay]");
      var closeButton = document.querySelector("[data-exit-popup-close]");
      var links = Array.from(document.querySelectorAll("[data-exit-popup-link]"));
      var storageKey = "mi-espacio-ideal-exit-popup-shown";
      var shown = false;
      var canShow = false;

      if (!popup || !overlay || !closeButton) return;

      try {
        shown = window.sessionStorage.getItem(storageKey) === "true";
      } catch (error) {
        shown = false;
      }

      function markShown() {
        shown = true;
        try {
          window.sessionStorage.setItem(storageKey, "true");
        } catch (error) {}
      }

      function openPopup() {
        if (shown || !canShow || window.innerWidth < 768 || window.scrollY < 480) return;
        popup.classList.add("is-visible");
        popup.setAttribute("aria-hidden", "false");
        overlay.hidden = false;
        markShown();
      }

      function closePopup() {
        popup.classList.remove("is-visible");
        popup.setAttribute("aria-hidden", "true");
        overlay.hidden = true;
      }

      document.addEventListener("mouseleave", function (event) {
        if (shown) return;
        if (event.clientY > 0) return;
        openPopup();
      });

      window.setTimeout(function () {
        canShow = true;
      }, 20000);

      closeButton.addEventListener("click", closePopup);
      overlay.addEventListener("click", closePopup);
      links.forEach(function (link) {
        link.addEventListener("click", closePopup);
      });
    }());

// Quote form and prefilled product/ambience links
(function () {
      var form = document.querySelector("[data-quote-form]");
      var note = document.querySelector("[data-quote-form-note]");
      var interestInput = form ? form.elements.interest : null;
      var quoteTriggers = Array.from(document.querySelectorAll("[data-quote-trigger]"));
      var whatsappBase = "https://wa.me/525512345678?text=";

      if (!form || !note || !interestInput) return;

      function setNote(message, isError) {
        note.textContent = message;
        note.classList.toggle("is-error", !!isError);
        note.classList.toggle("is-success", !isError && !!message);
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var name = form.elements.name.value.trim();
        var phone = form.elements.phone.value.trim();
        var interest = form.elements.interest.value.trim();
        var message = form.elements.message.value.trim();

        if (!name || !phone || !interest || !message) {
          setNote("Completa todos los campos antes de enviar.", true);
          return;
        }

        setNote("");

        var whatsappMessage = [
          "Hola, quiero solicitar una cotización.",
          "",
          "Nombre: " + name,
          "WhatsApp: " + phone,
          "Producto o ambiente: " + interest,
          "Detalles: " + message
        ].join("\n");

        window.open(whatsappBase + encodeURIComponent(whatsappMessage), "_blank", "noopener,noreferrer");
        setNote("Abriendo WhatsApp con tu solicitud.", false);
        form.reset();
      });

      quoteTriggers.forEach(function (trigger) {
        trigger.addEventListener("click", function () {
          var interest = trigger.getAttribute("data-quote-interest") || "";

          interestInput.value = interest;
          window.setTimeout(function () {
            interestInput.focus();
            interestInput.select();
          }, 180);
        });
      });
    }());
