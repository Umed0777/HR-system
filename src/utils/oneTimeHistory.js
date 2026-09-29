export const PAGE_SIZE = 20;
export const ATTEMPTS_PAGE_SIZE = 10;

export const HISTORY_ROUTES = {
  list: "/test-history",
  intern: (id) => `/test-history/intern/${id}`,
  attempt: (id) => `/test-history/attempt/${id}`,
};

export const fmtDate = (v) => (v ? new Date(v).toLocaleString("ru-RU") : "—");

export const fullName = (i) =>
  [i?.last_name, i?.first_name, i?.middle_name].filter(Boolean).join(" ");

export const getErrorMessage = (err) => err.response?.data?.error || err.message;

export const sortAnswers = (answers = []) =>
  [...answers].sort((a, b) => a.position - b.position);

export const ATTEMPT_STATUS = {
  graded: { label: "Проверено", color: "green" },
  needs_grading: { label: "Ждёт проверки", color: "orange" },
};

export const getStatusKey = (needsGrading) =>
  needsGrading ? "needs_grading" : "graded";

export const ATTEMPT_STATUS_OPTIONS = [
  { value: "graded", label: "Проверенные" },
  { value: "needs_grading", label: "Ждут проверки" },
];

const SCORE_TAGS = {
  1: { label: "Верно", color: "green" },
  0: { label: "Неверно", color: "red" },
};
const SCORE_PENDING = { label: "Не проверен", color: "orange" };

export const getScoreTag = (score) => SCORE_TAGS[score] ?? SCORE_PENDING;

export const GRADED_BY_LABEL = {
  auto: "Оценено автоматически",
  manual: "Оценено вручную",
};