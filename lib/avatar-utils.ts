export function generateInitialsAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "#F87171", // red-400
    "#FB923C", // orange-400
    "#FACC15", // yellow-400
    "#4ADE80", // green-400
    "#60A5FA", // blue-400
    "#818CF8", // indigo-400
    "#A78BFA", // violet-400
    "#F472B6", // pink-400
  ];

  const color = colors[name.length % colors.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" fill="${color}" />
    <text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white">${initials}</text>
  </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function getPlayerAvatar(player: {
  name: string;
  avatarUrl?: string | null;
  image?: string | null;
}): string {
  if (player.avatarUrl) return player.avatarUrl;
  if (player.image) return player.image; // Fallback to User image if available
  return generateInitialsAvatar(player.name);
}
