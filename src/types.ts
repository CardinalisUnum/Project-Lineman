export type ServiceType = "PLDT Fiber" | "SMART Mobile" | "Combined Backbone";

export type OutageStatus = "Normal" | "Degraded" | "Outage" | "Maintenance";

export interface CommunityReport {
  id: string;
  service: ServiceType;
  location: string; // e.g. "Makati, Bel-Air"
  city: string; // e.g. "Makati"
  barangay: string; // e.g. "Bel-Air"
  status: OutageStatus;
  timestamp: number;
  verifications: number;
  notes: string;
  duration: string; // e.g., "1-2 hours", "24 hours+"
  reporter: string; // e.g., "Anonymous User"
  coordinates: [number, number]; // [lat, lng]
  sentiment: "Positive" | "Neutral" | "Negative";
  diagnosticAttached?: boolean;
  diagnosticLog?: string;
}

export type SocialPlatform = "twitter" | "reddit" | "facebook";

export interface SocialFeedItem {
  id: string;
  platform: SocialPlatform;
  username: string;
  text: string;
  location: string;
  timestamp: number;
  sentimentScore: number; // between -1 (Extremely Negative) and 1 (Extremely Positive)
  verifications: number;
  verifiedByCurrentUser?: boolean;
}

export interface UserPrefs {
  defaultLocation: string; // "City, Barangay" format
  consentGiven: boolean;
  emailCCs: string[];
}

export interface BarangayInfo {
  name: string;
  coordinates: [number, number];
}

export interface CityInfo {
  name: string;
  barangays: BarangayInfo[];
}
