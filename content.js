// content.js

let trackingEnabled = false;
let startTime = null;
let maxScrollDepth = 0;

// Function to start tracking
function startTracking() {
  startTime = Date.now();

  // Track time spent on the page
  window.addEventListener("beforeunload", trackTime);

  // Track scroll depth on the page
  window.addEventListener("scroll", trackScroll);

  // Track clicks on the page
  document.addEventListener("click", trackClick);

  // Detect technologies on page load
  document.addEventListener("DOMContentLoaded", detectTechnologies);

  console.log("Tracking started on:", window.location.hostname);
}

// Function to stop tracking
function stopTracking() {
  window.removeEventListener("beforeunload", trackTime);
  window.removeEventListener("scroll", trackScroll);
  document.removeEventListener("click", trackClick);
  document.removeEventListener("DOMContentLoaded", detectTechnologies);

  // If tracking is stopped, send the timeSpent up to now
  if (startTime) {
    const timeSpent = (Date.now() - startTime) / 1000; // seconds
    chrome.runtime.sendMessage({ action: "trackTime", timeSpent });
    startTime = null;
    console.log("Tracking stopped on:", window.location.hostname);
  }
}

// Tracking functions
function trackTime() {
  if (startTime) {
    const timeSpent = (Date.now() - startTime) / 1000; // Time in seconds
    chrome.runtime.sendMessage({ action: "trackTime", timeSpent });
    startTime = null;
    console.log(`Time spent: ${timeSpent}s`);
  }
}

function trackScroll() {
  const scrollDepth = window.scrollY + window.innerHeight;
  const documentHeight = document.body.scrollHeight;

  if (scrollDepth >= documentHeight) {
    // Reached the bottom of the page
    chrome.runtime.sendMessage({ action: "trackScroll", scrollDepth });
    console.log(`Reached bottom of the page. Scroll depth: ${scrollDepth}px`);
  }

  if (scrollDepth > maxScrollDepth) {
    maxScrollDepth = scrollDepth;
    chrome.runtime.sendMessage({
      action: "trackScroll",
      scrollDepth: maxScrollDepth,
    });
    console.log(`Updated scroll depth: ${maxScrollDepth}px`);
  }
}

function trackClick() {
  chrome.runtime.sendMessage({ action: "trackClick" });
  console.log("Click tracked.");
}

function detectTechnologies() {
  const pageContent = document.body ? document.body.innerText : "";
  const knownTechnologies = ["JavaScript", "React", "Python", "Node.js"];
  const detectedSkills = {};

  knownTechnologies.forEach((tech) => {
    const regex = new RegExp(`\\b${tech}\\b`, "i");
    const matches = pageContent.match(regex);
    if (matches) {
      detectedSkills[tech] = (detectedSkills[tech] || 0) + 1;
    }
  });

  console.log("Detected skills:", detectedSkills);
  chrome.runtime.sendMessage({
    action: "detectedSkills",
    skills: detectedSkills,
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "trackingEnabled" in changes) {
    trackingEnabled = changes.trackingEnabled.newValue;
    if (trackingEnabled) {
      startTracking();
    } else {
      stopTracking();
    }
  }
});

// Initialize tracking based on current setting
chrome.storage.local.get("trackingEnabled", (data) => {
  trackingEnabled = data.trackingEnabled;
  if (trackingEnabled) {
    startTracking();
  }
});
