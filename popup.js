// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const addSkillButton = document.getElementById("addSkillButton");
  const trackingToggle = document.getElementById("trackingToggle");
  const exportButton = document.getElementById("exportButton");
  const skillList = document.getElementById("skillList");
  const saveProfileButton = document.getElementById("saveProfileButton");
  const saveAcknowledgement = document.getElementById("saveAcknowledgement");

  // Load existing skills and settings
  chrome.storage.local.get(
    ["skills", "trackingEnabled", "userProfile"],
    (data) => {
      if (data.skills) {
        data.skills.forEach((skill) => addSkillToList(skill));
      }
      trackingToggle.checked = data.trackingEnabled;
      if (data.userProfile) {
        document.getElementById("userName").value = data.userProfile.name || "";
        document.getElementById("userEmail").value =
          data.userProfile.email || "";
        document.getElementById("githubUrl").value =
          data.userProfile.githubUrl || "";
      }
    }
  );

  // Add Skill
  addSkillButton.addEventListener("click", () => {
    const skillInput = document.getElementById("skillInput").value.trim();
    if (skillInput) {
      chrome.storage.local.get("skills", (data) => {
        const skills = data.skills || [];
        if (!skills.includes(skillInput)) {
          skills.push(skillInput);
          chrome.storage.local.set({ skills }, () => {
            addSkillToList(skillInput);
            document.getElementById("skillInput").value = "";
          });
        }
      });
    }
  });

  // Toggle Tracking
  trackingToggle.addEventListener("change", () => {
    chrome.storage.local.set(
      { trackingEnabled: trackingToggle.checked },
      () => {
        console.log(`Tracking enabled: ${trackingToggle.checked}`);
      }
    );
  });

  // Save Profile with GitHub Verification
  saveProfileButton.addEventListener("click", () => {
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const githubUrl = document.getElementById("githubUrl").value.trim();

    if (!name || !email) {
      alert("Please enter both name and email.");
      return;
    }

    // Function to verify GitHub URL
    const verifyGitHub = (url) => {
      if (!url) {
        return Promise.resolve({
          verified: false,
          message: "No GitHub URL provided.",
        });
      }
      const usernameMatch = url.match(/github\.com\/([A-Za-z0-9-]+)/);
      if (!usernameMatch) {
        return Promise.resolve({
          verified: false,
          message: "Invalid GitHub URL format.",
        });
      }
      const username = usernameMatch[1];
      return fetch(`https://api.github.com/users/${username}`)
        .then((response) => {
          if (response.ok) {
            return { verified: true, username };
          } else {
            return { verified: false, message: "GitHub user not found." };
          }
        })
        .catch(() => ({
          verified: false,
          message: "Error verifying GitHub URL.",
        }));
    };

    verifyGitHub(githubUrl).then((result) => {
      const userProfile = {
        name,
        email,
        githubUrl: githubUrl || "",
        userVerified: result.verified,
      };

      chrome.storage.local.set({ userProfile }, () => {
        // Show acknowledgement
        saveAcknowledgement.textContent = "Profile saved successfully!";
        saveAcknowledgement.classList.remove("hidden");

        // Hide after 3 seconds
        setTimeout(() => {
          saveAcknowledgement.classList.add("hidden");
        }, 3000);

        // Optionally, alert user if GitHub verification failed
        if (githubUrl && !result.verified) {
          alert(`GitHub verification failed: ${result.message}`);
        }
      });
    });
  });

  // Export Data
  exportButton.addEventListener("click", () => {
    chrome.storage.local.get(["activity", "skills", "userProfile"], (data) => {
      const exportData = {
        userProfile: data.userProfile,
        activity: data.activity,
        skills: data.skills,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tracking_data.json";
      a.click();
      URL.revokeObjectURL(url);
      console.log("Data exported successfully.");
    });
  });
});

// Function to add skill to the UI list
function addSkillToList(skill) {
  const skillList = document.getElementById("skillList");
  const skillItem = document.createElement("div");
  skillItem.className = "skill-item";

  const skillName = document.createElement("span");
  skillName.textContent = skill;

  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove";
  removeButton.className = "remove-button";
  removeButton.addEventListener("click", () => {
    chrome.storage.local.get("skills", (data) => {
      const skills = data.skills || [];
      const updatedSkills = skills.filter((s) => s !== skill);
      chrome.storage.local.set({ skills: updatedSkills }, () => {
        skillList.removeChild(skillItem);
        console.log(`Skill removed: ${skill}`);
      });
    });
  });

  skillItem.appendChild(skillName);
  skillItem.appendChild(removeButton);
  skillList.appendChild(skillItem);
}
