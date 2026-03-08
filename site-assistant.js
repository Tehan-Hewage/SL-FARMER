(function () {
  const KNOWLEDGE_URL = "data/site-assistant-knowledge.json?v=20260308-3";
  const STORAGE_KEY = "slfarmer-site-ai-history-v1";
  const MAX_HISTORY_ITEMS = 18;
  const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "the",
    "to",
    "we",
    "what",
    "where",
    "which",
    "who",
    "with",
    "you",
    "your"
  ]);

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^\u0D80-\u0DFFa-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isSinhalaText(value) {
    return /[\u0D80-\u0DFF]/.test(String(value || ""));
  }

  function detectLanguage(value) {
    return isSinhalaText(value) ? "si" : "en";
  }

  function getPreferredLanguage() {
    const browserLanguage = String((window.navigator && window.navigator.language) || "").toLowerCase();
    return browserLanguage.startsWith("si") ? "si" : "en";
  }

  function tokenize(value) {
    return normalizeText(value)
      .split(" ")
      .filter((token) => token && !STOP_WORDS.has(token));
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function localizeActionLabel(label, language) {
    if (language !== "si") return label;

    const labelMap = {
      Home: "මුල් පිටුව",
      Products: "නිෂ්පාදන",
      "Products page": "නිෂ්පාදන පිටුව",
      Contact: "සම්බන්ධ වන්න",
      WhatsApp: "වට්ස්ඇප්",
      "Call Now": "දැන් අමතන්න",
      "Send Email": "ඊමේල් යවන්න",
      Email: "ඊමේල්",
      "Open Contact": "Contact විවෘත කරන්න",
      "Open Products": "Products විවෘත කරන්න",
      "Open Gallery": "Gallery විවෘත කරන්න",
      "Open About": "About විවෘත කරන්න",
      "Open Our Story": "Our Story විවෘත කරන්න",
      "Open Contact Form": "Contact form විවෘත කරන්න",
      "View Gallery": "Gallery බලන්න",
      "About SL Farmer": "SL Farmer ගැන",
      "Open Facebook": "Facebook විවෘත කරන්න",
      "Open Instagram": "Instagram විවෘත කරන්න"
    };

    return labelMap[label] || label;
  }

  function localizeActions(actions, language) {
    if (language !== "si") return actions || [];
    return (actions || []).map((action) => ({
      ...action,
      label: localizeActionLabel(action.label, language)
    }));
  }

  function localizeSuggestion(suggestion, language) {
    if (language !== "si") return suggestion;

    const exactMap = {
      "Show all products": "සියලු නිෂ්පාදන පෙන්වන්න",
      "What is the WhatsApp number?": "WhatsApp අංකය මොකක්ද?",
      "What is the phone number?": "දුරකථන අංකය මොකක්ද?",
      "What is the email address?": "ඊමේල් ලිපිනය මොකක්ද?",
      "Do you have delivery details?": "ඩිලිවරි විස්තර තියෙනවද?",
      "Tell me about SL Farmer": "SL Farmer ගැන කියන්න",
      "How can I place an order?": "ඇණවුමක් දාන්නේ කොහොමද?",
      "How can I order?": "ඇණවුම් කරන්නේ කොහොමද?",
      "How can I contact SL Farmer?": "SL Farmer එක්ක සම්බන්ධ වන්නේ කොහොමද?",
      "Where are you located?": "ඔබලා සිටින්නේ කොහේද?",
      "What products do you sell?": "ඔබලා විකුණන නිෂ්පාදන මොනවද?",
      "How do you farm naturally?": "ඔබලා ස්වභාවිකව වගා කරන්නේ කොහොමද?",
      "How big is the farm?": "ගොවිපල කොච්චර විශාලද?",
      "Who are the founders?": "ආරම්භකයෝ කවුද?",
      "What is in the gallery?": "ගැලරියේ මොනවද තියෙන්නේ?",
      "Show the gallery": "ගැලරිය පෙන්වන්න",
      "Show me the gallery": "ගැලරිය පෙන්වන්න",
      "Show the products page": "නිෂ්පාදන පිටුව පෙන්වන්න"
    };

    if (exactMap[suggestion]) {
      return exactMap[suggestion];
    }

    let match = suggestion.match(/^What is (.+) price\?$/);
    if (match) return `${match[1]} මිල කීයද?`;

    match = suggestion.match(/^Is (.+) available\?$/);
    if (match) return `${match[1]} ලබා ගත හැකිද?`;

    match = suggestion.match(/^How can I order (.+)\?$/);
    if (match) return `${match[1]} ඇණවුම් කරන්නේ කොහොමද?`;

    match = suggestion.match(/^Tell me about (.+)$/);
    if (match) return `${match[1]} ගැන කියන්න`;

    return suggestion;
  }

  function localizeSuggestions(suggestions, language) {
    return unique((suggestions || []).map((suggestion) => localizeSuggestion(suggestion, language)));
  }

  function getCurrentPageId() {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.endsWith("/products.html") || pathname.endsWith("products.html")) {
      return "products";
    }
    if (pathname.endsWith("/gallery.html") || pathname.endsWith("gallery.html")) {
      return "gallery";
    }
    return "home";
  }

  class WebsiteAssistantModel {
    constructor(knowledge) {
      this.knowledge = knowledge;
      this.pageId = getCurrentPageId();
      this.entries = knowledge.entries || [];
      this.entryMap = new Map(this.entries.map((entry) => [entry.id, entry]));
      this.products = knowledge.products || [];
      this.productMap = new Map(this.products.map((product) => [product.id, product]));
      this.trainingExamples = (knowledge.trainingExamples || []).map((example) => ({
        entryId: example.entryId,
        question: example.question,
        normalized: normalizeText(example.question),
        tokens: tokenize(example.question)
      }));
      this.entrySearch = new Map(
        this.entries.map((entry) => [
          entry.id,
          {
            keywords: tokenize((entry.keywords || []).join(" ")),
            searchText: normalizeText(
              [entry.title, entry.answer, ...(entry.keywords || []), ...(entry.sampleQuestions || [])].join(" ")
            )
          }
        ])
      );
    }

    getDefaultSuggestions(pageId = this.pageId, language = "en") {
      if (language === "si") {
        if (pageId === "products") {
          return [
            "සියලු නිෂ්පාදන පෙන්වන්න",
            "අන්නාසි ලබා ගත හැකිද?",
            "ඉඟුරු මිල කීයද?",
            "ඇණවුමක් දාන්නේ කොහොමද?"
          ];
        }

        if (pageId === "gallery") {
          return [
            "ගැලරියේ මොනවද තියෙන්නේ?",
            "ඔබලා ස්වභාවිකව වගා කරන්නේ කොහොමද?",
            "ගොවිපල කොච්චර විශාලද?",
            "ආරම්භකයෝ කවුද?"
          ];
        }

        return [
          "ඔබලා විකුණන නිෂ්පාදන මොනවද?",
          "SL Farmer ගැන කියන්න",
          "SL Farmer එක්ක සම්බන්ධ වන්නේ කොහොමද?",
          "ඇණවුමක් දාන්නේ කොහොමද?"
        ];
      }

      if (pageId === "products") {
        return [
          "Show all products",
          "Is pineapple available?",
          "What is ginger price?",
          "How can I place an order?"
        ];
      }

      if (pageId === "gallery") {
        return [
          "What is in the gallery?",
          "How do you farm naturally?",
          "How big is the farm?",
          "Who are the founders?"
        ];
      }

      return [
        "What products do you sell?",
        "Tell me about SL Farmer",
        "How can I contact SL Farmer?",
        "How can I place an order?"
      ];
    }

    getWelcomeResponse(pageId = this.pageId, language = "en") {
      const entryId = pageId === "products" ? "product-catalog" : pageId === "gallery" ? "gallery-overview" : "site-overview";
      const entry = this.getEntry(entryId) || this.getEntry("greeting");
      return this.buildEntryResponse(entry, { pageId, language }, "welcome");
    }

    getEntry(id) {
      return this.entryMap.get(id) || null;
    }

    hasBlockedIntent(normalizedQuery) {
      return /\b(admin|dashboard|login|manager|firebase|permission|panel|role|auth|පරිපාලන|ඩැෂ්බෝඩ්)\b/.test(normalizedQuery);
    }

    isGreeting(normalizedQuery) {
      return /^(hi|hello|hey|good morning|good afternoon|good evening|start|help|ආයුබෝවන්|හායි|හෙලෝ)$/.test(normalizedQuery);
    }

    detectExplicitProduct(normalizedQuery) {
      let match = null;
      let matchLength = 0;

      this.products.forEach((product) => {
        [...(product.aliases || []), ...(product.aliasesSi || [])].forEach((alias) => {
          const normalizedAlias = normalizeText(alias);
          if (!normalizedAlias) return;
          if (normalizedQuery.includes(normalizedAlias) && normalizedAlias.length > matchLength) {
            match = product;
            matchLength = normalizedAlias.length;
          }
        });
      });

      return match;
    }

    hasFollowUpProductReference(normalizedQuery) {
      return /\b(it|its|this|that|this one|that one|this product|that product|this item|that item|same one|same product|same item|මේක|ඒක|එය|මේ නිෂ්පාදනය|ඒ නිෂ්පාදනය)\b/.test(
        normalizedQuery
      );
    }

    isGenericWebsiteQuestion(normalizedQuery) {
      return /\b(website|site|online|checkout|cart|payment|pay|delivery|shipping|return|refund|policy|phone|email|whatsapp|contact|a product|products|product list|catalog|වෙබ් අඩවිය|සයිට්|නිෂ්පාදන|ඩිලිවරි|refund|return|ඊමේල්|වට්ස්ඇප්|දුරකථන)\b/.test(
        normalizedQuery
      );
    }

    detectProduct(normalizedQuery, lastProductId) {
      const explicitMatch = this.detectExplicitProduct(normalizedQuery);
      if (explicitMatch) {
        return explicitMatch;
      }

      if (!lastProductId || !this.hasFollowUpProductReference(normalizedQuery) || this.isGenericWebsiteQuestion(normalizedQuery)) {
        return null;
      }

      return this.productMap.get(lastProductId) || null;
    }

    detectFounderEntry(normalizedQuery) {
      if (normalizedQuery.includes("jayasanka") || normalizedQuery.includes("ජයසංක")) {
        return this.getEntry("founder-jayasanka");
      }
      if (normalizedQuery.includes("upul") || normalizedQuery.includes("උපුල්")) {
        return this.getEntry("founder-upul");
      }
      return null;
    }

    detectCatalogQuery(normalizedQuery) {
      return /\b(all products|product list|catalog|what do you sell|show me all products|show products|what can i buy|සියලු නිෂ්පාදන|නිෂ්පාදන ලැයිස්තුව|විකුණන නිෂ්පාදන|මොනවද විකුණන්නේ)\b/.test(normalizedQuery);
    }

    detectDirectEntry(normalizedQuery) {
      if ((/\b(order|buy|purchase|checkout|cart|pay online|payment|ඇණවුම්|ගන්න|මිලදී)\b/.test(normalizedQuery) && /\b(website|site|online|product|products|from you|from sl farmer|from your website|from the website|වෙබ් අඩවිය|site|නිෂ්පාදන)\b/.test(normalizedQuery)) || /\b(ඇණවුමක් දාන්නේ කොහොමද|website එකෙන් ගන්න පුළුවන්ද|online order)\b/.test(normalizedQuery)) {
        return this.getEntry("order-general");
      }

      if (/\b(delivery|shipping|ship|deliver|ඩිලිවරි|බෙදාහැරීම)\b/.test(normalizedQuery)) {
        return this.getEntry("delivery-info");
      }

      if (/\b(return|refund|exchange|returns|ආපසු|refund)\b/.test(normalizedQuery)) {
        return this.getEntry("returns-info");
      }

      if (/\b(whatsapp|වට්ස්ඇප්)\b/.test(normalizedQuery)) {
        return this.getEntry("contact-whatsapp");
      }

      if (/\b(email|mail|ඊමේල්)\b/.test(normalizedQuery)) {
        return this.getEntry("contact-email");
      }

      if (/\b(phone|telephone|call|contact number|දුරකථන|ෆෝන්|අංකය)\b/.test(normalizedQuery)) {
        return this.getEntry("contact-phone");
      }

      return null;
    }

    getProductTopic(normalizedQuery) {
      if (/\b(price|cost|how much|rate|මිල|ගාන)\b/.test(normalizedQuery)) return "price";
      if (/\b(available|availability|stock|in stock|out of stock|තියෙනවද|ලබා)\b/.test(normalizedQuery)) return "availability";
      if (/\b(order|buy|purchase|checkout|ඇණවුම්|ගන්න|මිලදී)\b/.test(normalizedQuery)) return "order";
      return "overview";
    }

    findBestEntry(normalizedQuery, pageId) {
      const queryTokens = tokenize(normalizedQuery);
      const scores = new Map();

      this.trainingExamples.forEach((example) => {
        if (!example.tokens.length) return;
        let overlap = 0;
        example.tokens.forEach((token) => {
          if (queryTokens.includes(token)) overlap += 1;
        });
        if (!overlap) return;

        let score = overlap * 7;
        if (example.normalized === normalizedQuery) score += 90;
        if (example.normalized.includes(normalizedQuery) || normalizedQuery.includes(example.normalized)) score += 15;
        if (overlap === queryTokens.length && queryTokens.length > 0) score += 14;

        const current = scores.get(example.entryId) || 0;
        if (score > current) scores.set(example.entryId, score);
      });

      this.entries.forEach((entry) => {
        const search = this.entrySearch.get(entry.id);
        if (!search) return;

        let score = scores.get(entry.id) || 0;
        search.keywords.forEach((keyword) => {
          if (queryTokens.includes(keyword)) score += 5;
        });
        if (search.searchText.includes(normalizedQuery) && normalizedQuery.length > 2) score += 12;
        if ((entry.pageBias || []).includes(pageId)) score += 4;
        scores.set(entry.id, score);
      });

      let winner = null;
      let winnerScore = 0;

      scores.forEach((score, entryId) => {
        if (score > winnerScore) {
          winner = this.getEntry(entryId);
          winnerScore = score;
        }
      });

      return winnerScore >= 18 ? winner : null;
    }

    buildProductResponse(product, topic, context) {
      const language = context.language || "en";
      const liveStatus = typeof context.getProductStatus === "function" ? context.getProductStatus(product.id) : "";
      const statusText = liveStatus || product.defaultAvailability;
      const localizedStatusText = language === "si" && /available/i.test(statusText) ? (product.defaultAvailabilitySi || "ලබා ගත හැක") : statusText;
      const actions = localizeActions([
        { label: "Products page", href: "products.html", external: false },
        { label: "WhatsApp", href: this.knowledge.contact.whatsapp, external: true },
        { label: "Contact", href: "index.html#contact", external: false }
      ], language);

      if (topic === "price") {
        if (language === "si") {
          return {
            entryId: `product-${product.id}-price`,
            productId: product.id,
            language,
            text: `${product.nameSi || product.name} සඳහා දක්වා ඇති මිල ${product.price} ${product.unitSi || product.unit}.`,
            actions,
            suggestions: [
              `${product.nameSi || product.name} ලබා ගත හැකිද?`,
              `${product.nameSi || product.name} ඇණවුම් කරන්නේ කොහොමද?`,
              `${product.nameSi || product.name} ගැන කියන්න`,
              "සියලු නිෂ්පාදන පෙන්වන්න"
            ]
          };
        }

        return {
          entryId: `product-${product.id}-price`,
          productId: product.id,
          language,
          text: `${product.name} is listed at ${product.price} ${product.unit}.`,
          actions,
          suggestions: [
            `Is ${product.name} available?`,
            `How can I order ${product.name}?`,
            `Tell me about ${product.name}`,
            "Show all products"
          ]
        };
      }

      if (topic === "availability") {
        if (language === "si") {
          const suffix = liveStatus
            ? ` දැනට මෙම පිටුවේ එය ${localizedStatusText} ලෙස පෙන්වයි.`
            : " නවතම availability badge එක Products page එකේ පෙන්වයි.";

          return {
            entryId: `product-${product.id}-availability`,
            productId: product.id,
            language,
            text: `${product.nameSi || product.name} ${localizedStatusText} ලෙස දක්වා ඇත.${suffix}`,
            actions,
            suggestions: [
              `${product.nameSi || product.name} මිල කීයද?`,
              `${product.nameSi || product.name} ඇණවුම් කරන්නේ කොහොමද?`,
              "WhatsApp අංකය මොකක්ද?",
              "සියලු නිෂ්පාදන පෙන්වන්න"
            ]
          };
        }

        const suffix = liveStatus
          ? ` Right now, the current page shows it as ${statusText}.`
          : " The Products page shows the latest availability badge.";

        return {
          entryId: `product-${product.id}-availability`,
          productId: product.id,
          language,
          text: `${product.name} is marked ${statusText}.${suffix}`,
          actions,
          suggestions: [
            `What is ${product.name} price?`,
            `How can I order ${product.name}?`,
            "What is the WhatsApp number?",
            "Show all products"
          ]
        };
      }

      if (topic === "order") {
        if (language === "si") {
          return {
            entryId: `product-${product.id}-order`,
            productId: product.id,
            language,
            text: `${product.nameSi || product.name} ඇණවුම් කිරීමට WhatsApp, දුරකථනය, ඊමේල් හෝ contact form එක භාවිතා කර SL Farmer සමඟ සම්බන්ධ වන්න. පොදු වෙබ් අඩවියේ cart checkout එකක් නොමැත.`,
            actions,
            suggestions: [
              `${product.nameSi || product.name} මිල කීයද?`,
              `${product.nameSi || product.name} ලබා ගත හැකිද?`,
              "දුරකථන අංකය මොකක්ද?",
              "ඊමේල් ලිපිනය මොකක්ද?"
            ]
          };
        }

        return {
          entryId: `product-${product.id}-order`,
          productId: product.id,
          language,
          text: `To order ${product.name}, contact SL Farmer through WhatsApp, phone, email, or the contact form. The public website does not have a cart checkout.`,
          actions,
          suggestions: [
            `What is ${product.name} price?`,
            `Is ${product.name} available?`,
            "What is the phone number?",
            "What is the email address?"
          ]
        };
      }

      if (language === "si") {
        return {
          entryId: `product-${product.id}-overview`,
          productId: product.id,
          language,
          text: `${product.nameSi || product.name}: ${product.descriptionSi || product.description} මෙය ${product.price} ${product.unitSi || product.unit} ලෙස දක්වා ඇත.${localizedStatusText ? ` වත්මන් තත්ත්වය: ${localizedStatusText}.` : ""}`,
          actions,
          suggestions: [
            `${product.nameSi || product.name} මිල කීයද?`,
            `${product.nameSi || product.name} ලබා ගත හැකිද?`,
            `${product.nameSi || product.name} ඇණවුම් කරන්නේ කොහොමද?`,
            "සියලු නිෂ්පාදන පෙන්වන්න"
          ]
        };
      }

      return {
        entryId: `product-${product.id}-overview`,
        productId: product.id,
        language,
        text: `${product.name}: ${product.description} It is listed at ${product.price} ${product.unit}.${statusText ? ` Current status: ${statusText}.` : ""}`,
        actions,
        suggestions: [
          `What is ${product.name} price?`,
          `Is ${product.name} available?`,
          `How can I order ${product.name}?`,
          "Show all products"
        ]
      };
    }

    buildEntryResponse(entry, context, fallbackId) {
      const language = context.language || "en";

      if (!entry) {
        const fallbackEntry = this.getEntry(fallbackId || "help");
        return {
          entryId: fallbackEntry ? fallbackEntry.id : "help",
          productId: "",
          language,
          text:
            language === "si"
              ? "මට SL Farmer පොදු වෙබ් අඩවියේ නිෂ්පාදන, මිල, availability, founders, farm, gallery details, contact options සහ ordering ගැන පිළිතුරු දිය හැක."
              : "I can answer from the public SL Farmer website about products, prices, availability, founders, the farm, gallery details, contact options, and ordering.",
          actions: fallbackEntry ? localizeActions(fallbackEntry.actions || [], language) : [],
          suggestions: this.getDefaultSuggestions(context.pageId, language)
        };
      }

      if (entry.type.startsWith("product-") && entry.productId) {
        const product = this.productMap.get(entry.productId);
        if (product) {
          const topic = entry.type.replace("product-", "");
          return this.buildProductResponse(product, topic, context);
        }
      }

      return {
        entryId: entry.id,
        productId: entry.productId || "",
        language,
        text: language === "si" && entry.answerSi ? entry.answerSi : entry.answer,
        actions: localizeActions(entry.actions || [], language),
        suggestions:
          language === "si"
            ? ((entry.suggestionsSi && entry.suggestionsSi.length ? entry.suggestionsSi : localizeSuggestions(entry.suggestions || [], language)).length
              ? (entry.suggestionsSi && entry.suggestionsSi.length ? entry.suggestionsSi : localizeSuggestions(entry.suggestions || [], language))
              : this.getDefaultSuggestions(context.pageId, language))
            : ((entry.suggestions && entry.suggestions.length ? entry.suggestions : this.getDefaultSuggestions(context.pageId, language)))
      };
    }

    answer(question, context, lastProductId) {
      const normalizedQuery = normalizeText(question);
      const pageId = context.pageId || this.pageId;
      const language = detectLanguage(question);

      if (!normalizedQuery) {
        return this.buildEntryResponse(this.getEntry("help"), { pageId, language }, "help");
      }

      if (this.hasBlockedIntent(normalizedQuery)) {
        return this.buildEntryResponse(this.getEntry("public-scope"), { pageId, language }, "public-scope");
      }

      if (this.isGreeting(normalizedQuery)) {
        return this.buildEntryResponse(this.getEntry("greeting"), { pageId, language }, "greeting");
      }

      if (this.detectCatalogQuery(normalizedQuery)) {
        return this.buildEntryResponse(this.getEntry("product-catalog"), { pageId, language }, "product-catalog");
      }

      const explicitProduct = this.detectExplicitProduct(normalizedQuery);
      if (explicitProduct) {
        return this.buildProductResponse(explicitProduct, this.getProductTopic(normalizedQuery), { ...context, language });
      }

      const founderEntry = this.detectFounderEntry(normalizedQuery);
      if (founderEntry) {
        return this.buildEntryResponse(founderEntry, { pageId, language }, founderEntry.id);
      }

      const directEntry = this.detectDirectEntry(normalizedQuery);
      if (directEntry) {
        return this.buildEntryResponse(directEntry, { pageId, language }, directEntry.id);
      }

      const product = this.detectProduct(normalizedQuery, lastProductId);
      if (product) {
        return this.buildProductResponse(product, this.getProductTopic(normalizedQuery), { ...context, language });
      }

      const bestEntry = this.findBestEntry(normalizedQuery, pageId);
      if (bestEntry) {
        return this.buildEntryResponse(bestEntry, { pageId, language }, bestEntry.id);
      }

      return {
        entryId: "fallback",
        productId: "",
        language,
        text:
          language === "si"
            ? "මට ඒක පොදු වෙබ් අඩවියේ අන්තර්ගතයට නිවැරදිව ගැළපීමට නොහැකි විය. නිෂ්පාදන, මිල, stock status, ස්වභාවික වගාව, gallery photos, founders, contact details, delivery information හෝ ordering ගැන අහන්න."
            : "I could not match that to the public website content exactly. Try asking about products, prices, stock status, natural farming, gallery photos, founders, contact details, delivery information, or ordering.",
        actions: localizeActions([{ label: "Products", href: "products.html", external: false }, { label: "Contact", href: "index.html#contact", external: false }], language),
        suggestions: this.getDefaultSuggestions(pageId, language)
      };
    }
  }

  class SiteAssistantApp {
    constructor() {
      this.pageId = getCurrentPageId();
      this.preferredLanguage = getPreferredLanguage();
      this.model = null;
      this.history = [];
      this.lastProductId = "";
      this.typingNode = null;
      this.scrollToTopButton = null;
      this.buildUi();
      this.bindEvents();
      this.loadKnowledge();
    }

    buildUi() {
      const wrapper = document.createElement("div");
      wrapper.className = "site-ai-widget";
      wrapper.innerHTML = `
        <button class="site-ai-launcher" type="button" aria-expanded="false" aria-controls="siteAiPanel">
          <span class="site-ai-launcher__glow"></span>
          <span class="site-ai-launcher__icon"><i class="fas fa-comment-dots"></i></span>
          <span class="site-ai-launcher__text">
            <strong>Ask SL AI</strong>
            <small>Products, farm, founders, contact</small>
          </span>
        </button>
        <section class="site-ai-panel" id="siteAiPanel" hidden aria-label="SL Farmer AI assistant">
          <header class="site-ai-panel__header">
            <div class="site-ai-panel__copy">
              <p class="site-ai-panel__eyebrow"><span></span>SL AI Assistant</p>
              <h3>Public Website Guide</h3>
              <p class="site-ai-panel__subtext">Ask about products, prices, availability, farm story, gallery, and contact details.</p>
            </div>
            <div class="site-ai-panel__actions">
              <button class="site-ai-clear" type="button" aria-label="Clear chat" title="Clear chat">
                <i class="fas fa-trash-can"></i>
              </button>
              <button class="site-ai-close" type="button" aria-label="Close assistant">
                <i class="fas fa-xmark"></i>
              </button>
            </div>
          </header>
          <div class="site-ai-panel__body">
            <div class="site-ai-suggestions" data-site-ai-suggestions></div>
            <div class="site-ai-messages" data-site-ai-messages aria-live="polite"></div>
          </div>
          <form class="site-ai-form" data-site-ai-form>
            <label class="sr-only" for="siteAiInput">Ask SL AI</label>
            <textarea id="siteAiInput" class="site-ai-input" rows="1" placeholder="Ask about products, prices, founders, or contact..." disabled></textarea>
            <button class="site-ai-send" type="submit" disabled aria-label="Send message">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        </section>
      `;

      document.body.appendChild(wrapper);

      this.root = wrapper;
      this.launcher = wrapper.querySelector(".site-ai-launcher");
      this.panel = wrapper.querySelector(".site-ai-panel");
      this.clearButton = wrapper.querySelector(".site-ai-clear");
      this.closeButton = wrapper.querySelector(".site-ai-close");
      this.messages = wrapper.querySelector("[data-site-ai-messages]");
      this.suggestions = wrapper.querySelector("[data-site-ai-suggestions]");
      this.form = wrapper.querySelector("[data-site-ai-form]");
      this.input = wrapper.querySelector(".site-ai-input");
      this.sendButton = wrapper.querySelector(".site-ai-send");
      this.scrollToTopButton = document.querySelector(".scroll-to-top");
      this.syncFloatingControls();
    }

    bindEvents() {
      this.launcher.addEventListener("click", () => this.open());
      this.clearButton.addEventListener("click", () => this.clearChat());
      this.closeButton.addEventListener("click", () => this.close());

      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = this.input.value.trim();
        if (!value || !this.model) return;
        this.handleUserMessage(value);
      });

      this.input.addEventListener("input", () => this.resizeInput());

      this.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          this.form.requestSubmit();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !this.panel.hidden) {
          this.close();
        }
      });

      this.suggestions.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-question]");
        if (!button || !this.model) return;
        this.handleUserMessage(button.dataset.question || "");
      });
    }

    async loadKnowledge() {
      try {
        const response = await fetch(KNOWLEDGE_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Knowledge request failed with ${response.status}`);
        }

        const knowledge = await response.json();
        this.model = new WebsiteAssistantModel(knowledge);

        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.resizeInput();
        this.restoreHistory();

        if (!this.history.length) {
          const welcome = this.model.getWelcomeResponse(this.pageId, this.preferredLanguage);
          this.pushBotMessage(welcome.text, welcome.actions, welcome.suggestions, welcome.productId, welcome.language);
        } else {
          this.setSuggestions(this.model.getDefaultSuggestions(this.pageId, this.preferredLanguage));
          this.renderHistory();
        }
      } catch (error) {
        console.error("SL AI Assistant failed to load knowledge:", error);
        this.setSuggestions([]);
        this.messages.innerHTML =
          '<div class="site-ai-message-row site-ai-message-row--bot"><div class="site-ai-bubble"><div class="site-ai-bubble__text"><p>The assistant could not load the website knowledge file.</p></div></div></div>';
      }
    }

    open() {
      this.panel.hidden = false;
      this.launcher.setAttribute("aria-expanded", "true");
      this.root.classList.add("is-open");
      this.syncFloatingControls(true);
      window.setTimeout(() => {
        this.resizeInput();
        this.input.focus();
      }, 40);
    }

    close() {
      this.panel.hidden = true;
      this.launcher.setAttribute("aria-expanded", "false");
      this.root.classList.remove("is-open");
      this.syncFloatingControls(false);
    }

    handleUserMessage(question) {
      const cleanQuestion = question.trim();
      if (!cleanQuestion) return;

      this.input.value = "";
      this.resizeInput();
      this.pushUserMessage(cleanQuestion);
      this.showTyping();

      window.setTimeout(() => {
        this.hideTyping();
        const response = this.model.answer(cleanQuestion, this.getContext(), this.lastProductId);
        this.pushBotMessage(response.text, response.actions, response.suggestions, response.productId, response.language);
      }, 280);
    }

    getContext() {
      return {
        pageId: this.pageId,
        getProductStatus: (productId) => {
          const statusNode = document.querySelector(`[data-product-id="${productId}"] [data-status]`);
          return statusNode ? statusNode.textContent.trim() : "";
        }
      };
    }

    showTyping() {
      if (this.typingNode) return;
      const row = document.createElement("div");
      row.className = "site-ai-message-row site-ai-message-row--bot";
      row.innerHTML = `
        <div class="site-ai-bubble site-ai-bubble--typing">
          <span></span><span></span><span></span>
        </div>
      `;
      this.typingNode = row;
      this.messages.appendChild(row);
      this.scrollMessages();
    }

    hideTyping() {
      if (!this.typingNode) return;
      this.typingNode.remove();
      this.typingNode = null;
    }

    pushUserMessage(text) {
      this.history.push({ sender: "user", text, actions: [] });
      this.trimHistory();
      this.renderHistory();
      this.persistHistory();
    }

    pushBotMessage(text, actions, suggestions, productId, language) {
      if (productId) {
        this.lastProductId = productId;
      }

      if (language) {
        this.preferredLanguage = language;
      }

      const payload = {
        sender: "bot",
        text,
        actions: actions || []
      };

      this.history.push(payload);
      this.trimHistory();
      this.renderHistory();
      this.setSuggestions(suggestions && suggestions.length ? suggestions : this.model.getDefaultSuggestions(this.pageId, this.preferredLanguage));
      this.persistHistory();
    }

    trimHistory() {
      if (this.history.length <= MAX_HISTORY_ITEMS) return;
      this.history = this.history.slice(this.history.length - MAX_HISTORY_ITEMS);
    }

    renderHistory() {
      this.messages.innerHTML = "";
      this.history.forEach((item) => this.renderMessage(item));
      this.scrollMessages();
    }

    renderMessage(item) {
      const row = document.createElement("div");
      row.className = `site-ai-message-row site-ai-message-row--${item.sender}`;
      row.innerHTML = `
        <div class="site-ai-bubble">
          <div class="site-ai-bubble__text">${this.renderBubbleText(item.text)}</div>
          ${this.renderActions(item.actions || [])}
        </div>
      `;
      this.messages.appendChild(row);
      this.scrollMessages();
    }

    renderBubbleText(text) {
      return String(text || "")
        .split("\n")
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");
    }

    renderActions(actions) {
      if (!actions || !actions.length) return "";
      const markup = actions
        .map((actionItem) => {
          const rel = actionItem.external ? ' rel="noopener noreferrer"' : "";
          const target = actionItem.external ? ' target="_blank"' : "";
          return `<a class="site-ai-action" href="${escapeHtml(actionItem.href)}"${target}${rel}>${escapeHtml(actionItem.label)}</a>`;
        })
        .join("");
      return `<div class="site-ai-actions">${markup}</div>`;
    }

    setSuggestions(questions) {
      const promptList = unique(questions).slice(0, 6);
      this.suggestions.innerHTML = promptList
        .map(
          (question) =>
            `<button type="button" class="site-ai-suggestion" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`
        )
        .join("");
    }

    scrollMessages() {
      this.messages.scrollTop = this.messages.scrollHeight;
    }

    persistHistory() {
      try {
        const payload = {
          pageId: this.pageId,
          lastProductId: this.lastProductId,
          history: this.history.slice(-MAX_HISTORY_ITEMS)
        };
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn("SL AI Assistant history persistence skipped:", error);
      }
    }

    restoreHistory() {
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== "object") return;
        if (payload.pageId !== this.pageId) return;
        this.lastProductId = payload.lastProductId || "";
        this.history = Array.isArray(payload.history) ? payload.history : [];
      } catch (error) {
        console.warn("SL AI Assistant history restore skipped:", error);
      }
    }

    clearChat() {
      this.hideTyping();
      this.history = [];
      this.lastProductId = "";
      this.messages.innerHTML = "";
      this.input.value = "";
      this.resizeInput();

      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("SL AI Assistant history clear skipped:", error);
      }

      if (!this.model) {
        this.setSuggestions([]);
        return;
      }

      const welcome = this.model.getWelcomeResponse(this.pageId, this.preferredLanguage);
      this.pushBotMessage(welcome.text, welcome.actions, welcome.suggestions, welcome.productId, welcome.language);
    }

    resizeInput() {
      if (!this.input) return;
      const minHeight = 56;
      const maxHeight = 128;
      this.input.style.height = "auto";
      const nextHeight = Math.min(Math.max(this.input.scrollHeight, minHeight), maxHeight);
      this.input.style.height = `${nextHeight}px`;
      this.input.style.overflowY = this.input.scrollHeight > maxHeight ? "auto" : "hidden";
    }

    syncFloatingControls(panelOpen = false) {
      const scrollToTop = this.scrollToTopButton || document.querySelector(".scroll-to-top");
      if (!scrollToTop) return;

      this.scrollToTopButton = scrollToTop;
      scrollToTop.style.right = "max(16px, env(safe-area-inset-right))";

      if (panelOpen) {
        scrollToTop.style.opacity = "0";
        scrollToTop.style.pointerEvents = "none";
        scrollToTop.style.transform = "translateY(8px)";
        return;
      }

      scrollToTop.style.bottom = "calc(max(16px, env(safe-area-inset-bottom)) + 86px)";
      scrollToTop.style.opacity = "";
      scrollToTop.style.pointerEvents = "";
      scrollToTop.style.transform = "";
    }
  }

  function initSiteAssistant() {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes("/admin/")) return;
    if (document.querySelector(".site-ai-widget")) return;
    new SiteAssistantApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteAssistant);
  } else {
    initSiteAssistant();
  }
})();
