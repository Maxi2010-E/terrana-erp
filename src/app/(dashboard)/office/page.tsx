import { AttendanceRosterTable } from "@/components/office/attendance-roster-table";
import { BoardTasksPanel } from "@/components/office/board-tasks-panel";
import { GeneralBoardPanel } from "@/components/office/general-board-panel";
import { OfficeViewTabs } from "@/components/office/office-view-tabs";
import { PrivateMessagesPanel } from "@/components/office/private-messages-panel";
import { PageHeader } from "@/components/layout/page-header";
import {
  getDailyAttendanceRoster,
  listCompletedBoardTasksToday,
  listGeneralBoardMessages,
  listOfficeUserOptions,
  listOpenBoardTasks,
  listPrivateConversations,
  listPrivateMessages,
} from "@/lib/actions/office";
import { requireAuth } from "@/lib/auth/require-role";
import {
  parseBoardChannel,
  parseOfficeView,
} from "@/lib/office/constants";
import {
  canDeleteGeneralBoardMessage,
  canManageOfficeTasks,
  canViewAttendanceRoster,
} from "@/lib/office/permissions";
import { normalizeAppRole } from "@/lib/roles";

type OfficePageProps = {
  searchParams: Promise<{
    view?: string;
    channel?: string;
    date?: string;
    with?: string;
  }>;
};

export default async function OfficePage({ searchParams }: OfficePageProps) {
  const { appUser } = await requireAuth();
  const role = normalizeAppRole(appUser?.role);
  const canViewAttendance = canViewAttendanceRoster(role);
  const canManageTasks = canManageOfficeTasks(role);
  const canDeleteMessages = canDeleteGeneralBoardMessage(role);

  const params = await searchParams;
  const view = parseOfficeView(params.view, canViewAttendance);
  const channel = parseBoardChannel(params.channel);
  const withUserId = params.with?.trim() || null;

  const [
    roster,
    messages,
    conversations,
    users,
    openTasks,
    completedTasks,
    threadMessages,
  ] = await Promise.all([
    view === "attendance" && canViewAttendance
      ? getDailyAttendanceRoster(params.date)
      : Promise.resolve(null),
    view === "board" && channel === "general"
      ? listGeneralBoardMessages()
      : Promise.resolve([]),
    view === "board" && channel === "private"
      ? listPrivateConversations()
      : Promise.resolve([]),
    view === "board" && channel === "private"
      ? listOfficeUserOptions()
      : Promise.resolve([]),
    view === "board" && channel === "tasks"
      ? listOpenBoardTasks()
      : Promise.resolve([]),
    view === "board" && channel === "tasks"
      ? listCompletedBoardTasksToday()
      : Promise.resolve([]),
    view === "board" && channel === "private" && withUserId
      ? listPrivateMessages(withUserId)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office"
        description={
          view === "attendance"
            ? "Daily attendance — Present only when signed in at the facility (when geofence is enabled)."
            : "Company board — general updates, private messages, and daily tasks."
        }
      />

      <OfficeViewTabs
        view={view}
        channel={channel}
        canViewAttendance={canViewAttendance}
      />

      {view === "attendance" && roster ? (
        <AttendanceRosterTable roster={roster} />
      ) : null}

      {view === "board" && channel === "general" ? (
        <GeneralBoardPanel messages={messages} canDelete={canDeleteMessages} />
      ) : null}

      {view === "board" && channel === "private" ? (
        <>
          <div className="flex flex-wrap gap-2 sm:hidden">
            <MobileChannelLink channel={channel} target="general" label="General" />
            <MobileChannelLink channel={channel} target="private" label="Private" />
            <MobileChannelLink channel={channel} target="tasks" label="Tasks" />
          </div>
          <PrivateMessagesPanel
            conversations={conversations}
            users={users}
            activeUserId={withUserId}
            initialMessages={threadMessages}
          />
        </>
      ) : null}

      {view === "board" && channel === "tasks" ? (
        <>
          <div className="flex flex-wrap gap-2 sm:hidden">
            <MobileChannelLink channel={channel} target="general" label="General" />
            <MobileChannelLink channel={channel} target="private" label="Private" />
            <MobileChannelLink channel={channel} target="tasks" label="Tasks" />
          </div>
          <BoardTasksPanel
            openTasks={openTasks}
            completedTasks={completedTasks}
            canManage={canManageTasks}
          />
        </>
      ) : null}

      {view === "board" && channel === "general" ? (
        <div className="flex flex-wrap gap-2 sm:hidden">
          <MobileChannelLink channel={channel} target="general" label="General" />
          <MobileChannelLink channel={channel} target="private" label="Private" />
          <MobileChannelLink channel={channel} target="tasks" label="Tasks" />
        </div>
      ) : null}
    </div>
  );
}

function MobileChannelLink({
  channel,
  target,
  label,
}: {
  channel: string;
  target: string;
  label: string;
}) {
  return (
    <a
      href={`/office?view=board&channel=${target}`}
      className={
        channel === target
          ? "rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-xl border border-input px-3 py-1.5 text-sm text-muted-foreground"
      }
    >
      {label}
    </a>
  );
}
