let trackingEnabled = false;
let startTime = null;
let maxScrollDepth = 0;

function startTracking() {
  startTime = Date.now();

  window.addEventListener("beforeunload", trackTime);

  window.addEventListener("scroll", trackScroll);

  document.addEventListener("click", trackClick);

  document.addEventListener("DOMContentLoaded", detectTechnologies);

  console.log("Tracking started on:", window.location.hostname);
}

function stopTracking() {
  window.removeEventListener("beforeunload", trackTime);
  window.removeEventListener("scroll", trackScroll);
  document.removeEventListener("click", trackClick);
  document.removeEventListener("DOMContentLoaded", detectTechnologies);

  if (startTime) {
    const timeSpent = (Date.now() - startTime) / 1000;
    chrome.runtime.sendMessage({ action: "trackTime", timeSpent });
    startTime = null;
    console.log("Tracking stopped on:", window.location.hostname);
  }
}

function trackTime() {
  if (startTime) {
    const timeSpent = (Date.now() - startTime) / 1000;
    chrome.runtime.sendMessage({ action: "trackTime", timeSpent });
    startTime = null;
    console.log(`Time spent: ${timeSpent}s`);
  }
}

function trackScroll() {
  const scrollDepth = window.scrollY + window.innerHeight;
  const documentHeight = document.body.scrollHeight;

  if (scrollDepth >= documentHeight) {
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

chrome.storage.local.get("trackingEnabled", (data) => {
  trackingEnabled = data.trackingEnabled;
  if (trackingEnabled) {
    startTracking();
  }
});
