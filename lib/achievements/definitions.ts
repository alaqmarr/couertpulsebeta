export type AchievementCategory =
  | "GAMES"
  | "WINS"
  | "TOURNAMENTS"
  | "SOCIAL"
  | "SPECIAL";
export type AchievementTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND";

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  criteria: {
    type: string;
    value: number;
    field?: string;
  };
}

export const achievementDefinitions: AchievementDefinition[] = [
  // GAMES Category
  {
    key: "FIRST_GAME",
    name: "First Steps",
    description: "Play your first game",
    icon: "Play",
    category: "GAMES",
    tier: "BRONZE",
    criteria: { type: "games_played", value: 1 },
  },
  {
    key: "REGULAR_PLAYER",
    name: "Regular Player",
    description: "Play 10 games",
    icon: "Dumbbell",
    category: "GAMES",
    tier: "SILVER",
    criteria: { type: "games_played", value: 10 },
  },
  {
    key: "VETERAN",
    name: "Veteran",
    description: "Play 50 games",
    icon: "Medal",
    category: "GAMES",
    tier: "GOLD",
    criteria: { type: "games_played", value: 50 },
  },
  {
    key: "LEGEND",
    name: "Legend",
    description: "Play 100 games",
    icon: "Crown",
    category: "GAMES",
    tier: "PLATINUM",
    criteria: { type: "games_played", value: 100 },
  },

  // WINS Category
  {
    key: "FIRST_WIN",
    name: "First Victory",
    description: "Win your first game",
    icon: "Trophy",
    category: "WINS",
    tier: "BRONZE",
    criteria: { type: "wins", value: 1 },
  },
  {
    key: "WINNING_STREAK_3",
    name: "Hot Streak",
    description: "Win 3 games in a row",
    icon: "Flame",
    category: "WINS",
    tier: "SILVER",
    criteria: { type: "win_streak", value: 3 },
  },
  {
    key: "DOMINANT",
    name: "Dominant",
    description: "Win 25 games",
    icon: "Zap",
    category: "WINS",
    tier: "GOLD",
    criteria: { type: "wins", value: 25 },
  },
  {
    key: "UNSTOPPABLE",
    name: "Unstoppable",
    description: "Win 50 games",
    icon: "Rocket",
    category: "WINS",
    tier: "PLATINUM",
    criteria: { type: "wins", value: 50 },
  },

  // TOURNAMENTS Category
  {
    key: "TOURNAMENT_DEBUT",
    name: "Tournament Debut",
    description: "Join your first tournament",
    icon: "Users",
    category: "TOURNAMENTS",
    tier: "BRONZE",
    criteria: { type: "tournaments_joined", value: 1 },
  },
  {
    key: "TOURNAMENT_WINNER",
    name: "Tournament Winner",
    description: "Win a tournament",
    icon: "Award",
    category: "TOURNAMENTS",
    tier: "GOLD",
    criteria: { type: "tournaments_won", value: 1 },
  },
  {
    key: "CHAMPION",
    name: "Champion",
    description: "Win 3 tournaments",
    icon: "Star",
    category: "TOURNAMENTS",
    tier: "PLATINUM",
    criteria: { type: "tournaments_won", value: 3 },
  },

  // SOCIAL Category
  {
    key: "TEAM_PLAYER",
    name: "Team Player",
    description: "Join a team",
    icon: "Heart",
    category: "SOCIAL",
    tier: "BRONZE",
    criteria: { type: "teams_joined", value: 1 },
  },
  {
    key: "POPULAR",
    name: "Popular",
    description: "Play with 5 different teammates",
    icon: "UserPlus",
    category: "SOCIAL",
    tier: "SILVER",
    criteria: { type: "unique_teammates", value: 5 },
  },
  {
    key: "MVP",
    name: "MVP",
    description: "Score 100 points in tournaments",
    icon: "Target",
    category: "SOCIAL",
    tier: "GOLD",
    criteria: { type: "points_scored", value: 100 },
  },

  // SPECIAL Category
  {
    key: "PERFECT_GAME",
    name: "Perfect Game",
    description: "Win a game without conceding a point",
    icon: "Sparkles",
    category: "SPECIAL",
    tier: "DIAMOND",
    criteria: { type: "perfect_game", value: 1 },
  },
];
