

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "MultipleChoice",
  OPEN_ENDED: "OpenEnded",
  RATING: "Rating",
};

export const QUESTION_TYPE_NUMERIC = {
  MultipleChoice: 1,
  Test: 1,
  test: 1,
  OpenEnded: 2,
  Open: 2,
  Manual: 2,
  Rating: 3,
  Score: 3,
};


export const QUESTION_TYPE_NAMES = {
  MultipleChoice: "Тест (выбор варианта)",
  OpenEnded: "Открытый ответ",
  Rating: "Рейтинг",
};

export const isQuestionOfType = (question, type) => {
  if (!question) return false;
  const qt = question.type;
  if (qt === undefined || qt === null || qt === "") return false;

  if (typeof qt === "number") {
    return qt === QUESTION_TYPE_NUMERIC[type];
  }

  const s = String(qt).trim();
  return s === type || s.toLowerCase() === String(type).toLowerCase();
};

export const filterQuestionsByType = (questions, type) => {
  if (!Array.isArray(questions)) return [];
  return questions.filter((q) => isQuestionOfType(q, type));
};