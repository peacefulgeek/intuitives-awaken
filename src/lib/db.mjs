// MOCK DB to avoid installation issues
const mockArticles = [];

export const db = {
  exec: () => {},
  prepare: () => ({
    get: () => null,
    run: () => {},
    all: () => []
  })
};

export function query(sql, params = []) {
  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    return { rows: mockArticles };
  } else {
    return { rowCount: 1 };
  }
}
