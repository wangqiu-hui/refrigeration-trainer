const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const STEP_COUNT = LETTERS.length;
const ASSET_VERSION = "20260430-sequential-fill-fix";

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
let activeAnswerIndex = 0;
let activeAnswerSource = "auto";

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
  activeAnswerIndex = 0;
  activeAnswerSource = "auto";

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

  LETTERS.forEach((letter, index) => {
    const item = indexedSteps[index];
    optionMap[letter] = item.text;
    indexToLetter[item.originalIndex] = letter;
  });

  const correctLetters = exercise.steps.map((_, index) => indexToLetter[index]);

  roundNumber += 1;
  activeAnswerIndex = 0;
  activeAnswerSource = "auto";
  currentSession = {
    title: exercise.title,
    optionMap,
    correctLetters
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
  setActiveAnswerIndex(0, { source: "auto", scroll: false, focus: false });
  updateOptionSelectedStates();
}

function renderOptions() {
  optionList.innerHTML = "";

  for (const letter of LETTERS) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "option-item";
    item.dataset.letter = letter;
    item.setAttribute("aria-pressed", "false");
    item.setAttribute(
      "aria-label",
      `选择 ${letter}，填入当前高亮的作答步骤。${currentSession.optionMap[letter]}`
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

  chooseOptionLetter(letter);
}

function chooseOptionLetter(letter) {
  if (!currentSession || !LETTERS.includes(letter)) {
    return;
  }

  const selects = getAnswerSelects();
  const targetIndex = resolveActiveAnswerIndex(selects);
  const targetSelect = selects[targetIndex];

  if (!targetSelect) {
    console.warn("未找到当前作答步骤下拉框：", { letter, targetIndex });
    return;
  }

  const existingIndex = selects.findIndex(select => select.value === letter);
  const isMovingUsedLetter = existingIndex !== -1 && existingIndex !== targetIndex;
  const shouldRequireExplicitTarget = isMovingUsedLetter && activeAnswerSource !== "user";

  if (shouldRequireExplicitTarget) {
    const existingSelect = selects[existingIndex];
    const existingStepNumber = existingIndex + 1;

    updateOptionSelectedStates();
    showResult(`选项 ${letter} 已在第 ${existingStepNumber} 步使用；如需移动，请先点击目标步骤`, "warning");
    flashAnswerCell(existingSelect, { scroll: true });
    return;
  }

  // 如果这个字母曾被学生填在别的位置，且本次是明确修改目标步骤，则先移除旧位置，保证不会重复选择。
  for (const select of selects) {
    if (select !== targetSelect && select.value === letter) {
      clearSelectValue(select);
    }
  }

  targetSelect.value = letter;
  targetSelect.closest(".answer-cell")?.classList.add("manual-filled");

  updateOptionSelectedStates();
  flashAnswerCell(targetSelect, { scroll: true });

  const nextEmptyIndex = findNextEmptyIndex(targetIndex + 1, selects);
  setActiveAnswerIndex(nextEmptyIndex ?? targetIndex, { source: "auto", scroll: false, focus: false });

  const targetStepNumber = targetIndex + 1;
  const nextStepText = nextEmptyIndex === null ? "" : `，下一步请填写第 ${nextEmptyIndex + 1} 步`;
  showResult(`已将选项 ${letter} 填入第 ${targetStepNumber} 步${nextStepText}`, "success", { scroll: false });
}

function resolveActiveAnswerIndex(selects) {
  if (Number.isInteger(activeAnswerIndex) && activeAnswerIndex >= 0 && activeAnswerIndex < selects.length) {
    return activeAnswerIndex;
  }

  const firstEmptyIndex = findNextEmptyIndex(0, selects);
  return firstEmptyIndex ?? 0;
}

function getAnswerSelects() {
  return Array.from(answerArea.querySelectorAll("select"));
}

function findNextEmptyIndex(startIndex = 0, selects = getAnswerSelects()) {
  if (selects.length === 0) {
    return null;
  }

  for (let offset = 0; offset < selects.length; offset += 1) {
    const index = (startIndex + offset) % selects.length;
    if (selects[index].value === "") {
      return index;
    }
  }

  return null;
}

function setActiveAnswerIndex(index, options = {}) {
  const { source = "user", scroll = false, focus = false } = options;
  const selects = getAnswerSelects();

  if (!Number.isInteger(index) || index < 0 || index >= selects.length) {
    return;
  }

  activeAnswerIndex = index;
  activeAnswerSource = source;
  syncActiveAnswerCell();

  const activeSelect = selects[index];
  const activeCell = activeSelect.closest(".answer-cell");

  if (focus) {
    try {
      activeSelect.focus({ preventScroll: !scroll });
    } catch (error) {
      activeSelect.focus();
    }
  }

  if (scroll && activeCell) {
    activeCell.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function syncActiveAnswerCell() {
  for (const cell of answerArea.querySelectorAll(".answer-cell")) {
    const isActive = Number.parseInt(cell.dataset.index, 10) === activeAnswerIndex;
    cell.classList.toggle("active", isActive);
    cell.setAttribute("aria-current", isActive ? "step" : "false");
  }
}

function clearSelectValue(select) {
  select.value = "";
  select.closest(".answer-cell")?.classList.remove("manual-filled", "just-filled");
}

function updateOptionSelectedStates() {
  const selectedLetters = new Set(getUserLetters().filter(Boolean));

  for (const item of optionList.querySelectorAll(".option-item")) {
    const selected = selectedLetters.has(item.dataset.letter);
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function flashAnswerCell(select, options = {}) {
  const { scroll = true } = options;
  const cell = select.closest(".answer-cell");
  if (!cell) {
    return;
  }

  cell.classList.remove("just-filled");
  // 触发一次重绘，确保连续点击时高亮动画也能重新播放。
  void cell.offsetWidth;
  cell.classList.add("just-filled");

  if (scroll) {
    cell.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.setTimeout(() => {
    cell.classList.remove("just-filled");
  }, 900);
}

function renderAnswers() {
  answerArea.innerHTML = "";

  for (let index = 0; index < STEP_COUNT; index += 1) {
    const cell = document.createElement("div");
    cell.className = "answer-cell";
    cell.dataset.index = String(index);
    cell.addEventListener("pointerdown", () => setActiveAnswerIndex(index, { source: "user", scroll: false, focus: false }));
    cell.addEventListener("click", () => setActiveAnswerIndex(index, { source: "user", scroll: false, focus: false }));

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

    select.addEventListener("pointerdown", () => setActiveAnswerIndex(index, { source: "user", scroll: false, focus: false }));
    select.addEventListener("focus", () => setActiveAnswerIndex(index, { source: "user", scroll: false, focus: false }));
    select.addEventListener("change", handleAnswerChange);

    cell.append(label, select);
    answerArea.appendChild(cell);
  }
}

function handleAnswerChange(event) {
  const select = event.currentTarget;
  const selectedValue = select.value;
  const currentIndex = Number.parseInt(select.dataset.index, 10);
  const cell = select.closest(".answer-cell");

  setActiveAnswerIndex(currentIndex, { source: "user", scroll: false, focus: false });

  if (!selectedValue) {
    cell?.classList.remove("manual-filled");
    updateOptionSelectedStates();
    hideResult();
    return;
  }

  const userLetters = getUserLetters().filter(Boolean);
  const count = userLetters.filter(letter => letter === selectedValue).length;

  if (count > 1) {
    select.value = "";
    cell?.classList.remove("manual-filled");
    updateOptionSelectedStates();
    showResult("不能重复选择同一个选项", "warning");
    return;
  }

  cell?.classList.add("manual-filled");
  updateOptionSelectedStates();
  hideResult();

  const nextEmptyIndex = findNextEmptyIndex(currentIndex + 1);
  setActiveAnswerIndex(nextEmptyIndex ?? currentIndex, { source: "auto", scroll: false, focus: false });
}

function getUserLetters() {
  return Array.from(answerArea.querySelectorAll("select"), select => select.value);
}

function clearAnswers() {
  for (const select of answerArea.querySelectorAll("select")) {
    clearSelectValue(select);
  }

  setActiveAnswerIndex(0, { source: "auto", scroll: false, focus: false });
  updateOptionSelectedStates();
  hideResult();
}

function confirmAnswers() {
  if (!currentSession) {
    return;
  }

  const userLetters = getUserLetters();

  if (userLetters.some(letter => letter === "")) {
    const firstEmptyIndex = userLetters.findIndex(letter => letter === "");
    setActiveAnswerIndex(firstEmptyIndex, { source: "auto", scroll: true, focus: false });
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

function showResult(message, type, options = {}) {
  const { scroll = true } = options;

  resultBox.textContent = message;
  resultBox.className = `result-box ${type}`;
  resultBox.classList.remove("hidden");

  if (scroll) {
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
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
