const AVATAR_COLORS = [
  "#FF9966", // Orange
  "#2F80ED", // Blue
  "#BB6BD9", // Purple
  "#9B51E0", // Violet
  "#6FCF97", // Green
  "#FF5E62", // Red-Orange
  "#4285F4", // Google Blue
  "#34A853", // Google Green
];

/**
 * Returns a consistent color for a given name string.
 */
export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Returns the first letter of a name for avatars.
 */
export const getInitial = (name: string) => {
  return (name || "C").charAt(0).toUpperCase();
};
