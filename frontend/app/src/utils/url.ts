export const parseQuery = (search: string) => {
  const params = new URLSearchParams(search);
  return Object.fromEntries(params.entries());
};

export const stringifyQuery = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
};
