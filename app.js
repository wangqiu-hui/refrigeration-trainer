const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const STEP_COUNT = LETTERS.length;
const ASSET_VERSION = "20260430-mobile-primary-v7";

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
let pendingOptionTap = null;
let lastOptionActivation = { letter: "", time: 0, source: "" };

const TAP_MOVE_TOLERANCE_PX = 48;
const TAP_MAX_DURATION_MS = 1500;
const DUPLICATE_TAP_GUARD_MS = 650;

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
  lastOptionActivation = { letter: "", time: 0, source: "" };
  pendingOptionTap = null;

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
  lastOptionActivation = { letter: "", time: 0, source: "" };
  pendingOptionTap = null;
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
    bindOptionActivationEvents(item);

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

function bindOptionActivationEvents(optionButton) {
  if (window.PointerEvent) {
    optionButton.addEventListener("pointerdown", handleOptionPointerDown, { passive: true });
    optionButton.addEventListener("pointerup", handleOptionPointerUp, { passive: false });
    optionButton.addEventListener("pointercancel", cancelPendingOptionTap);
    optionButton.addEventListener("lostpointercapture", cancelPendingOptionTap);
  } else {
    optionButton.addEventListener("touchstart", handleOptionTouchStart, { passive: true });
    optionButton.addEventListener("touchend", handleOptionTouchEnd, { passive: false });
    optionButton.addEventListener("touchcancel", cancelPendingOptionTap);
  }

  // click 是最后兜底：桌面浏览器、个别旧版手机浏览器、以及被浏览器重新合成的点击都会走这里。
  // activateOptionButton 会过滤 pointer/touch 后紧跟的合成 click，避免一次轻点填两次。
  optionButton.addEventListener("click", handleOptionClick);
}

function handleOptionPointerDown(event) {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  const optionButton = event.currentTarget;
  pendingOptionTap = {
    button: optionButton,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    time: getNow()
  };

  optionButton.classList.add("pressing");

  // 手机上手指会有轻微滑动；不捕获指针时，pointerup 可能落到别的元素上，表现为“点了没反应”。
  // 捕获后，后续 pointerup 仍会回到这个选项按钮，再按位移判断是真点击还是滚动。
  try {
    if (typeof optionButton.setPointerCapture === "function") {
      optionButton.setPointerCapture(event.pointerId);
    }
  } catch (error) {
    // 某些浏览器/时机会拒绝捕获，click 兜底仍然可用。
  }
}

function handleOptionPointerUp(event) {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  const optionButton = event.currentTarget;
  const isTap = isPendingOptionTap(optionButton, event.pointerId, event.clientX, event.clientY);
  releaseOptionPointerCapture(optionButton, event.pointerId);
  cancelPendingOptionTap();

  if (!isTap) {
    return;
  }

  event.preventDefault();
  activateOptionButton(optionButton, "pointer");
}

function handleOptionTouchStart(event) {
  if (window.PointerEvent) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch) {
    return;
  }

  pendingOptionTap = {
    button: event.currentTarget,
    pointerId: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
    time: getNow()
  };

  event.currentTarget.classList.add("pressing");
}

function handleOptionTouchEnd(event) {
  if (window.PointerEvent) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch) {
    return;
  }

  const optionButton = event.currentTarget;
  const isTap = isPendingOptionTap(optionButton, touch.identifier, touch.clientX, touch.clientY);
  cancelPendingOptionTap();

  if (!isTap) {
    return;
  }

  event.preventDefault();
  activateOptionButton(optionButton, "touch");
}

function handleOptionClick(event) {
  activateOptionButton(event.currentTarget, "click");
}

function activateOptionButton(optionButton, source = "click") {
  if (!optionButton || !optionButton.dataset) {
    return;
  }

  const letter = optionButton.dataset.letter;
  if (!letter) {
    return;
  }

  const now = getNow();
  const isSyntheticClickAfterTouch = source === "click"
    && lastOptionActivation.source !== "click"
    && now - lastOptionActivation.time < DUPLICATE_TAP_GUARD_MS;

  if (isSyntheticClickAfterTouch) {
    return;
  }

  lastOptionActivation = { letter, time: now, source };
  chooseOptionLetter(letter);
}

function isPendingOptionTap(optionButton, pointerId, clientX, clientY) {
  if (!pendingOptionTap || pendingOptionTap.button !== optionButton || pendingOptionTap.pointerId !== pointerId) {
    return false;
  }

  const movedX = Math.abs(clientX - pendingOptionTap.x);
  const movedY = Math.abs(clientY - pendingOptionTap.y);
  const duration = getNow() - pendingOptionTap.time;
  return movedX <= TAP_MOVE_TOLERANCE_PX
    && movedY <= TAP_MOVE_TOLERANCE_PX
    && duration <= TAP_MAX_DURATION_MS;
}

function cancelPendingOptionTap() {
  if (pendingOptionTap && pendingOptionTap.button) {
    pendingOptionTap.button.classList.remove("pressing");
  }
  pendingOptionTap = null;
}

function releaseOptionPointerCapture(optionButton, pointerId) {
  try {
    if (typeof optionButton.releasePointerCapture === "function" && optionButton.hasPointerCapture(pointerId)) {
      optionButton.releasePointerCapture(pointerId);
    }
  } catch (error) {
    // 忽略释放失败；浏览器会在 pointerup 后自动释放。
  }
}

function getNow() {
  if (window.performance && typeof window.performance.now === "function") {
    return window.performance.now();
  }

  return Date.now();
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

  const previousIndex = selects.findIndex(select => select.value === letter);

  // 移动端交互规则必须简单：点哪个字母，就把哪个字母放到当前高亮步骤。
  // 如果这个字母已经在别的步骤，直接移动过来并清空旧位置，避免“点了但没选中”的错觉。
  if (previousIndex !== -1 && previousIndex !== targetIndex) {
    clearSelectValue(selects[previousIndex]);
  }

  targetSelect.value = letter;
  targetSelect.closest(".answer-cell")?.classList.add("manual-filled");

  updateOptionSelectedStates();
  flashAnswerCell(targetSelect, { scroll: false });

  const nextEmptyIndex = findNextEmptyIndex(targetIndex + 1, selects);
  setActiveAnswerIndex(nextEmptyIndex ?? targetIndex, { source: "auto", scroll: false, focus: false });

  const targetStepNumber = targetIndex + 1;
  const movedText = previousIndex !== -1 && previousIndex !== targetIndex ? `，并已从第 ${previousIndex + 1} 步移除` : "";
  const nextStepText = nextEmptyIndex === null ? "" : `；下一步请填写第 ${nextEmptyIndex + 1} 步`;
  showResult(`已将选项 ${letter} 填入第 ${targetStepNumber} 步${movedText}${nextStepText}`, "success", { scroll: false });
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
  lastOptionActivation = { letter: "", time: 0, source: "" };
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
