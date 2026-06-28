import { ApiError } from "./ApiError.js";
import { normalizeToMidnightUTC } from "./normalizeToMidnightUTC.js";

const DEFAULT_FUTURE_DATE_MESSAGE = "Date cannot be in the future.";

const validateDateNotInFuture = (
  date,
  message = DEFAULT_FUTURE_DATE_MESSAGE
) => {
  if (date === undefined || date === null) {
    return;
  }

  const normalizedDate = normalizeToMidnightUTC(date);
  const today = normalizeToMidnightUTC(new Date());

  if (normalizedDate > today) {
    throw new ApiError(400, message);
  }
};

export { validateDateNotInFuture };
