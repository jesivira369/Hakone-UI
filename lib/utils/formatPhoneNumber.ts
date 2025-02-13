export const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  }
  return cleaned;
};
