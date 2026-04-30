:root {
  --bg: #eef4f8;
  --card: #ffffff;
  --text: #102a43;
  --muted: #62748a;
  --primary: #1769aa;
  --primary-dark: #0f4f82;
  --secondary: #234e70;
  --success-bg: #e5f7ed;
  --success-text: #116329;
  --warning-bg: #fff7d6;
  --warning-text: #7a4d00;
  --error-bg: #ffe8e8;
  --error-text: #9b1c1c;
  --border: #d8e2ea;
  --shadow: 0 10px 28px rgba(16, 42, 67, 0.10);
  --radius: 18px;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--bg);
}

body {
  margin: 0;
  min-height: 100%;
  min-height: 100dvh;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  line-height: 1.62;
  color: var(--text);
  background:
    radial-gradient(circle at 10% 0%, rgba(23, 105, 170, 0.15), transparent 30%),
    radial-gradient(circle at 90% 10%, rgba(15, 118, 110, 0.14), transparent 28%),
    var(--bg);
}

button,
input,
select {
  font: inherit;
}

button {
  min-height: 68px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(23, 105, 170, 0.16);
  border: 0;
  border-radius: 14px;
  padding: 17px 18px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  color: var(--text);
  background: #dde7ef;
  font-size: 20px;
  font-weight: 800;
  transition: transform 0.08s ease, opacity 0.12s ease, box-shadow 0.12s ease;
}

button:active {
  transform: scale(0.98);
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(23, 105, 170, 0.28);
  outline-offset: 2px;
}

button:disabled,
input:disabled,
select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.app-shell {
  width: min(100%, 960px);
  margin: 0 auto;
  padding: max(14px, env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));
}

.app-header {
  padding: 16px 4px 12px;
}

.brand-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.brand-icon {
  display: grid;
  place-items: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), #0f766e);
  color: #fff;
  font-size: 28px;
  box-shadow: var(--shadow);
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 4px;
  font-size: clamp(24px, 6vw, 36px);
  line-height: 1.22;
}

h2 {
  margin-bottom: 8px;
  font-size: clamp(23px, 5.6vw, 32px);
}

h3 {
  margin-bottom: 12px;
  font-size: 25px;
}

#pageHint,
.muted {
  color: var(--muted);
  font-size: 19px;
  line-height: 1.75;
}

.card {
  margin: 14px 0;
  padding: 18px;
  border: 1px solid rgba(216, 226, 234, 0.78);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}

.hidden {
  display: none !important;
}

.home-card {
  padding: 20px;
}

.home-actions {
  display: grid;
  gap: 12px;
  margin: 18px 0;
}

.primary-btn,
.confirm-btn {
  width: 100%;
  color: #fff;
  font-weight: 800;
  background: var(--primary);
  box-shadow: 0 8px 18px rgba(23, 105, 170, 0.22);
}

.primary-btn.secondary {
  background: var(--secondary);
}

.primary-btn.subject-entry {
  background: #0f766e;
}

.confirm-btn {
  background: #0f766e;
}

.notice {
  padding: 12px;
  border-radius: 14px;
  color: #254563;
  background: #f0f7ff;
  line-height: 1.6;
}

.top-toolbar,
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.top-toolbar {
  position: sticky;
  top: max(8px, env(safe-area-inset-top));
  z-index: 20;
  padding: 8px 0;
  background: linear-gradient(180deg, rgba(238, 244, 248, 0.98), rgba(238, 244, 248, 0.86));
  backdrop-filter: blur(8px);
}

.practice-title-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.round-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--primary-dark);
  background: #dff0ff;
  font-weight: 800;
  font-size: 16px;
}

.option-list {
  display: grid;
  gap: 12px;
}

.option-item {
  display: grid;
  width: 100%;
  min-height: 68px;
  grid-template-columns: 52px 1fr;
  gap: 10px;
  align-items: start;
  padding: 18px;
  border: 2px solid #dbe7f0;
  border-radius: 16px;
  background: #f8fbfd;
  line-height: 1.72;
  text-align: left;
  box-shadow: none;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.option-item > * {
  pointer-events: none;
}

.option-item:hover,
.option-item:focus-visible {
  border-color: rgba(23, 105, 170, 0.55);
  background: #eef7ff;
}

.option-item.pressing {
  border-color: rgba(23, 105, 170, 0.68);
  background: #eef7ff;
  transform: scale(0.992);
}

.option-item.selected {
  border-color: #0f766e;
  background: #e5f7ed;
}

.option-letter {
  font-weight: 900;
  color: var(--primary);
  font-size: 24px;
}

.option-item.selected .option-letter::after {
  content: " ✓";
  color: #0f766e;
}

.option-text {
  font-size: 22px;
  font-weight: 700;
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.answer-cell {
  display: grid;
  gap: 8px;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 14px;
  transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}

.answer-cell.active {
  border-color: rgba(23, 105, 170, 0.55);
  background: #eef7ff;
  box-shadow: 0 0 0 3px rgba(23, 105, 170, 0.12);
}

.answer-cell.manual-filled {
  border-color: rgba(15, 118, 110, 0.42);
  background: #f0fbf5;
}

.answer-cell.manual-filled.active {
  border-color: rgba(23, 105, 170, 0.72);
}

.answer-cell.just-filled {
  background: #e5f7ed;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.22);
}

.answer-cell label {
  font-weight: 900;
  font-size: 21px;
}

.answer-cell select {
  width: 100%;
  min-height: 62px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font-size: 24px;
  font-weight: 800;
  touch-action: manipulation;
}

.action-row {
  margin-top: 16px;
}

.result-box {
  margin: 14px 0;
  padding: 16px;
  border-radius: 16px;
  font-size: 20px;
  line-height: 1.85;
  white-space: pre-line;
  box-shadow: var(--shadow);
}

.result-box.success {
  color: var(--success-text);
  background: var(--success-bg);
}

.result-box.warning {
  color: var(--warning-text);
  background: var(--warning-bg);
}

.result-box.error {
  color: var(--error-text);
  background: var(--error-bg);
}


.subject-question-list {
  display: grid;
  gap: 14px;
}

.subject-question-card {
  scroll-margin: calc(96px + env(safe-area-inset-top)) 0 calc(140px + env(safe-area-inset-bottom));
}

.subject-question-card.correct {
  border-color: rgba(17, 99, 41, 0.45);
  background: rgba(229, 247, 237, 0.96);
}

.subject-question-card.wrong {
  border-color: rgba(155, 28, 28, 0.45);
  background: rgba(255, 232, 232, 0.96);
}

.question-prompt {
  margin-bottom: 16px;
  font-size: 19px;
  line-height: 1.82;
  color: var(--text);
}

.subject-fields {
  display: grid;
  gap: 14px;
}

.subject-field {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(216, 226, 234, 0.92);
  border-radius: 16px;
  background: #f8fbfd;
}

.subject-field-label {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.45;
}

.subject-control-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.subject-field input,
.subject-field select {
  width: 100%;
  min-height: 64px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font-size: 22px;
  font-weight: 800;
  touch-action: manipulation;
  -webkit-appearance: none;
  appearance: none;
}

.subject-field select {
  background-image: linear-gradient(45deg, transparent 50%, #62748a 50%), linear-gradient(135deg, #62748a 50%, transparent 50%);
  background-position: calc(100% - 22px) 50%, calc(100% - 14px) 50%;
  background-size: 8px 8px, 8px 8px;
  background-repeat: no-repeat;
  padding-right: 42px;
}

.subject-unit {
  min-width: 34px;
  font-size: 22px;
  font-weight: 900;
  color: var(--primary-dark);
}

.question-feedback {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.6;
}

.question-feedback.correct {
  color: var(--success-text);
  background: var(--success-bg);
}

.question-feedback.wrong {
  color: var(--error-text);
  background: var(--error-bg);
}

.subject-action-card {
  position: sticky;
  bottom: max(10px, env(safe-area-inset-bottom));
  z-index: 18;
  margin-bottom: calc(8px + env(safe-area-inset-bottom));
  padding: 12px;
}

.subject-action-row button {
  min-height: 64px;
}

@media (max-width: 380px) {
  body {
    font-size: 18px;
  }

  .brand-icon {
    flex-basis: 46px;
    width: 46px;
    height: 46px;
  }

  button {
    min-height: 62px;
    padding: 15px 12px;
    font-size: 18px;
  }

  .card {
    padding: 14px;
  }

  .question-prompt {
    font-size: 18px;
  }

  .subject-field input,
  .subject-field select {
    min-height: 62px;
    font-size: 21px;
  }
}


body.modal-open {
  overflow: hidden;
}

.modal-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding:
    max(16px, env(safe-area-inset-top))
    max(12px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
  background: rgba(8, 22, 37, 0.58);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.modal-backdrop {
  width: 100%;
  min-height: 100%;
  display: grid;
  place-items: center;
}

.modal-card {
  width: min(92vw, 520px);
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(216, 226, 234, 0.95);
  background: #fff;
  box-shadow: 0 24px 70px rgba(8, 22, 37, 0.35);
}

.modal-header {
  flex: 0 0 auto;
  padding: 18px 18px 10px;
  border-bottom: 1px solid rgba(216, 226, 234, 0.72);
}

.modal-header h2 {
  margin: 0;
  font-size: clamp(23px, 5.6vw, 30px);
  line-height: 1.25;
}

.modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px calc(18px + env(safe-area-inset-bottom));
  -webkit-overflow-scrolling: touch;
}

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-desc {
  margin: 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.7;
}

.modal-field {
  display: grid;
  gap: 8px;
  font-weight: 850;
  line-height: 1.45;
}

.modal-field span {
  font-size: 19px;
}

.modal-field input {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
}

.modal-field input::placeholder {
  color: #8ba0b4;
  font-weight: 650;
}

.modal-inline-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.modal-field.compact span {
  font-size: 17px;
}

.modal-actions {
  display: grid;
  gap: 10px;
  margin-top: 2px;
}

.modal-actions.two-columns {
  grid-template-columns: 1fr 1fr;
}

.modal-primary-btn,
.modal-secondary-btn {
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 19px;
}

.modal-primary-btn {
  color: #fff;
  background: var(--primary);
}

.modal-secondary-btn {
  color: var(--primary-dark);
  background: #dff0ff;
}

.modal-feedback {
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 18px;
  line-height: 1.7;
  white-space: pre-line;
}

.modal-feedback.success {
  color: var(--success-text);
  background: var(--success-bg);
}

.modal-feedback.error {
  color: var(--error-text);
  background: var(--error-bg);
}

@media (max-width: 360px) {
  .modal-inline-grid {
    grid-template-columns: 1fr;
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .modal-root {
    align-items: start;
  }

  .modal-card {
    max-height: calc(100vh - 20px);
    max-height: calc(100dvh - 20px);
  }

  .modal-header {
    padding-top: 12px;
  }
}

.footer {
  padding: 14px 4px 4px;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
}

@media (min-width: 680px) {
  .app-shell {
    padding: 24px;
  }

  .home-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .answer-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .subject-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    padding: 22px;
  }
}
