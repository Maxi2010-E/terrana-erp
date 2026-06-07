export type AttendanceRosterRow = {
  userId: string;
  email: string;
  role: string;
  present: boolean;
  firstLoginTime: string | null;
  locationValid: boolean | null;
  distanceMeters: number | null;
};

export type AttendanceRosterSummary = {
  date: string;
  total: number;
  presentCount: number;
  rows: AttendanceRosterRow[];
};

export type GeneralBoardMessageRow = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type PrivateConversationRow = {
  otherUserId: string;
  otherUserName: string;
  otherUserEmail: string;
  lastMessageBody: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type PrivateMessageRow = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
};

export type OfficeTaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: "open" | "done";
  originalDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  completedBy: string | null;
  completedByName: string | null;
  completedAt: string | null;
};

export type OfficeUserOption = {
  id: string;
  email: string;
  displayName: string;
};

export type FacilityGeofenceSettings = {
  geofenceEnabled: boolean;
  facilityName: string;
  facilityLatitude: number | null;
  facilityLongitude: number | null;
  facilityRadiusMeters: number;
};

export type GeofenceRequirement = {
  required: boolean;
  facilityName: string;
};

export type RecordLoginAttendanceResult =
  | { ok: true; locationValid: boolean; distanceMeters: number | null }
  | {
      ok: false;
      code:
        | "not_authenticated"
        | "account_inactive"
        | "location_required"
        | "outside_geofence"
        | "rpc_failed";
      distanceMeters?: number;
      allowedMeters?: number;
      message?: string;
    };
