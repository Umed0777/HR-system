// employeeId вошедшего пользователя — обычный пользователь проходит тесты и опросы сам за себя.
// Порядок: поле из ответа логина → поле из /api/Test/my → сотрудник с тем же email/userName.
export const getCurrentEmployeeId = (employees = [], myTests = []) => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    user = {};
  }
  if (user.employeeId) return Number(user.employeeId);

  const fromMyTests = myTests.find((x) => x?.employeeId)?.employeeId;
  if (fromMyTests) return Number(fromMyTests);

  const email = String(user.email || "").toLowerCase();
  const userName = String(user.userName || "").toLowerCase();
  const employee = employees.find(
    (e) =>
      (email && String(e.email || "").toLowerCase() === email) ||
      (userName && String(e.userName || "").toLowerCase() === userName),
  );
  return employee?.id ?? null;
};
