const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const STEP_COUNT = LETTERS.length;
const ASSET_VERSION = "20260430-option-target-fix";

const FALLBACK_EXERCISES = {
  startup: {
    title: "开机练习",
    steps: [
      "观察冷却塔内是否有水，观察装置上吸气压力表、排气压力表压力值是否处于较低位。",
      "按下系统启动按钮，给装置控制回路送电。",
      "开启排气阀至最大位置；开启吸气阀至微开位置。",
      "旋转冷却水泵启停旋钮至启动位，旋转冷却风机启停旋钮至启动位。",
      "旋转冷冻水泵旋钮至启动位。",
      "旋转供液电磁阀旋钮至打开位。",
      "旋转压缩机启停旋钮至启动位。",
      "密切关注吸气压力表、排气压力表，缓慢打开吸气阀至最大位置，启动完成。"
    ]
  },
  shutdown: {
    title: "停机练习",
    steps: [
      "将供液电磁阀启停旋钮旋于停止位。",
      "当吸气压力低于 200kPa 时，将压缩机启停旋钮旋于停止位。",
      "关闭吸气阀。",
      "当排气压力低于 0.85MPa 时，关闭排气阀。",
      "旋转冷冻水泵启停旋钮至停止位。",
      "旋转冷却风机启停旋钮至停止位。",
      "旋转冷却水泵启停旋钮至停止位。",
      "按下系统停止按钮，装置控制系统断电，自带控制屏关闭，完成停机操作。"
    ]
  }
};

let exercises = FALLBACK_EXERCISES;
let currentExerciseKey = null;
let currentSession = null;
let roundNumber = 0;

const homeView = document.getElementById("homeView");
const practiceView = document.getElementById("practiceView");
const pageHint = document.getElementById("pageHint");
const practiceTitle = document.getElementById("practiceTitle");
const roundBadge = document.getElementById("roundBadge");
const optionList = document.getElementById("optionList");
const answerArea = document.getElementById("answerArea");
const resultBox = document.getElementById("resultBox");

const startupBtn = document.getElementById("startupBtn");
const shutdownBtn = document.getElementById("shutdownBtn");
const backBtn = document.getElementById("backBtn");
const restartBtn = document.getElementById("restartBtn");
const clearBtn = document.getElementById("clearBtn");
const confirmBtn = document.getElementById("confirmBtn");

startupBtn.addEventListener("click", () => startPractice("startup"));
shutdownBtn.addEventListener("click", () => startPractice("shutdown"));
backBtn.addEventListener("click", showHome);
restartBtn.addEventListener("click", restartPractice);
clearBtn.addEventListener("click", clearAnswers);
confirmBtn.addEventListener("click", confirmAnswers);

initApp();

async function initApp() {
  try {
    const response = await fetch(`steps.json?v=${ASSET_VERSION}`, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const loadedExercises = await response.json();
    validateExercises(loadedExercises);
    exercises = loadedExercises;
  } catch (error) {
    // file:// 直接打开页面时，fetch 可能失败；此时使用内置数据，保证老师双击也能试用。
    exercises = FALLBACK_EXERCISES;
    console.warn("steps.json 读取失败，已使用内置步骤：", error);
  }

  registerServiceWorker();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let hasReloadedForNewServiceWorker = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasReloadedForNewServiceWorker) {
      return;
    }

    hasReloadedForNewServiceWorker = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`sw.js?v=${ASSET_VERSION}`).catch(error => {
      console.warn("Service Worker 注册失败：", error);
    });
  });
}

function validateExercises(data) {
  for (const key of ["startup", "shutdown"]) {
    if (!data[key]) {
      throw new Error(`缺少练习：${key}`);
    }

    if (typeof data[key].title !== "string" || data[key].title.trim() === "") {
      throw new Error(`${key}.title 必须是非空字符串`);
    }

    if (!Array.isArray(data[key].steps) || data[key].steps.length !== STEP_COUNT) {
      throw new Error(`${key}.steps 必须包含 ${STEP_COUNT} 个步骤`);
    }

    for (const step of data[key].steps) {
      if (typeof step !== "string" || step.trim() === "") {
        throw new Error(`${key}.steps 中每一项都必须是非空字符串`);
      }
    }
  }
}

function showHome() {
  currentExerciseKey = null;
  currentSession = null;
  roundNumber = 0;

  homeView.classList.remove("hidden");
  practiceView.classList.add("hidden");
  pageHint.textContent = "请选择练习类型";
  hideResult();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startPractice(exerciseKey) {
  currentExerciseKey = exerciseKey;
  roundNumber = 0;
  newRound();

  homeView.classList.add("hidden");
  practiceView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restartPractice() {
  if (!currentExerciseKey) {
    return;
  }

  newRound();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function newRound() {
  const exercise = exercises[currentExerciseKey];
  const indexedSteps = exercise.steps.map((text, originalIndex) => ({ text, originalIndex }));

  shuffle(indexedSteps);

  const optionMap = {};
  const indexToLetter = {};
  const optionTargets = {};

  LETTERS.forEach((letter, index) => {
    const item = indexedSteps[index];
    optionMap[letter] = item.text;
    indexToLetter[item.originalIndex] = letter;
    optionTargets[letter] = item.originalIndex;
  });

  const correctLetters = exercise.steps.map((_, index) => indexToLetter[index]);

  roundNumber += 1;
  currentSession = {
    title: exercise.title,
    optionMap,
    correctLetters,
    optionTargets
  };

  renderPractice();
}

function renderPractice() {
  hideResult();
  practiceTitle.textContent = currentSession.title;
  pageHint.textContent = currentSession.title;
  roundBadge.textContent = `第 ${roundNumber} 轮`;

  renderOptions();
  renderAnswers();
  updateOptionSelectedStates();
}

function renderOptions() {
  optionList.innerHTML = "";

  for (const letter of LETTERS) {
    const stepIndex = currentSession.optionTargets[letter];
    const stepNumber = stepIndex + 1;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "option-item";
    item.dataset.letter = letter;
    item.dataset.targetIndex = String(stepIndex);
    item.setAttribute("aria-pressed", "false");
    item.setAttribute(
      "aria-label",
      `选择 ${letter}：自动填入第 ${stepNumber} 步。${currentSession.optionMap[letter]}`
    );
    item.addEventListener("click", handleOptionClick);

    const letterEl = document.createElement("span");
    letterEl.className = "option-letter";
    letterEl.textContent = `${letter}.`;

    const textEl = document.createElement("span");
    textEl.className = "option-text";
    textEl.textContent = currentSession.optionMap[letter];

    item.append(letterEl, textEl);
    optionList.appendChild(item);
  }
}

function handleOptionClick(event) {
  const optionButton = event.currentTarget;
  const letter = optionButton.dataset.letter;
  const targetIndex = Number.parseInt(optionButton.dataset.targetIndex, 10);

  chooseOptionLetter(letter, targetIndex);
}

function chooseOptionLetter(letter, targetIndexFromOption = null) {
  if (!currentSession || !LETTERS.includes(letter)) {
    return;
  }

  const fallbackTargetIndex = currentSession.optionTargets[letter];
  const targetIndex = Number.isInteger(targetIndexFromOption) ? targetIndexFromOption : fallbackTargetIndex;

  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= STEP_COUNT) {
    console.warn("选项目标步骤无效：", { letter, targetIndex, fallbackTargetIndex });
    return;
  }

  const stepNumber = targetIndex + 1;
  const selects = Array.from(answerArea.querySelectorAll("select"));
  const targetSelect = document.getElementById(`answer-${targetIndex}`);

  if (!targetSelect) {
    console.warn("未找到目标步骤下拉框：", { letter, targetIndex });
    return;
  }

  // 如果这个字母曾被学生手动填在别的位置，先移除，保证不会重复选择。
  for (const select of selects) {
    if (select !== targetSelect && select.value === letter) {
      select.value = "";
      select.closest(".answer-cell")?.classList.remove("manual-filled", "just-filled");
    }
  }

  targetSelect.value = letter;
  targetSelect.closest(".answer-cell")?.classList.add("manual-filled");

  updateOptionSelectedStates();
  showResult(`已将选项 ${letter} 自动填入第 ${stepNumber} 步`, "success");
  flashAnswerCell(targetSelect);
}

function updateOptionSelectedStates() {
  const selectedLetters = new Set(getUserLetters().filter(Boolean));

  for (const item of optionList.querySelectorAll(".option-item")) {
    const selected = selectedLetters.has(item.dataset.letter);
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function flashAnswerCell(select) {
  const cell = select.closest(".answer-cell");
  if (!cell) {
    return;
  }

  cell.classList.remove("just-filled");
  // 触发一次重绘，确保连续点击时高亮动画也能重新播放。
  void cell.offsetWidth;
  cell.classList.add("just-filled");
  cell.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    cell.classList.remove("just-filled");
  }, 900);
}

function renderAnswers() {
  answerArea.innerHTML = "";

  for (let index = 0; index < STEP_COUNT; index += 1) {
    const cell = document.createElement("div");
    cell.className = "answer-cell";

    const label = document.createElement("label");
    label.setAttribute("for", `answer-${index}`);
    label.textContent = `第 ${index + 1} 步`;

    const select = document.createElement("select");
    select.id = `answer-${index}`;
    select.dataset.index = String(index);
    select.setAttribute("aria-label", `第 ${index + 1} 步`);

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "请选择";
    select.appendChild(emptyOption);

    for (const letter of LETTERS) {
      const option = document.createElement("option");
      option.value = letter;
      option.textContent = letter;
      select.appendChild(option);
    }

    select.addEventListener("change", handleAnswerChange);

    cell.append(label, select);
    answerArea.appendChild(cell);
  }
}

function handleAnswerChange(event) {
  const selectedValue = event.target.value;
  const cell = event.target.closest(".answer-cell");

  if (!selectedValue) {
    cell?.classList.remove("manual-filled");
    updateOptionSelectedStates();
    hideResult();
    return;
  }

  const userLetters = getUserLetters().filter(Boolean);
  const count = userLetters.filter(letter => letter === selectedValue).length;

  if (count > 1) {
    event.target.value = "";
    cell?.classList.remove("manual-filled");
    updateOptionSelectedStates();
    showResult("不能重复选择同一个选项", "warning");
  } else {
    cell?.classList.add("manual-filled");
    updateOptionSelectedStates();
    hideResult();
  }
}

function getUserLetters() {
  return Array.from(answerArea.querySelectorAll("select"), select => select.value);
}

function clearAnswers() {
  for (const select of answerArea.querySelectorAll("select")) {
    select.value = "";
    select.closest(".answer-cell")?.classList.remove("manual-filled", "just-filled");
  }

  updateOptionSelectedStates();
  hideResult();
}

function confirmAnswers() {
  if (!currentSession) {
    return;
  }

  const userLetters = getUserLetters();

  if (userLetters.some(letter => letter === "")) {
    showResult("请完成所有步骤后再确认", "warning");
    return;
  }

  if (userLetters.some(letter => !LETTERS.includes(letter)) || new Set(userLetters).size !== userLetters.length) {
    showResult("不能重复选择同一个选项", "warning");
    return;
  }

  const wrongPositions = [];

  userLetters.forEach((letter, index) => {
    if (letter !== currentSession.correctLetters[index]) {
      wrongPositions.push(index + 1);
    }
  });

  if (wrongPositions.length === 0) {
    showResult("回答正确", "success");
    return;
  }

  const wrongText = wrongPositions.map(position => `第 ${position} 步`).join("、");

  showResult(
    [
      "回答错误",
      "",
      `用户填写的答案：${userLetters.join(" ")}`,
      `正确答案：${currentSession.correctLetters.join(" ")}`,
      `错误的位置：${wrongText}错误`
    ].join("\n"),
    "error"
  );
}

function showResult(message, type) {
  resultBox.textContent = message;
  resultBox.className = `result-box ${type}`;
  resultBox.classList.remove("hidden");
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideResult() {
  resultBox.textContent = "";
  resultBox.className = "result-box hidden";
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
}
