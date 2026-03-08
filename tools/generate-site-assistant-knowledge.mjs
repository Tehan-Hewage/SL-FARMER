import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const outputPath = path.join(dataDir, "site-assistant-knowledge.json");

const brand = {
  name: "SL Farmer",
  assistantName: "SL AI Assistant",
  tagline: "Farm Fresh Goodness",
  scope: "public-website-only",
  description:
    "SL Farmer is a Sri Lankan family farm offering naturally grown produce through a public website with product, gallery, founder, and contact information."
};

const contact = {
  phone: "+94 75 151 9573",
  phoneHref: "tel:+94751519573",
  email: "SLfarmercompany@gmail.com",
  emailHref: "mailto:SLfarmercompany@gmail.com",
  whatsapp: "https://wa.me/94751519573",
  facebook: "https://www.facebook.com/profile.php?id=61583678220885",
  instagram: "https://www.instagram.com/slfarmer",
  address: "No. 324/1, Meemana, Pokunuwita, Sri Lanka",
  mapEmbed:
    "https://maps.google.com/maps?width=600&height=400&hl=en&q=6.734426%2C%2080.042117&t=&z=14&ie=UTF8&iwloc=B&output=embed",
  businessHours: "Daily from 08:00 to 18:00"
};

const pages = [
  {
    id: "home",
    title: "Home",
    url: "index.html",
    summary: "Hero section, about section, founder story, featured products, and contact details."
  },
  {
    id: "products",
    title: "Products",
    url: "products.html",
    summary: "Full public product catalog with prices and availability badges."
  },
  {
    id: "gallery",
    title: "Gallery",
    url: "gallery.html",
    summary: "Farming process details and photo gallery."
  },
  {
    id: "about",
    title: "About",
    url: "index.html#about",
    summary: "Natural farming mission and values."
  },
  {
    id: "story",
    title: "Our Story",
    url: "index.html#story",
    summary: "Founder profiles and background."
  },
  {
    id: "contact",
    title: "Contact",
    url: "index.html#contact",
    summary: "Phone, email, WhatsApp, address, map, and contact form."
  }
];

const founders = [
  {
    id: "jayasanka-peiris",
    name: "Jayasanka Peiris",
    role: "Founder - SL Farmer",
    image: "images/owner.JPG",
    achievements: ["2+ Years Farming Experience", "Local Community Leader"],
    summary:
      "Jayasanka Peiris created SL Farmer to grow premium, naturally cultivated produce while honoring family farming traditions."
  },
  {
    id: "upul-premakumara",
    name: "Upul Premakumara",
    role: "Founder - SL Farmer",
    image: "images/Owner1.png",
    achievements: ["10+ Years Farming Experience", "Farm Operations Leader"],
    summary:
      "Upul Premakumara leads practical farm operations, crop health, and field discipline across SL Farmer."
  }
];

const products = [
  {
    id: "pineapple",
    name: "Pineapple",
    aliases: ["pineapple", "pineapples"],
    aliasesSi: ["අන්නාසි"],
    nameSi: "අන්නාසි",
    price: "Rs. 700",
    unit: "per kg",
    unitSi: "කිලෝ එකකට",
    description:
      "Sweet, juicy pineapples harvested at peak ripeness. Perfect for fresh eating, smoothies, or cooking.",
    descriptionSi:
      "පැසුණු අවස්ථාවේ අස්වැන්න ගන්නා මිහිරි සහ රසවත් අන්නාසි. නැවුම්ව කෑමට, ස්මූති සඳහා හෝ පිසීමට සුදුසුයි.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["premium", "fruit"]
  },
  {
    id: "pineapple-plant",
    name: "Pineapple Plant",
    aliases: ["pineapple plant", "pineapple plants", "pineapple sapling"],
    aliasesSi: ["අන්නාසි පැළ", "අන්නාසි පැල"],
    nameSi: "අන්නාසි පැළ",
    price: "Rs. 50",
    unit: "per plant",
    unitSi: "පැළයකට",
    description:
      "Healthy, mature pineapple plants ready for cultivation. Grow your own premium pineapples at home.",
    descriptionSi:
      "වගාවට සූදානම් සෞඛ්‍ය සම්පන්න අන්නාසි පැළ. ඔබේම ගෙදර ප්‍රිමියම් අන්නාසි වගා කිරීම ආරම්භ කළ හැක.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["plant"]
  },
  {
    id: "ginger",
    name: "Ginger",
    aliases: ["ginger", "fresh ginger"],
    aliasesSi: ["ඉඟුරු"],
    nameSi: "ඉඟුරු",
    price: "Rs. 1,000",
    unit: "per kg",
    unitSi: "කිලෝ එකකට",
    description:
      "Hearty ginger with intense aroma for cooking, herbal teas, and natural remedies.",
    descriptionSi:
      "ආහාර පිසීමට, ඖෂධීය තේ සඳහා සහ ස්වභාවික ප්‍රතිකාර සඳහා සුදුසු ශක්තිමත් සුවඳ ඇති ඉඟුරු.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["premium", "spice"]
  },
  {
    id: "ginger-plant",
    name: "Ginger Plant",
    aliases: ["ginger plant", "ginger plants", "ginger rhizome"],
    aliasesSi: ["ඉඟුරු පැළ", "ඉඟුරු පැල"],
    nameSi: "ඉඟුරු පැළ",
    price: "Rs. 900",
    unit: "per plant",
    unitSi: "පැළයකට",
    description:
      "Fresh ginger rhizomes for planting. Start your own ginger garden with our premium quality plants.",
    descriptionSi:
      "වගා කිරීම සඳහා නැවුම් ඉඟුරු කඳන්. අපගේ ප්‍රිමියම් ගුණාත්මක පැළ සමඟ ඔබේම ඉඟුරු වගාව ආරම්භ කරන්න.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["plant"]
  },
  {
    id: "cinnamon",
    name: "Cinnamon",
    aliases: ["cinnamon", "ceylon cinnamon"],
    aliasesSi: ["කුරුඳු"],
    nameSi: "කුරුඳු",
    price: "Rs. 675",
    unit: "per 100g",
    unitSi: "100g සඳහා",
    description:
      "Pure Ceylon cinnamon sticks and powder. Premium quality cinnamon with authentic flavor and aroma.",
    descriptionSi:
      "පිරිසිදු සීලෝන් කුරුඳු කූරු සහ කුරුඳු කුඩු. සත්‍ය රසය සහ සුවඳ ඇති ප්‍රිමියම් ගුණාත්මක කුරුඳු.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["premium", "spice"]
  },
  {
    id: "cinnamon-plant",
    name: "Cinnamon Plant",
    aliases: ["cinnamon plant", "cinnamon plants", "cinnamon sapling"],
    aliasesSi: ["කුරුඳු පැළ", "කුරුඳු පැල"],
    nameSi: "කුරුඳු පැළ",
    price: "Rs. 100",
    unit: "per plant",
    unitSi: "පැළයකට",
    description:
      "True Ceylon cinnamon saplings. Grow your own cinnamon tree and harvest premium quality cinnamon bark.",
    descriptionSi:
      "සත්‍ය සීලෝන් කුරුඳු පැළ. ඔබේම කුරුඳු ගස වගා කර ප්‍රිමියම් ගුණාත්මක කුරුඳු පොත්ත අස්වැන්න කරගන්න.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["plant"]
  },
  {
    id: "scotch-bonnet",
    name: "Scotch Bonnet Pepper (Nai Miris)",
    aliases: ["scotch bonnet pepper", "scotch bonnet", "nai miris", "pepper"],
    aliasesSi: ["නයි මිරිස්"],
    nameSi: "නයි මිරිස්",
    price: "Rs. 390",
    unit: "per 250g",
    unitSi: "250g සඳහා",
    description:
      "Fiery and flavorful Sri Lankan hot peppers. Perfect for adding authentic spice to your dishes.",
    descriptionSi:
      "රසවත් සහ දැඩි තික්ෂ්ණතාවය ඇති ශ්‍රී ලාංකික නයි මිරිස්. ආහාරයට සත්‍ය රසයක් එක් කිරීමට සුදුසුයි.",
    defaultAvailability: "Available",
    defaultAvailabilitySi: "ලබා ගත හැක",
    tags: ["hot", "pepper"]
  }
];

const enWrappers = [
  (question) => question,
  (question) => `${question}?`,
  (question) => `${question} please`,
  (question) => `please ${question}`,
  (question) => `hi, ${question}`,
  (question) => `hello, ${question}`,
  (question) => `please tell me, ${question}`,
  (question) => `i want to know, ${question}`,
  (question) => `i would like to know, ${question}`,
  (question) => `i need to know, ${question}`,
  (question) => `can you help me with this: ${question}`,
  (question) => `can you answer this: ${question}`,
  (question) => `from your website, ${question}`,
  (question) => `from the public website, ${question}`,
  (question) => `based on your website, ${question}`,
  (question) => `according to the website, ${question}`
];

const siWrappers = [
  (question) => question,
  (question) => `${question}?`,
  (question) => `කරුණාකර ${question}`,
  (question) => `please ${question}`,
  (question) => `මට දැනගන්න ඕන ${question}`,
  (question) => `මට දැනගන්න ඕනේ ${question}`,
  (question) => `මට දැනගන්න අවශ්‍යයි ${question}`,
  (question) => `මට දැනගන්න කැමතියි ${question}`,
  (question) => `මට කියන්න ${question}`,
  (question) => `කරුණාකර මට කියන්න ${question}`,
  (question) => `පොඩ්ඩක් කියන්න ${question}`,
  (question) => `මට පැහැදිලි කරන්න ${question}`,
  (question) => `මට උදව් කරන්න ${question}`,
  (question) => `උත්තර දෙන්න ${question}`,
  (question) => `විස්තර දෙන්න ${question}`,
  (question) => `වෙබ් අඩවිය අනුව ${question}`,
  (question) => `මේ වෙබ් අඩවියට අනුව ${question}`,
  (question) => `SL Farmer වෙබ් අඩවිය අනුව ${question}`,
  (question) => `website එක අනුව ${question}`,
  (question) => `site එක අනුව ${question}`,
  (question) => `public website එක අනුව ${question}`,
  (question) => `SL Farmer site එක අනුව ${question}`,
  (question) => `මේ website එකේ ${question}`,
  (question) => `මේ site එකේ ${question}`,
  (question) => `${question} කියන්න`,
  (question) => `${question} පැහැදිලි කරන්න`,
  (question) => `${question} please`,
  (question) => `${question} මට කියන්න`,
  (question) => `${question} මට පැහැදිලි කරන්න`,
  (question) => `${question} ගැන දැනගන්න ඕන`
];

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,])/g, "$1")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => cleanText(value)))];
}

function isSinhalaText(value) {
  return /[\u0D80-\u0DFF]/.test(String(value || ""));
}

function expandQuestions(baseQuestions) {
  const questions = [];
  baseQuestions.forEach((baseQuestion) => {
    const wrappers = isSinhalaText(baseQuestion) ? siWrappers : enWrappers;
    wrappers.forEach((wrapper) => {
      questions.push(wrapper(cleanText(baseQuestion)));
    });
  });
  return unique(questions);
}

function action(label, href, external = false) {
  return { label, href, external };
}

function makeEntry(definition) {
  const trainingBaseQuestions = unique(definition.baseQuestions || []);
  return {
    id: definition.id,
    type: definition.type,
    title: definition.title,
    answer: cleanText(definition.answer),
    keywords: unique(definition.keywords || []),
    pageBias: unique(definition.pageBias || []),
    actions: definition.actions || [],
    suggestions: unique(definition.suggestions || []),
    productId: definition.productId || "",
    founderId: definition.founderId || "",
    trainingBaseQuestions,
    sampleQuestions: expandQuestions(trainingBaseQuestions).slice(0, 8)
  };
}

const generalEntries = [
  makeEntry({
    id: "greeting",
    type: "utility",
    title: "Greeting",
    answer:
      "Hi. I can help with products, prices, availability, farm practices, founders, gallery details, contact information, and ordering on the public SL Farmer website.",
    keywords: ["hi", "hello", "hey", "greetings", "start", "help"],
    suggestions: [
      "What products do you sell?",
      "How can I place an order?",
      "How do I contact SL Farmer?",
      "Tell me about the founders"
    ],
    baseQuestions: ["hi", "hello", "hey", "good morning", "start the chat"]
  }),
  makeEntry({
    id: "help",
    type: "utility",
    title: "Help",
    answer:
      "Ask me about products, prices, stock status, natural farming, the gallery, founder stories, contact details, social links, or how to order from SL Farmer.",
    keywords: ["help", "assist", "support", "what can you do"],
    suggestions: [
      "Show all products",
      "What is the phone number?",
      "How do you farm naturally?",
      "Where is the gallery?"
    ],
    baseQuestions: [
      "what can you do",
      "how can you help me",
      "what can i ask you",
      "what do you know about this website",
      "help me use this website"
    ]
  }),
  makeEntry({
    id: "public-scope",
    type: "guardrail",
    title: "Public Website Scope",
    answer:
      "I only answer questions about the public SL Farmer website. I do not handle the admin panel, dashboard, permissions, user records, or internal management tools.",
    keywords: ["admin", "dashboard", "login", "panel", "firebase", "manager", "user role"],
    suggestions: [
      "What products do you sell?",
      "How do I contact SL Farmer?",
      "Tell me about the farm",
      "Show the products page"
    ],
    baseQuestions: [
      "can you help with the admin panel",
      "how do i use the dashboard",
      "tell me about admin login",
      "can you manage products in admin",
      "do you answer admin questions"
    ]
  }),
  makeEntry({
    id: "site-overview",
    type: "site",
    title: "Website Overview",
    answer:
      "SL Farmer is a Sri Lankan family farm website focused on naturally grown produce. The public site covers featured products, the full products page, the farm gallery, the founder story, and customer contact options.",
    keywords: ["website", "overview", "sl farmer", "about site", "what is this site"],
    pageBias: ["home"],
    actions: [action("Home", "index.html"), action("Products", "products.html"), action("Contact", "index.html#contact")],
    suggestions: [
      "What products do you sell?",
      "Tell me about SL Farmer",
      "How can I order?",
      "Where are you located?"
    ],
    baseQuestions: [
      "what is sl farmer",
      "tell me about this website",
      "give me an overview of sl farmer",
      "what is this site about",
      "what can i find on this website"
    ]
  }),
  makeEntry({
    id: "product-catalog",
    type: "catalog",
    title: "Product Catalog",
    answer: `SL Farmer publicly lists these products:\n- Pineapple: Rs. 700 per kg\n- Pineapple Plant: Rs. 50 per plant\n- Ginger: Rs. 1,000 per kg\n- Ginger Plant: Rs. 900 per plant\n- Cinnamon: Rs. 675 per 100g\n- Cinnamon Plant: Rs. 100 per plant\n- Scotch Bonnet Pepper (Nai Miris): Rs. 390 per 250g`,
    keywords: ["products", "catalog", "what do you sell", "product list", "all products"],
    pageBias: ["products", "home"],
    actions: [action("Products page", "products.html"), action("WhatsApp", contact.whatsapp, true)],
    suggestions: [
      "What is pineapple price?",
      "Is ginger available?",
      "Tell me about cinnamon",
      "How can I order?"
    ],
    baseQuestions: [
      "what products do you sell",
      "show me all products",
      "give me the product list",
      "what can i buy from sl farmer",
      "which products are on the website"
    ]
  }),
  makeEntry({
    id: "page-products",
    type: "page",
    title: "Products Page",
    answer:
      "The Products page shows the full public catalog with descriptions, prices, and availability badges for each listed item.",
    keywords: ["products page", "products", "shop page", "catalog page"],
    pageBias: ["products"],
    actions: [action("Open Products", "products.html")],
    suggestions: [
      "Show all products",
      "What is pineapple price?",
      "How do I place an order?",
      "Is cinnamon available?"
    ],
    baseQuestions: [
      "where is the products page",
      "open the products page",
      "show the products page",
      "how do i get to products",
      "what is on the products page"
    ]
  }),
  makeEntry({
    id: "page-gallery",
    type: "page",
    title: "Gallery Page",
    answer:
      "The Gallery page explains the farming process and shows SL Farmer photo collections from the farm.",
    keywords: ["gallery", "gallery page", "photos", "farm photos", "images"],
    pageBias: ["gallery"],
    actions: [action("Open Gallery", "gallery.html")],
    suggestions: [
      "What is in the gallery?",
      "How do you farm naturally?",
      "How big is the farm?",
      "Tell me about the founders"
    ],
    baseQuestions: [
      "where is the gallery page",
      "open the gallery",
      "show me farm photos",
      "what is on the gallery page",
      "how do i view the gallery"
    ]
  }),
  makeEntry({
    id: "page-about",
    type: "page",
    title: "About Section",
    answer:
      "The About section explains SL Farmer's natural farming mission and its focus on premium produce grown with care and sustainability.",
    keywords: ["about", "about section", "about sl farmer", "mission"],
    pageBias: ["home"],
    actions: [action("Open About", "index.html#about")],
    suggestions: [
      "How do you farm naturally?",
      "Tell me about SL Farmer",
      "Who founded SL Farmer?",
      "Where are you located?"
    ],
    baseQuestions: [
      "where is the about section",
      "show me the about section",
      "tell me about sl farmer",
      "what does the about section say",
      "how do i open about us"
    ]
  }),
  makeEntry({
    id: "page-story",
    type: "page",
    title: "Our Story Section",
    answer:
      "The Our Story section introduces the founders and explains the people behind SL Farmer.",
    keywords: ["story", "our story", "founders", "story section"],
    pageBias: ["home"],
    actions: [action("Open Our Story", "index.html#story")],
    suggestions: [
      "Who are the founders?",
      "Tell me about Jayasanka Peiris",
      "Tell me about Upul Premakumara",
      "Show the gallery"
    ],
    baseQuestions: [
      "where is the story section",
      "show me our story",
      "open the founder story",
      "where can i read about the founders",
      "what is in the story section"
    ]
  }),
  makeEntry({
    id: "page-contact",
    type: "page",
    title: "Contact Section",
    answer:
      "The Contact section includes the phone number, email address, location, map, WhatsApp button, and a contact form for inquiries.",
    keywords: ["contact", "contact page", "contact section", "get in touch"],
    pageBias: ["home"],
    actions: [action("Open Contact", "index.html#contact"), action("WhatsApp", contact.whatsapp, true)],
    suggestions: [
      "What is the phone number?",
      "What is the email address?",
      "Where are you located?",
      "How can I order?"
    ],
    baseQuestions: [
      "where is the contact section",
      "show me the contact page",
      "how do i contact sl farmer",
      "open contact us",
      "what is in the contact section"
    ]
  }),
  makeEntry({
    id: "order-general",
    type: "ordering",
    title: "How to Order",
    answer:
      "The public website does not show a checkout cart. To place an order, contact SL Farmer through WhatsApp, phone, email, or the contact form.",
    keywords: ["order", "buy", "purchase", "checkout", "how to order"],
    actions: [
      action("WhatsApp", contact.whatsapp, true),
      action("Contact", "index.html#contact"),
      action("Products", "products.html")
    ],
    suggestions: [
      "Show all products",
      "What is the WhatsApp number?",
      "What is the phone number?",
      "Do you have delivery details?"
    ],
    baseQuestions: [
      "how can i place an order",
      "how do i buy from sl farmer",
      "can i order from this website",
      "what is the ordering process",
      "how do i purchase your products",
      "how can i buy a product from your website",
      "how can i buy products from your website",
      "is there a checkout cart on the website",
      "can i add products to a cart",
      "can i pay online on this website",
      "do you have online ordering",
      "how do i order from the site",
      "can i purchase directly from the website"
    ]
  }),
  makeEntry({
    id: "contact-phone",
    type: "contact",
    title: "Phone Number",
    answer: `SL Farmer phone number: ${contact.phone}.`,
    keywords: ["phone", "call", "number", "telephone", "contact number"],
    actions: [action("Call Now", contact.phoneHref)],
    suggestions: [
      "What is the WhatsApp number?",
      "What is the email address?",
      "Where are you located?",
      "How can I place an order?"
    ],
    baseQuestions: [
      "what is your phone number",
      "how can i call sl farmer",
      "give me the contact number",
      "share your telephone number",
      "what number should i call"
    ]
  }),
  makeEntry({
    id: "contact-email",
    type: "contact",
    title: "Email Address",
    answer: `SL Farmer email address: ${contact.email}.`,
    keywords: ["email", "mail", "email address", "contact email"],
    actions: [action("Send Email", contact.emailHref)],
    suggestions: [
      "What is the phone number?",
      "What is the WhatsApp number?",
      "Where are you located?",
      "How can I use the contact form?"
    ],
    baseQuestions: [
      "what is your email address",
      "how can i email sl farmer",
      "share your email",
      "what email should i use",
      "give me the contact email"
    ]
  }),
  makeEntry({
    id: "contact-whatsapp",
    type: "contact",
    title: "WhatsApp Contact",
    answer:
      "You can contact SL Farmer directly on WhatsApp from the website using the chat button.",
    keywords: ["whatsapp", "chat", "message", "whatsapp number"],
    actions: [action("Open WhatsApp", contact.whatsapp, true)],
    suggestions: [
      "How can I place an order?",
      "What is the phone number?",
      "What is the email address?",
      "Where are you located?"
    ],
    baseQuestions: [
      "what is your whatsapp",
      "how do i message you on whatsapp",
      "can i chat on whatsapp",
      "share the whatsapp link",
      "what is the whatsapp number"
    ]
  }),
  makeEntry({
    id: "contact-address",
    type: "contact",
    title: "Address",
    answer: `SL Farmer address: ${contact.address}.`,
    keywords: ["address", "location", "where are you", "where is sl farmer"],
    actions: [action("Open Contact", "index.html#contact")],
    suggestions: [
      "Do you have a map?",
      "What are your business hours?",
      "What is the phone number?",
      "How can I place an order?"
    ],
    baseQuestions: [
      "where are you located",
      "what is your address",
      "where is sl farmer",
      "share your location",
      "where can i find the farm"
    ]
  }),
  makeEntry({
    id: "contact-hours",
    type: "contact",
    title: "Business Hours",
    answer: `The public website lists business hours as ${contact.businessHours}.`,
    keywords: ["hours", "opening hours", "business hours", "open", "close"],
    actions: [action("Contact", "index.html#contact")],
    suggestions: [
      "What is the phone number?",
      "Where are you located?",
      "How can I place an order?",
      "What is the WhatsApp number?"
    ],
    baseQuestions: [
      "what are your business hours",
      "when are you open",
      "what time do you open",
      "what time do you close",
      "are you open every day"
    ]
  }),
  makeEntry({
    id: "contact-form",
    type: "contact",
    title: "Contact Form",
    answer:
      "The public contact form asks for your name, email, phone number, and message, then lets you send an inquiry directly from the website.",
    keywords: ["contact form", "form", "message form", "inquiry form"],
    actions: [action("Open Contact Form", "index.html#contact")],
    suggestions: [
      "What is the email address?",
      "What is the phone number?",
      "How can I place an order?",
      "What is the WhatsApp number?"
    ],
    baseQuestions: [
      "how does the contact form work",
      "what fields are in the contact form",
      "can i send a message from the website",
      "where is the inquiry form",
      "how do i use the contact form"
    ]
  }),
  makeEntry({
    id: "delivery-info",
    type: "policy",
    title: "Delivery Details",
    answer:
      "The website says the produce is delivered fresh to your door, but detailed delivery zones, shipping fees, and timelines are not listed publicly. For exact delivery details, contact SL Farmer directly.",
    keywords: ["delivery", "shipping", "ship", "deliver", "door"],
    actions: [action("WhatsApp", contact.whatsapp, true), action("Contact", "index.html#contact")],
    suggestions: [
      "How can I place an order?",
      "What is the WhatsApp number?",
      "What products do you sell?",
      "What is the phone number?"
    ],
    baseQuestions: [
      "do you have delivery",
      "what are the shipping details",
      "do you deliver to customers",
      "how does delivery work",
      "what does the website say about shipping"
    ]
  }),
  makeEntry({
    id: "returns-info",
    type: "policy",
    title: "Returns Details",
    answer:
      "A return policy is not published on the public website. For order changes or product issues, the safest path is to contact SL Farmer directly through WhatsApp, phone, or email.",
    keywords: ["return", "refund", "exchange", "returns", "policy"],
    actions: [action("WhatsApp", contact.whatsapp, true), action("Email", contact.emailHref)],
    suggestions: [
      "How can I place an order?",
      "What is the email address?",
      "What is the phone number?",
      "Do you have delivery details?"
    ],
    baseQuestions: [
      "what is your return policy",
      "do you have refunds",
      "can i return products",
      "what does the website say about returns",
      "how do returns work"
    ]
  }),
  makeEntry({
    id: "social-facebook",
    type: "social",
    title: "Facebook",
    answer: "SL Farmer has a public Facebook profile linked from the website footer and social section.",
    keywords: ["facebook", "fb", "facebook page", "social media"],
    actions: [action("Open Facebook", contact.facebook, true)],
    suggestions: [
      "Do you have Instagram?",
      "What is your WhatsApp?",
      "How do I contact SL Farmer?",
      "Tell me about the founders"
    ],
    baseQuestions: [
      "do you have facebook",
      "where is the facebook page",
      "show me your facebook",
      "is there a facebook link",
      "how do i open facebook"
    ]
  }),
  makeEntry({
    id: "social-instagram",
    type: "social",
    title: "Instagram",
    answer: "SL Farmer has a public Instagram account linked from the website footer and social section.",
    keywords: ["instagram", "insta", "social media", "instagram page"],
    actions: [action("Open Instagram", contact.instagram, true)],
    suggestions: [
      "Do you have Facebook?",
      "What is your WhatsApp?",
      "Show me the gallery",
      "Tell me about the farm"
    ],
    baseQuestions: [
      "do you have instagram",
      "where is the instagram page",
      "show me your instagram",
      "is there an instagram link",
      "how do i open instagram"
    ]
  }),
  makeEntry({
    id: "farm-natural",
    type: "farm",
    title: "Natural Farming",
    answer:
      "SL Farmer presents itself as 100% natural, highlights 0 chemicals, and emphasizes fresh daily harvests on the public website.",
    keywords: ["natural", "chemical free", "chemicals", "organic", "fresh"],
    pageBias: ["home", "gallery"],
    actions: [action("About SL Farmer", "index.html#about"), action("View Gallery", "gallery.html")],
    suggestions: [
      "How do you farm naturally?",
      "How big is the farm?",
      "Tell me about SL Farmer",
      "Show the gallery"
    ],
    baseQuestions: [
      "are your products natural",
      "do you use chemicals",
      "is sl farmer chemical free",
      "what does the website say about natural farming",
      "are you a natural farm"
    ]
  }),
  makeEntry({
    id: "farm-practices",
    type: "farm",
    title: "Farming Practices",
    answer:
      "The public site highlights soil enriched with composted pineapple crowns, rainwater harvesting with precision watering, and shade management that keeps crops cool and sweet.",
    keywords: ["farming methods", "farming practices", "how do you farm", "compost", "rainwater", "shade"],
    pageBias: ["gallery", "home"],
    actions: [action("Open Gallery", "gallery.html"), action("About SL Farmer", "index.html#about")],
    suggestions: [
      "How big is the farm?",
      "Are your products natural?",
      "Show the gallery",
      "Tell me about SL Farmer"
    ],
    baseQuestions: [
      "how do you farm",
      "what farming practices do you use",
      "what does the website say about compost and watering",
      "tell me about your farming methods",
      "how do you grow the crops"
    ]
  }),
  makeEntry({
    id: "farm-size",
    type: "farm",
    title: "Farm Size",
    answer:
      "The public gallery information describes SL Farmer as showing photos from 25+ acres of naturally grown produce.",
    keywords: ["farm size", "acres", "how big", "25 acres", "land size"],
    pageBias: ["gallery"],
    actions: [action("Open Gallery", "gallery.html")],
    suggestions: [
      "How do you farm naturally?",
      "What is in the gallery?",
      "Tell me about the founders",
      "Where are you located?"
    ],
    baseQuestions: [
      "how big is the farm",
      "how many acres do you have",
      "what is the farm size",
      "does the website mention acres",
      "how large is sl farmer"
    ]
  }),
  makeEntry({
    id: "gallery-overview",
    type: "gallery",
    title: "Gallery Overview",
    answer:
      "The Gallery page contains farm photos and a slideshow featuring organic growth, harvest time, quality check, farm life, and sustainable practices.",
    keywords: ["gallery", "photos", "farm photos", "images", "slideshow"],
    pageBias: ["gallery"],
    actions: [action("Open Gallery", "gallery.html")],
    suggestions: [
      "How do you farm naturally?",
      "How big is the farm?",
      "Tell me about the founders",
      "Where are you located?"
    ],
    baseQuestions: [
      "what is in the gallery",
      "what photos are on the website",
      "tell me about the gallery",
      "what can i see in the gallery",
      "does the site have farm photos"
    ]
  }),
  makeEntry({
    id: "founders-overview",
    type: "founder",
    title: "Founders Overview",
    answer:
      "The public website presents two founders: Jayasanka Peiris and Upul Premakumara.",
    keywords: ["founders", "founder", "who started sl farmer", "our story"],
    pageBias: ["home"],
    actions: [action("Open Our Story", "index.html#story")],
    suggestions: [
      "Tell me about Jayasanka Peiris",
      "Tell me about Upul Premakumara",
      "Tell me about SL Farmer",
      "Where is the story section?"
    ],
    baseQuestions: [
      "who are the founders",
      "who started sl farmer",
      "tell me about the founders",
      "who is behind sl farmer",
      "who founded the farm"
    ]
  }),
  makeEntry({
    id: "founder-jayasanka",
    type: "founder",
    title: "Jayasanka Peiris",
    founderId: "jayasanka-peiris",
    answer:
      "Jayasanka Peiris is presented as a founder of SL Farmer. The website describes him as building the farm around naturally cultivated produce, family farming traditions, and sustainable agriculture.",
    keywords: ["jayasanka", "jayasanka peiris", "founder jayasanka"],
    pageBias: ["home"],
    actions: [action("Open Our Story", "index.html#story")],
    suggestions: [
      "Tell me about Upul Premakumara",
      "Who are the founders?",
      "Tell me about SL Farmer",
      "How do you farm naturally?"
    ],
    baseQuestions: [
      "who is jayasanka peiris",
      "tell me about jayasanka peiris",
      "what does jayasanka do",
      "share the founder story for jayasanka",
      "what does the website say about jayasanka"
    ]
  }),
  makeEntry({
    id: "founder-upul",
    type: "founder",
    title: "Upul Premakumara",
    founderId: "upul-premakumara",
    answer:
      "Upul Premakumara is presented as a founder of SL Farmer. The website describes him as a hands-on farm leader focused on crop health, field discipline, and practical farm operations.",
    keywords: ["upul", "upul premakumara", "founder upul"],
    pageBias: ["home"],
    actions: [action("Open Our Story", "index.html#story")],
    suggestions: [
      "Tell me about Jayasanka Peiris",
      "Who are the founders?",
      "How do you farm naturally?",
      "Show the gallery"
    ],
    baseQuestions: [
      "who is upul premakumara",
      "tell me about upul premakumara",
      "what does upul do",
      "share the founder story for upul",
      "what does the website say about upul"
    ]
  }),
  makeEntry({
    id: "website-developer",
    type: "site",
    title: "Website Developer",
    answer:
      "The public website footer credits Adith Janupa as the website developer and includes LinkedIn, email, and WhatsApp links in the developer credit area.",
    keywords: ["developer", "who built the website", "website developer", "adith janupa"],
    actions: [action("Home", "index.html")],
    suggestions: [
      "Tell me about SL Farmer",
      "Who are the founders?",
      "How do I contact SL Farmer?",
      "Show the products page"
    ],
    baseQuestions: [
      "who built the website",
      "who is the website developer",
      "who made this site",
      "tell me about the developer credit",
      "who is adith janupa"
    ]
  })
];

function buildProductEntries(product) {
  const overviewBaseQuestions = [];
  const priceBaseQuestions = [];
  const availabilityBaseQuestions = [];
  const orderBaseQuestions = [];

  product.aliases.forEach((alias) => {
    overviewBaseQuestions.push(
      `tell me about ${alias}`,
      `what is ${alias}`,
      `give me details about ${alias}`,
      `what can you tell me about ${alias}`,
      `give me information about ${alias}`,
      `show me information about ${alias}`
    );
    priceBaseQuestions.push(
      `what is the price of ${alias}`,
      `how much is ${alias}`,
      `what does ${alias} cost`,
      `what is the cost of ${alias}`,
      `price for ${alias}`
    );
    availabilityBaseQuestions.push(
      `is ${alias} available`,
      `what is the availability of ${alias}`,
      `is ${alias} in stock`,
      `do you have ${alias}`,
      `can i get ${alias} now`
    );
    orderBaseQuestions.push(
      `how do i order ${alias}`,
      `can i buy ${alias} from the website`,
      `how can i buy ${alias}`,
      `how can i purchase ${alias}`,
      `can i order ${alias} online`,
      `can i purchase ${alias} online`,
      `how do i get ${alias}`,
      `can i order ${alias} from your website`
    );
  });

  return [
    makeEntry({
      id: `product-${product.id}-overview`,
      type: "product-overview",
      title: `${product.name} Details`,
      productId: product.id,
      answer: `${product.name}: ${product.description} It is listed at ${product.price} ${product.unit}.`,
      keywords: [...product.aliases, product.name, ...product.tags, "details", "information"],
      pageBias: ["products", "home"],
      actions: [action("Products page", "products.html"), action("WhatsApp", contact.whatsapp, true)],
      suggestions: [
        `What is ${product.name} price?`,
        `Is ${product.name} available?`,
        `How can I order ${product.name}?`,
        "Show all products"
      ],
      baseQuestions: overviewBaseQuestions
    }),
    makeEntry({
      id: `product-${product.id}-price`,
      type: "product-price",
      title: `${product.name} Price`,
      productId: product.id,
      answer: `${product.name} is listed at ${product.price} ${product.unit} on the public Products page.`,
      keywords: [...product.aliases, "price", "cost", "how much", "rate"],
      pageBias: ["products", "home"],
      actions: [action("Products page", "products.html"), action("WhatsApp", contact.whatsapp, true)],
      suggestions: [
        `Tell me about ${product.name}`,
        `Is ${product.name} available?`,
        `How can I order ${product.name}?`,
        "Show all products"
      ],
      baseQuestions: priceBaseQuestions
    }),
    makeEntry({
      id: `product-${product.id}-availability`,
      type: "product-availability",
      productId: product.id,
      title: `${product.name} Availability`,
      answer: `${product.name} is shown as ${product.defaultAvailability} in the public product data, and the Products page displays the latest availability badge.`,
      keywords: [...product.aliases, "availability", "available", "stock", "in stock"],
      pageBias: ["products"],
      actions: [action("Products page", "products.html"), action("WhatsApp", contact.whatsapp, true)],
      suggestions: [
        `What is ${product.name} price?`,
        `How can I order ${product.name}?`,
        "Show all products",
        "What is the WhatsApp number?"
      ],
      baseQuestions: availabilityBaseQuestions
    }),
    makeEntry({
      id: `product-${product.id}-order`,
      type: "product-order",
      productId: product.id,
      title: `Order ${product.name}`,
      answer: `To order ${product.name}, contact SL Farmer through WhatsApp, phone, email, or the contact form. The public website does not show a checkout cart.`,
      keywords: [...product.aliases, "order", "buy", "purchase", "checkout"],
      pageBias: ["products", "home"],
      actions: [
        action("WhatsApp", contact.whatsapp, true),
        action("Contact", "index.html#contact"),
        action("Products page", "products.html")
      ],
      suggestions: [
        `What is ${product.name} price?`,
        `Is ${product.name} available?`,
        "What is the phone number?",
        "What is the WhatsApp number?"
      ],
      baseQuestions: orderBaseQuestions
    })
  ];
}

function findProductById(productId) {
  return products.find((product) => product.id === productId) || null;
}

function translateSuggestionToSinhala(suggestion) {
  const exactMap = new Map([
    ["Show all products", "සියලු නිෂ්පාදන පෙන්වන්න"],
    ["What is the WhatsApp number?", "WhatsApp අංකය මොකක්ද?"],
    ["What is the phone number?", "දුරකථන අංකය මොකක්ද?"],
    ["What is the email address?", "ඊමේල් ලිපිනය මොකක්ද?"],
    ["Do you have delivery details?", "ඩිලිවරි විස්තර තියෙනවද?"],
    ["Tell me about SL Farmer", "SL Farmer ගැන කියන්න"],
    ["How can I place an order?", "ඇණවුමක් දාන්නේ කොහොමද?"],
    ["How can I order?", "ඇණවුම් කරන්නේ කොහොමද?"],
    ["How can I contact SL Farmer?", "SL Farmer එක්ක සම්බන්ධ වන්නේ කොහොමද?"],
    ["Where are you located?", "ඔබලා සිටින්නේ කොහේද?"],
    ["What products do you sell?", "ඔබලා විකුණන නිෂ්පාදන මොනවද?"],
    ["How do you farm naturally?", "ඔබලා ස්වභාවිකව වගා කරන්නේ කොහොමද?"],
    ["How big is the farm?", "ගොවිපල කොච්චර විශාලද?"],
    ["Who are the founders?", "ආරම්භකයෝ කවුද?"],
    ["What is in the gallery?", "ගැලරියේ මොනවද තියෙන්නේ?"],
    ["Show the gallery", "ගැලරිය පෙන්වන්න"],
    ["Show me the gallery", "ගැලරිය පෙන්වන්න"],
    ["Show the products page", "නිෂ්පාදන පිටුව පෙන්වන්න"],
    ["Show the products", "නිෂ්පාදන පෙන්වන්න"],
    ["What is the email address?", "ඊමේල් ලිපිනය මොකක්ද?"],
    ["What is the phone number?", "දුරකථන අංකය මොකක්ද?"]
  ]);

  if (exactMap.has(suggestion)) {
    return exactMap.get(suggestion);
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

function buildSinhalaSuggestions(suggestions) {
  return unique((suggestions || []).map(translateSuggestionToSinhala));
}

function getSinhalaQuestionsForEntry(entry) {
  const product = findProductById(entry.productId);

  if (product && entry.type === "product-overview") {
    return unique(
      (product.aliasesSi || []).flatMap((alias) => [
        `${alias} ගැන කියන්න`,
        `${alias} ගැන විස්තර දෙන්න`,
        `${alias} මොකක්ද`
      ])
    );
  }

  if (product && entry.type === "product-price") {
    return unique(
      (product.aliasesSi || []).flatMap((alias) => [
        `${alias} මිල කීයද`,
        `${alias} ගාන කීයද`,
        `${alias} price එක කීයද`
      ])
    );
  }

  if (product && entry.type === "product-availability") {
    return unique(
      (product.aliasesSi || []).flatMap((alias) => [
        `${alias} තියෙනවද`,
        `${alias} ලබා ගන්න පුළුවන්ද`,
        `${alias} available ද`
      ])
    );
  }

  if (product && entry.type === "product-order") {
    return unique(
      (product.aliasesSi || []).flatMap((alias) => [
        `${alias} ඇණවුම් කරන්නේ කොහොමද`,
        `${alias} ගන්න කොහොමද`,
        `${alias} website එකෙන් ගන්න පුළුවන්ද`
      ])
    );
  }

  const entryQuestions = {
    greeting: ["ආයුබෝවන්", "හෙලෝ", "හායි", "චැට් එක ආරම්භ කරන්න"],
    help: ["ඔයාට මොනවා කරන්න පුළුවන්ද", "මොන ප්‍රශ්න අහන්න පුළුවන්ද", "මේ වෙබ් අඩවිය ගැන මොනව දන්නවද"],
    "public-scope": ["admin panel ගැන උදව් කරනවද", "dashboard ගැන කියනවද", "admin questions වලට පිළිතුරු දෙනවද"],
    "site-overview": ["SL Farmer මොකක්ද", "මේ වෙබ් අඩවිය ගැන කියන්න", "මේ site එකේ මොනවද තියෙන්නේ"],
    "product-catalog": ["ඔබලා විකුණන නිෂ්පාදන මොනවද", "සියලු නිෂ්පාදන පෙන්වන්න", "නිෂ්පාදන ලැයිස්තුව දෙන්න"],
    "page-products": ["products page එක කොහෙද", "නිෂ්පාදන පිටුව පෙන්වන්න", "products page එකේ මොනවද තියෙන්නේ"],
    "page-gallery": ["gallery page එක කොහෙද", "ගැලරිය පෙන්වන්න", "ගොවිපල ෆොටෝ පෙන්වන්න"],
    "page-about": ["about section එක කොහෙද", "SL Farmer ගැන කියන්න", "about us open කරන්න"],
    "page-story": ["our story එක කොහෙද", "founder story එක පෙන්වන්න", "ආරම්භකයන් ගැන කියන්න"],
    "page-contact": ["contact section එක කොහෙද", "සම්බන්ධ වෙන්න කොහොමද", "contact page එක පෙන්වන්න"],
    "order-general": ["ඇණවුමක් දාන්නේ කොහොමද", "website එකෙන් ගන්න පුළුවන්ද", "online order කරන්න පුළුවන්ද"],
    "contact-phone": ["දුරකථන අංකය මොකක්ද", "SL Farmer ට call කරන්න අංකය දෙන්න", "phone number එක දෙන්න"],
    "contact-email": ["ඊමේල් ලිපිනය මොකක්ද", "email එක මොකක්ද", "contact email එක දෙන්න"],
    "contact-whatsapp": ["WhatsApp එක මොකක්ද", "WhatsApp link එක දෙන්න", "WhatsApp එකෙන් message කරන්න පුළුවන්ද"],
    "contact-address": ["ලිපිනය මොකක්ද", "ඔබලා කොහේද", "location එක දෙන්න"],
    "contact-hours": ["business hours මොනවද", "ඔබලා open වෙන්නේ කීයටද", "හැමදාම open ද"],
    "contact-form": ["contact form එක කොහොමද වැඩ කරන්නේ", "website එකෙන් message යවන්න පුළුවන්ද", "form එකේ fields මොනවද"],
    "delivery-info": ["delivery තියෙනවද", "shipping details මොනවද", "ඩිලිවරි කොහොමද"],
    "returns-info": ["return policy එක මොකක්ද", "refund තියෙනවද", "product ආපසු දෙන්න පුළුවන්ද"],
    "social-facebook": ["facebook තියෙනවද", "facebook page එක පෙන්වන්න", "facebook link එක දෙන්න"],
    "social-instagram": ["instagram තියෙනවද", "instagram page එක පෙන්වන්න", "instagram link එක දෙන්න"],
    "farm-natural": ["නිෂ්පාදන ස්වභාවිකද", "chemical free ද", "natural farming කරනවද"],
    "farm-practices": ["වගා කරන විදිහ මොකක්ද", "farming methods මොනවද", "natural farming කරන්නේ කොහොමද"],
    "farm-size": ["ගොවිපල කොච්චර විශාලද", "acres කීයක් තියෙනවද", "farm size එක මොකක්ද"],
    "gallery-overview": ["gallery එකේ මොනවද තියෙන්නේ", "gallery එක මොනවා පෙන්නනවාද", "farm photos තියෙනවද"],
    "founders-overview": ["ආරම්භකයෝ කවුද", "founders ගැන කියන්න", "SL Farmer ආරම්භ කළේ කවුද"],
    "founder-jayasanka": ["ජයසංක පීරිස් කවුද", "ජයසංක ගැන කියන්න", "ජයසංක මොනව කරනවද"],
    "founder-upul": ["උපුල් ප්‍රේමකුමාර කවුද", "උපුල් ගැන කියන්න", "උපුල් මොනව කරනවද"],
    "website-developer": ["website developer කවුද", "මේ site එක හැදුවේ කවුද", "Adith Janupa කවුද"]
  };

  return entryQuestions[entry.id] || [];
}

function getSinhalaKeywordsForEntry(entry) {
  const product = findProductById(entry.productId);
  if (product) {
    return unique([...(product.aliasesSi || []), product.nameSi || "", product.defaultAvailabilitySi || ""]);
  }

  const keywordMap = {
    greeting: ["ආයුබෝවන්", "හෙලෝ", "හායි"],
    help: ["උදව්", "ප්‍රශ්න", "දන්නවා"],
    "public-scope": ["admin", "dashboard", "පරිපාලන"],
    "site-overview": ["වෙබ් අඩවිය", "site", "SL Farmer"],
    "product-catalog": ["නිෂ්පාදන", "ලැයිස්තුව", "විකුණනවා"],
    "page-products": ["products page", "නිෂ්පාදන පිටුව"],
    "page-gallery": ["gallery", "ගැලරිය", "ෆොටෝ"],
    "page-about": ["about", "අප ගැන"],
    "page-story": ["our story", "founders", "ආරම්භකයන්"],
    "page-contact": ["contact", "සම්බන්ධ", "ලිපිනය"],
    "order-general": ["ඇණවුම්", "online order", "checkout"],
    "contact-phone": ["දුරකථන", "phone", "අංකය"],
    "contact-email": ["ඊමේල්", "email"],
    "contact-whatsapp": ["වට්ස්ඇප්", "whatsapp"],
    "contact-address": ["ලිපිනය", "location", "කොහේද"],
    "contact-hours": ["hours", "open", "close"],
    "contact-form": ["form", "message", "contact form"],
    "delivery-info": ["ඩිලිවරි", "shipping", "delivery"],
    "returns-info": ["return", "refund", "exchange"],
    "social-facebook": ["facebook"],
    "social-instagram": ["instagram"],
    "farm-natural": ["ස්වභාවික", "chemical free", "natural"],
    "farm-practices": ["වගා", "farming", "methods"],
    "farm-size": ["ගොවිපල", "acres", "size"],
    "gallery-overview": ["ගැලරිය", "photos", "ෆොටෝ"],
    "founders-overview": ["ආරම්භකයෝ", "founders"],
    "founder-jayasanka": ["ජයසංක", "Jayasanka"],
    "founder-upul": ["උපුල්", "Upul"],
    "website-developer": ["developer", "හැදුවේ කවුද", "Adith Janupa"]
  };

  return keywordMap[entry.id] || [];
}

function getSinhalaAnswer(entry) {
  const product = findProductById(entry.productId);

  if (product && entry.type === "product-overview") {
    return `${product.nameSi}: ${product.descriptionSi} මෙය ${product.price} ${product.unitSi} ලෙස දක්වා ඇත.`;
  }

  if (product && entry.type === "product-price") {
    return `${product.nameSi} සඳහා පොදු නිෂ්පාදන පිටුවේ දක්වා ඇති මිල ${product.price} ${product.unitSi}.`;
  }

  if (product && entry.type === "product-availability") {
    return `${product.nameSi} සඳහා පොදු නිෂ්පාදන දත්තයේ තත්ත්වය ${product.defaultAvailabilitySi} ලෙස දක්වා ඇති අතර, නිෂ්පාදන පිටුවේ නවතම availability badge එක පෙන්වයි.`;
  }

  if (product && entry.type === "product-order") {
    return `${product.nameSi} ඇණවුම් කිරීමට WhatsApp, දුරකථනය, ඊමේල් හෝ contact form එක භාවිතා කර SL Farmer සමඟ සම්බන්ධ වන්න. පොදු වෙබ් අඩවියේ cart checkout එකක් නොමැත.`;
  }

  const answers = {
    greeting:
      "ආයුබෝවන්. මට SL Farmer පොදු වෙබ් අඩවියේ නිෂ්පාදන, මිල, availability, වගා ක්‍රම, founders, gallery, සම්බන්ධතා විස්තර සහ ordering ගැන උදව් කළ හැක.",
    help:
      "ඔබට නිෂ්පාදන, මිල, stock තත්ත්වය, ස්වභාවික වගාව, gallery, founder stories, contact details, social links සහ order කරන විදිහ ගැන අහන්න පුළුවන්.",
    "public-scope":
      "මම පිළිතුරු දෙන්නේ SL Farmer පොදු වෙබ් අඩවිය ගැන පමණි. admin panel, dashboard, permissions, user records හෝ internal management tools ගැන මම පිළිතුරු නොදෙමි.",
    "site-overview":
      "SL Farmer කියන්නේ ස්වභාවිකව වගා කරන නිෂ්පාදන සඳහා වූ ශ්‍රී ලාංකික පවුල් ගොවිපල වෙබ් අඩවියකි. පොදු වෙබ් අඩවියේ featured products, full products page, farm gallery, founder story සහ customer contact options ඇතුළත් වේ.",
    "product-catalog":
      `SL Farmer පොදු ලෙස දක්වන නිෂ්පාදන මෙන්න:\n- ${products[0].nameSi}: ${products[0].price} ${products[0].unitSi}\n- ${products[1].nameSi}: ${products[1].price} ${products[1].unitSi}\n- ${products[2].nameSi}: ${products[2].price} ${products[2].unitSi}\n- ${products[3].nameSi}: ${products[3].price} ${products[3].unitSi}\n- ${products[4].nameSi}: ${products[4].price} ${products[4].unitSi}\n- ${products[5].nameSi}: ${products[5].price} ${products[5].unitSi}\n- ${products[6].nameSi}: ${products[6].price} ${products[6].unitSi}`,
    "page-products":
      "Products page එකේ description, price සහ availability badge සමඟ පොදු catalog එක සම්පූර්ණයෙන් පෙන්වයි.",
    "page-gallery":
      "Gallery page එකේ වගා ක්‍රියාවලිය පැහැදිලි කර SL Farmer ගොවිපලේ photo collections පෙන්වයි.",
    "page-about":
      "About section එකේ SL Farmerගේ ස්වභාවික වගා mission එක සහ care සහ sustainability සමඟ premium produce වගා කිරීමේ අරමුණ පැහැදිලි කරයි.",
    "page-story":
      "Our Story section එකේ founders පෙන්වා SL Farmer පිටුපස සිටින අය ගැන කියයි.",
    "page-contact":
      "Contact section එකේ phone number, email address, location, map, WhatsApp button සහ inquiries සඳහා contact form එක ඇතුළත් වේ.",
    "order-general":
      "පොදු වෙබ් අඩවියේ checkout cart එකක් නොපෙන්වයි. ඇණවුමක් දාන්න WhatsApp, දුරකථනය, ඊමේල් හෝ contact form එක භාවිතා කර SL Farmer සමඟ සම්බන්ධ වන්න.",
    "contact-phone": `SL Farmer දුරකථන අංකය: ${contact.phone}.`,
    "contact-email": `SL Farmer ඊමේල් ලිපිනය: ${contact.email}.`,
    "contact-whatsapp":
      "වෙබ් අඩවියේ WhatsApp chat button එක භාවිතා කර SL Farmer සමඟ සෘජුවම WhatsApp හරහා සම්බන්ධ විය හැක.",
    "contact-address": `SL Farmer ලිපිනය: ${contact.address}.`,
    "contact-hours": `පොදු වෙබ් අඩවියේ business hours ලෙස ${contact.businessHours} දක්වා ඇත.`,
    "contact-form":
      "පොදු contact form එකේ නම, ඊමේල්, දුරකථන අංකය සහ message එක ඇතුළත් කර website එකෙන් inquiry එකක් යැවිය හැක.",
    "delivery-info":
      "වෙබ් අඩවියෙන් produce fresh to your door ලෙස කියන අතර, exact delivery zones, shipping fees සහ timelines පොදු ලෙස දක්වා නැත. නිවැරදි delivery details සඳහා SL Farmer සමඟ සෘජුවම සම්බන්ධ වන්න.",
    "returns-info":
      "පොදු වෙබ් අඩවියේ return policy එකක් දක්වා නැත. order changes හෝ product issues සඳහා WhatsApp, දුරකථනය හෝ ඊමේල් මඟින් SL Farmer සමඟ සම්බන්ධ වීම හොඳම ක්‍රමයයි.",
    "social-facebook":
      "වෙබ් අඩවියේ footer සහ social section එකෙන් SL Farmerගේ public Facebook profile එකට link එකක් ඇත.",
    "social-instagram":
      "වෙබ් අඩවියේ footer සහ social section එකෙන් SL Farmerගේ public Instagram account එකට link එකක් ඇත.",
    "farm-natural":
      "SL Farmer පොදු වෙබ් අඩවියේ 100% natural ලෙසත් 0 chemicals ලෙසත් fresh daily harvests ලෙසත් තමන්ව හඳුන්වයි.",
    "farm-practices":
      "Gallery සහ About sections වලින් SL Farmer ස්වභාවික වගා ක්‍රම, sustainability සහ chemical-free produce ගැන අවධානය යොමු කරන බව පෙන්වයි.",
    "farm-size":
      "Home page එකේ cultivated acreage ලෙස 25+ acres දක්වා ඇත.",
    "gallery-overview":
      "Gallery page එකේ farming process, natural cultivation visuals සහ farm photo collections ඇත.",
    "founders-overview":
      "වෙබ් අඩවිය SL Farmer founders ලෙස Jayasanka Peiris සහ Upul Premakumara හඳුන්වයි.",
    "founder-jayasanka":
      "Jayasanka Peiris SL Farmerගේ founder ලෙස හඳුන්වයි. වෙබ් අඩවිය අනුව ඔහු premium, naturally cultivated produce වගා කිරීම සඳහා පවුල් ගොවි සම්ප්‍රදාය රැකගෙන SL Farmer ආරම්භ කළා.",
    "founder-upul":
      "Upul Premakumara SL Farmer founder කෙනෙකු ලෙස පෙන්වයි. වෙබ් අඩවිය අනුව ඔහු crop health, field discipline සහ practical farm operations වලට මුල්තැන දෙන hands-on farm leader කෙනෙකි.",
    "website-developer":
      "පොදු වෙබ් අඩවියේ footer එකේ Adith Janupa වෙබ් අඩවියේ developer ලෙස සඳහන් කර LinkedIn, email සහ WhatsApp links ද ඇතුළත් කර ඇත."
  };

  return answers[entry.id] || "";
}

function applySinhalaLocalization(entry) {
  const trainingBaseQuestions = unique([...entry.trainingBaseQuestions, ...getSinhalaQuestionsForEntry(entry)]);
  return {
    ...entry,
    answerSi: getSinhalaAnswer(entry),
    suggestionsSi: buildSinhalaSuggestions(entry.suggestions || []),
    keywords: unique([...entry.keywords, ...getSinhalaKeywordsForEntry(entry)]),
    trainingBaseQuestions,
    sampleQuestions: expandQuestions(trainingBaseQuestions).slice(0, 8)
  };
}

const productEntries = products.flatMap(buildProductEntries);
const entries = [...generalEntries, ...productEntries].map(applySinhalaLocalization);

const trainingExamples = entries.flatMap((entry) =>
  expandQuestions(entry.trainingBaseQuestions.length ? entry.trainingBaseQuestions : [entry.title]).map((question) => ({
    entryId: entry.id,
    question,
    language: isSinhalaText(question) ? "si" : "en"
  }))
);

const englishQuestionCount = trainingExamples.filter((example) => example.language === "en").length;
const sinhalaQuestionCount = trainingExamples.filter((example) => example.language === "si").length;

const serializedEntries = entries.map(({ trainingBaseQuestions, ...entry }) => entry);

const knowledge = {
  meta: {
    version: "20260308-3",
    assistantName: brand.assistantName,
    scope: brand.scope,
    generatedAt: new Date().toISOString(),
    entryCount: entries.length,
    questionVariationCount: trainingExamples.length,
    englishQuestionVariationCount: englishQuestionCount,
    sinhalaQuestionVariationCount: sinhalaQuestionCount
  },
  brand,
  pages,
  contact,
  founders,
  products,
  entries: serializedEntries,
  trainingExamples
};

if (knowledge.meta.questionVariationCount < 10000) {
  throw new Error(
    `Expected at least 10000 combined training questions, got ${knowledge.meta.questionVariationCount}.`
  );
}

if (englishQuestionCount < 5000) {
  throw new Error(`Expected at least 5000 English training questions, got ${englishQuestionCount}.`);
}

if (sinhalaQuestionCount < 5000) {
  throw new Error(`Expected at least 5000 Sinhala training questions, got ${sinhalaQuestionCount}.`);
}

mkdirSync(dataDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(knowledge, null, 2)}\n`, "utf8");

console.log(
  `Generated ${path.relative(rootDir, outputPath)} with ${knowledge.meta.entryCount} entries and ${knowledge.meta.questionVariationCount} training questions.`
);
