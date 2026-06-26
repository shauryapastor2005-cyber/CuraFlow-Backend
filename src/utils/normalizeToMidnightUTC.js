/*
  Normalize the date to midnight UTC so different timestamps
  on the same day are treated as a single calendar date.
*/

const normalizeToMidnightUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export { normalizeToMidnightUTC };
