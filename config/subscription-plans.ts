import { PackageType } from "@/lib/db";

export type FeatureCapability =
  | "canSync"
  | "canCreateTeams"
  | "canCreateTournaments"
  | "canViewAdvancedAnalytics";

export interface PlanConfig {
  label: string;
  capabilities: FeatureCapability[];
  limits: {
    maxTeams: number;
    maxTournaments: number;
    maxMembersPerTeam: number;
  };
}

export const PLAN_CONFIG: Record<PackageType, PlanConfig> = {
  FREE: {
    label: "Free",
    capabilities: [],
    limits: {
      maxTeams: 1,
      maxTournaments: 1,
      maxMembersPerTeam: 10,
    },
  },
  TEAM_PACKAGE: {
    label: "Team Pro",
    capabilities: ["canSync", "canCreateTeams"],
    limits: {
      maxTeams: 5,
      maxTournaments: 1, // Basic tournament access
      maxMembersPerTeam: 50,
    },
  },
  TOURNAMENT_PACKAGE: {
    label: "Tournament Pro",
    capabilities: ["canCreateTournaments"],
    limits: {
      maxTeams: 1,
      maxTournaments: 10,
      maxMembersPerTeam: 10,
    },
  },
  PRO_PACKAGE: {
    label: "All Access",
    capabilities: [
      "canSync",
      "canCreateTeams",
      "canCreateTournaments",
      "canViewAdvancedAnalytics",
    ],
    limits: {
      maxTeams: 999,
      maxTournaments: 999,
      maxMembersPerTeam: 999,
    },
  },
};
