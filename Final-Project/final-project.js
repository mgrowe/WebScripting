// Stored data keys keep this final project separate from the rest of the site.
const themeKey = "phishguard-theme";
const historyKey = "phishguard-history";

const body = document.body;
const themeToggle = document.querySelector("#theme-toggle");
const analyzerForm = document.querySelector("#analyzer-form");
const senderInput = document.querySelector("#sender-email");
const subjectInput = document.querySelector("#email-subject");
const bodyInput = document.querySelector("#email-body");
const linkInput = document.querySelector("#link-url");
const validationMessage = document.querySelector("#validation-message");
const scoreValue = document.querySelector("#score-value");
const scoreMeter = document.querySelector("#score-meter");
const riskLevel = document.querySelector("#risk-level");
const riskExplanation = document.querySelector("#risk-explanation");
const redFlagsContainer = document.querySelector("#red-flags");
const historyList = document.querySelector("#history-list");
const historyFilters = document.querySelectorAll(".history-filter");
const clearHistoryButton = document.querySelector("#clear-history");
const sampleSender = document.querySelector("#sample-sender");
const sampleSubject = document.querySelector("#sample-subject");
const sampleBody = document.querySelector("#sample-body");
const trainingButtons = document.querySelectorAll("[data-answer]");
const nextSampleButton = document.querySelector("#next-sample");
const resetTrainingButton = document.querySelector("#reset-training");
const trainingFeedback = document.querySelector("#training-feedback");
const trainingScore = document.querySelector("#training-score");

let analysisHistory = loadHistory();
let currentHistoryFilter = "all";
let currentSampleIndex = 0;
let previousSampleIndex = null;
let trainingCorrect = 0;
let trainingAttempts = 0;
let answeredCurrentSample = false;

const trainingSamples = [
  {
    sender: "advisor@campus-example.edu",
    subject: "Reminder: study group room changed",
    body: "Hi Taylor, our study group moved to Room 214 at 3:00. No action is needed before you arrive.",
    answer: "legitimate",
    explanation: "This message appears legitimate because it gives a specific, low-pressure update and does not ask for credentials, payment, or urgent action.",
    redFlags: []
  },
  {
    sender: "notice@secure-mail-review.example",
    subject: "Final warning: verify account immediately",
    body: "Dear user, your mailbox will close today. Verify your login now using the link provided.",
    answer: "phishing",
    explanation: "This message includes phishing indicators such as urgent wording, a generic greeting, and a credential verification request.",
    redFlags: ["Urgent wording", "Generic greeting", "Request to verify login access"]
  },
  {
    sender: "billing@vendor-example.test",
    subject: "Invoice question for last week's order",
    body: "Hello Jordan, can you confirm whether invoice 1048 should list the delivery address from your last order?",
    answer: "legitimate",
    explanation: "This message appears legitimate because it asks a normal business question, names a specific invoice, does not pressure the reader, and does not request credentials.",
    redFlags: []
  },
  {
    sender: "rewards@bonus-prize-center.example",
    subject: "Act now to claim your guaranteed reward",
    body: "Congratulations, you have been selected for a large reward. Send account details to claim it today.",
    answer: "phishing",
    explanation: "This message includes phishing indicators such as a guaranteed reward, act-now pressure, and a request for account details.",
    redFlags: ["Too-good-to-be-true reward language", "Urgent action wording", "Request for account details"]
  },
  {
    sender: "coordinator@workshop-example.org",
    subject: "Workshop materials for tomorrow",
    body: "Hello, the agenda for tomorrow's workshop is ready. Please review it before the session if you have time.",
    answer: "legitimate",
    explanation: "This message appears legitimate because it is low pressure, describes expected workshop materials, and does not request sensitive information.",
    redFlags: []
  },
  {
    sender: "security@account-helpdesk.example",
    subject: "Immediate password reset required",
    body: "Dear customer, unusual activity was found. Reset your password using this link now or your account will be suspended.",
    answer: "phishing",
    explanation: "This message includes phishing indicators such as urgent wording, password reset language, a generic greeting, and account suspension pressure.",
    redFlags: ["Urgent wording", "Password reset request", "Generic greeting", "Account suspension threat"]
  }
];

function loadTheme() {
  const savedTheme = localStorage.getItem(themeKey);

  if (savedTheme === "dark") {
    body.classList.add("dark-theme");
  }

  updateThemeButton();
}

function toggleTheme() {
  const isDark = body.classList.toggle("dark-theme");
  localStorage.setItem(themeKey, isDark ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  const isDark = body.classList.contains("dark-theme");
  themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function analyzeEmail(event) {
  event.preventDefault();

  const emailData = {
    sender: senderInput.value.trim(),
    subject: subjectInput.value.trim(),
    body: bodyInput.value.trim(),
    link: linkInput.value.trim()
  };

  if (emailData.subject === "" || emailData.body === "") {
    validationMessage.textContent = "Please enter both a subject and email body before analyzing.";
    return;
  }

  validationMessage.textContent = "";

  const redFlags = detectRedFlags(emailData);
  const risk = calculateRisk(redFlags);
  renderAnalysisResult(risk, redFlags);
  saveAnalysis(emailData, risk);
}

function detectRedFlags(emailData) {
  const combinedText = `${emailData.subject} ${emailData.body}`.toLowerCase();
  const sender = emailData.sender.toLowerCase();
  const link = emailData.link.toLowerCase();
  const redFlags = [];

  const rules = [
    {
      title: "Urgent wording",
      points: 18,
      found: /urgent|immediately|final warning|act now|today only/.test(combinedText),
      detail: "The message pressures the reader to act quickly."
    },
    {
      title: "Password or login request",
      points: 16,
      found: /password|login|sign in|credential|reset access/.test(combinedText),
      detail: "It mentions account access or credentials."
    },
    {
      title: "Payment or invoice wording",
      points: 12,
      found: /payment|invoice|billing|wire transfer|overdue/.test(combinedText),
      detail: "Financial language should be verified carefully."
    },
    {
      title: "Generic greeting",
      points: 10,
      found: /dear user|dear customer|hello user|valued customer/.test(combinedText),
      detail: "Generic greetings can be a sign of mass targeting."
    },
    {
      title: "Suspicious attachment wording",
      points: 14,
      found: /attachment|attached file|open the file|download document/.test(combinedText),
      detail: "Unexpected attachments can carry risk."
    },
    {
      title: "Too-good-to-be-true language",
      points: 14,
      found: /winner|guaranteed reward|free prize|selected for|claim your reward/.test(combinedText),
      detail: "Prize or reward claims are common social engineering hooks."
    },
    {
      title: "Account verification request",
      points: 18,
      found: /verify your account|confirm your account|account suspended|update account/.test(combinedText),
      detail: "Account verification requests should be checked through trusted channels."
    }
  ];

  rules.forEach((rule) => {
    if (rule.found) {
      redFlags.push(rule);
    }
  });

  if (sender && (!sender.includes("@") || sender.endsWith(".zip") || sender.includes("secure-") || sender.includes("support-"))) {
    redFlags.push({
      title: "Unusual sender pattern",
      points: 14,
      detail: "The sender address has an unusual or suspicious-looking pattern."
    });
  }

  if (link && (link.includes("http://") || link.includes("@") || link.includes("verify") || link.includes("login") || link.length > 80)) {
    redFlags.push({
      title: "Suspicious link pattern",
      points: 18,
      detail: "The provided link contains a pattern worth verifying before opening."
    });
  }

  const senderDomain = getDomainFromEmail(sender);
  const linkDomain = getDomainFromUrl(link);

  if (senderDomain && linkDomain && !linkDomain.includes(senderDomain)) {
    redFlags.push({
      title: "Mismatched sender and link domains",
      points: 16,
      detail: "The link appears to point somewhere different from the sender domain."
    });
  }

  return redFlags;
}

function getDomainFromEmail(email) {
  if (!email.includes("@")) {
    return "";
  }

  return email.split("@").pop().replace(/^www\./, "");
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

function calculateRisk(redFlags) {
  const score = Math.min(100, redFlags.reduce((total, flag) => total + flag.points, 0));

  if (score >= 60) {
    return {
      score,
      level: "High Risk",
      key: "high",
      explanation: "Multiple strong phishing indicators were detected. Treat this email as suspicious and verify through a trusted channel."
    };
  }

  if (score >= 30) {
    return {
      score,
      level: "Medium Risk",
      key: "medium",
      explanation: "Some warning signs were detected. Review the message carefully before taking any action."
    };
  }

  return {
    score,
    level: "Low Risk",
    key: "low",
    explanation: "Few or no warning signs were detected. Keep reviewing sender details and links before trusting the message."
  };
}

function renderAnalysisResult(risk, redFlags) {
  scoreValue.textContent = risk.score;
  riskLevel.textContent = risk.level;
  riskExplanation.textContent = risk.explanation;
  scoreMeter.className = `score-meter ${risk.key}-risk`;
  redFlagsContainer.innerHTML = "";

  if (redFlags.length === 0) {
    redFlagsContainer.innerHTML = '<p class="empty-state">No red flags detected by these basic rules.</p>';
    return;
  }

  redFlags.forEach((flag) => {
    const flagCard = document.createElement("div");
    flagCard.className = "red-flag-card";
    flagCard.innerHTML = `<strong>${flag.title}</strong><span>${flag.detail}</span>`;
    redFlagsContainer.appendChild(flagCard);
  });
}

function saveAnalysis(emailData, risk) {
  const historyItem = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    sender: emailData.sender || "Unknown sender",
    subject: emailData.subject,
    riskLevel: risk.level,
    riskKey: risk.key,
    score: risk.score
  };

  analysisHistory.unshift(historyItem);
  localStorage.setItem(historyKey, JSON.stringify(analysisHistory));
  renderHistory();
}

function loadHistory() {
  const savedHistory = localStorage.getItem(historyKey);

  if (!savedHistory) {
    return [];
  }

  return JSON.parse(savedHistory);
}

function renderHistory() {
  const filteredHistory = filterHistory();
  historyList.innerHTML = "";

  if (filteredHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No saved analyses match this filter.</p>';
    return;
  }

  filteredHistory.forEach((item) => {
    const historyCard = document.createElement("article");
    historyCard.className = "history-item";

    const subject = document.createElement("strong");
    subject.textContent = item.subject;

    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = `${item.date} | ${item.sender}`;

    const score = document.createElement("span");
    score.textContent = `${item.riskLevel} - Score ${item.score}/100`;

    historyCard.appendChild(subject);
    historyCard.appendChild(meta);
    historyCard.appendChild(score);
    historyList.appendChild(historyCard);
  });
}

function filterHistory() {
  if (currentHistoryFilter === "all") {
    return analysisHistory;
  }

  return analysisHistory.filter((item) => item.riskKey === currentHistoryFilter);
}

function clearHistory() {
  analysisHistory = [];
  localStorage.removeItem(historyKey);
  renderHistory();
}

function getRandomSampleIndex() {
  return Math.floor(Math.random() * trainingSamples.length);
}

function getNextRandomSampleIndex() {
  if (trainingSamples.length === 1) {
    return 0;
  }

  let possibleIndexes = trainingSamples
    .map((sample, index) => index)
    .filter((index) => index !== currentSampleIndex);

  if (possibleIndexes.length > 1) {
    possibleIndexes = possibleIndexes.filter((index) => index !== previousSampleIndex);
  }

  const randomPosition = Math.floor(Math.random() * possibleIndexes.length);
  return possibleIndexes[randomPosition];
}

function loadTrainingSample() {
  const sample = trainingSamples[currentSampleIndex];
  sampleSender.textContent = sample.sender;
  sampleSubject.textContent = sample.subject;
  sampleBody.textContent = sample.body;
  trainingFeedback.innerHTML = "";
  answeredCurrentSample = false;
  setTrainingButtonsDisabled(false);
}

function submitTrainingAnswer(answer) {
  if (answeredCurrentSample) {
    return;
  }

  const sample = trainingSamples[currentSampleIndex];
  const isCorrect = answer === sample.answer;

  trainingAttempts += 1;
  answeredCurrentSample = true;

  if (isCorrect) {
    trainingCorrect += 1;
  }

  setTrainingButtonsDisabled(true);
  renderTrainingFeedback(sample, isCorrect);
  updateTrainingScore();
}

function renderTrainingFeedback(sample, isCorrect) {
  trainingFeedback.innerHTML = "";
  trainingFeedback.className = isCorrect ? "feedback-panel correct-feedback" : "feedback-panel";

  const result = document.createElement("p");
  result.innerHTML = `<strong>${isCorrect ? "Correct." : "Not quite."}</strong> The correct answer is ${formatAnswer(sample.answer)}.`;

  const explanation = document.createElement("p");
  explanation.textContent = sample.explanation;

  trainingFeedback.appendChild(result);
  trainingFeedback.appendChild(explanation);

  if (sample.answer === "phishing" && sample.redFlags.length > 0) {
    const redFlagTitle = document.createElement("p");
    redFlagTitle.innerHTML = "<strong>Red flags in this sample:</strong>";

    const redFlagList = document.createElement("ul");
    sample.redFlags.forEach((flag) => {
      const item = document.createElement("li");
      item.textContent = flag;
      redFlagList.appendChild(item);
    });

    trainingFeedback.appendChild(redFlagTitle);
    trainingFeedback.appendChild(redFlagList);
  }
}

function formatAnswer(answer) {
  return answer === "phishing" ? "Phishing" : "Legitimate";
}

function setTrainingButtonsDisabled(isDisabled) {
  trainingButtons.forEach((button) => {
    button.disabled = isDisabled;
  });
}

function resetTrainingScore() {
  trainingCorrect = 0;
  trainingAttempts = 0;
  updateTrainingScore();
}

function updateTrainingScore() {
  trainingScore.textContent = `Score: ${trainingCorrect} correct out of ${trainingAttempts}`;
}

themeToggle.addEventListener("click", toggleTheme);
analyzerForm.addEventListener("submit", analyzeEmail);
clearHistoryButton.addEventListener("click", clearHistory);

historyFilters.forEach((button) => {
  button.addEventListener("click", () => {
    historyFilters.forEach((filterButton) => filterButton.classList.remove("active-filter"));
    button.classList.add("active-filter");
    currentHistoryFilter = button.dataset.risk;
    renderHistory();
  });
});

trainingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    submitTrainingAnswer(button.dataset.answer);
  });
});

nextSampleButton.addEventListener("click", () => {
  previousSampleIndex = currentSampleIndex;
  currentSampleIndex = getNextRandomSampleIndex();
  loadTrainingSample();
});

resetTrainingButton.addEventListener("click", resetTrainingScore);

loadTheme();
renderHistory();
currentSampleIndex = getRandomSampleIndex();
loadTrainingSample();
updateTrainingScore();
