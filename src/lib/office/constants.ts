export const GENERAL_BOARD_MESSAGE_MAX = 2000;
export const PRIVATE_MESSAGE_MAX = 2000;
export const TASK_TITLE_MAX = 200;
export const GENERAL_BOARD_PAGE_SIZE = 50;
export const PRIVATE_THREAD_PAGE_SIZE = 100;

export const OFFICE_VIEWS = ["attendance", "board"] as const;
export type OfficeView = (typeof OFFICE_VIEWS)[number];

export const BOARD_CHANNELS = ["general", "private", "tasks"] as const;
export type BoardChannel = (typeof BOARD_CHANNELS)[number];

export function parseOfficeView(
  value: string | undefined,
  canViewAttendance: boolean,
): OfficeView {
  if (canViewAttendance && value === "attendance") {
    return "attendance";
  }
  return "board";
}

export function parseBoardChannel(value: string | undefined): BoardChannel {
  if (value === "private" || value === "tasks") {
    return value;
  }
  return "general";
}
