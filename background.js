chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    skills: [],
    activity: {},
    trackingEnabled: false,
    userProfile: {},
  });
  console.log("Tech Skills Tracker installed.");
});

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    const url = new URL(details.url).hostname;
    chrome.storage.local.get(["activity"], (result) => {
      const activity = result.activity || {};
      if (!activity[url]) {
        activity[url] = {
          visits: 0,
          timeSpent: 0,
          scrollDepth: 0,
          clicks: 0,
        };
      }
      activity[url].visits += 1;
      chrome.storage.local.set({ activity }, () => {
        console.log(`Visited ${url}, total visits: ${activity[url].visits}`);
      });
    });
  },
  { url: [{ hostContains: "" }] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab || !sender.tab.url) {
    console.error("Sender tab or URL is undefined");
    return;
  }
  const url = new URL(sender.tab.url).hostname;

  if (message.action === "trackTime") {
    chrome.storage.local.get(["activity"], (result) => {
      const activity = result.activity || {};
      if (!activity[url]) {
        activity[url] = { visits: 0, timeSpent: 0, scrollDepth: 0, clicks: 0 };
      }
      activity[url].timeSpent += message.timeSpent || 0;
      chrome.storage.local.set({ activity }, () => {
        console.log(`Time spent on ${url}: ${activity[url].timeSpent}s`);
      });
    });
  }

  if (message.action === "trackScroll") {
    chrome.storage.local.get(["activity"], (result) => {
      const activity = result.activity || {};
      if (!activity[url]) {
        activity[url] = { visits: 0, timeSpent: 0, scrollDepth: 0, clicks: 0 };
      }
      activity[url].scrollDepth = Math.max(
        activity[url].scrollDepth,
        message.scrollDepth || 0
      );
      chrome.storage.local.set({ activity }, () => {
        console.log(`Scroll depth on ${url}: ${activity[url].scrollDepth}px`);
      });
    });
  }

  if (message.action === "trackClick") {
    chrome.storage.local.get(["activity"], (result) => {
      const activity = result.activity || {};
      if (!activity[url]) {
        activity[url] = { visits: 0, timeSpent: 0, scrollDepth: 0, clicks: 0 };
      }
      activity[url].clicks += 1;
      chrome.storage.local.set({ activity }, () => {
        console.log(`Clicks on ${url}: ${activity[url].clicks}`);
      });
    });
  }

  if (message.action === "detectedSkills") {
    chrome.storage.local.get(["skills"], (result) => {
      const skills = result.skills || {};
      const detectedSkills = message.skills;
      for (const tech in detectedSkills) {
        skills[tech] = (skills[tech] || 0) + detectedSkills[tech];
      }
      chrome.storage.local.set({ skills }, () => {
        console.log(`Detected skills: ${JSON.stringify(skills)}`);
      });
    });
  }
});
