import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  audit,
  moderationCase,
  portfolio,
  studentVerification,
  user,
} from "@/lib/db/schema";
import { pageUser } from "@/lib/http";
import {
  UsersRound,
  GraduationCap,
  BriefcaseBusiness,
  BadgeCheck,
  Clock3,
  Layers3,
  Flag,
  MessagesSquare,
} from "lucide-react";
export const metadata = { title: "Administration" };
const filteredCount = (condition: SQLWrapper) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export default async function Page() {
  await pageUser(true);
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 86_400_000);
  const priorWeek = new Date(now.getTime() - 14 * 86_400_000);
  const [
    [userStats],
    [verificationStats],
    [projectStats],
    [caseStats],
    [newAccounts],
    [priorAccounts],
    [newProjects],
    [priorProjects],
    [newCases],
    [priorCases],
    events,
  ] = await Promise.all([
    getDb()
      .select({
        users: count(),
        students: filteredCount(
          and(eq(user.accessLevel, "user"), eq(user.preferredMode, "student")),
        ),
        employers: filteredCount(
          and(eq(user.accessLevel, "user"), eq(user.preferredMode, "employer")),
        ),
      })
      .from(user)
    getDb()
      .select({
        verified: filteredCount(eq(studentVerification.status, "approved")),
        pending: filteredCount(eq(studentVerification.status, "pending")),
      })
      .from(studentVerification)
    getDb()
      .select({ projects: count() })
      .from(portfolio),
    getDb()
      .select({
        reports: filteredCount(
          and(
            eq(moderationCase.type, "report"),
            inArray(moderationCase.status, ["open", "under_review"]),
          ),
        ),
        disputes: filteredCount(
          and(
            eq(moderationCase.type, "dispute"),
            inArray(moderationCase.status, ["open", "under_review"]),
          ),
        ),
      })
      .from(moderationCase),
    getDb()
      .select({ value: count() })
      .from(user)
      .where(gte(user.createdAt, lastWeek)),
    getDb()
      .select({ value: count() })
      .from(user)
      .where(and(gte(user.createdAt, priorWeek), lt(user.createdAt, lastWeek))),
    getDb()
      .select({ value: count() })
      .from(portfolio)
      .where(gte(portfolio.createdAt, lastWeek)),
    getDb()
      .select({ value: count() })
      .from(portfolio)
      .where(
        and(
          gte(portfolio.createdAt, priorWeek),
          lt(portfolio.createdAt, lastWeek),
        ),
      ),
    getDb()
      .select({ value: count() })
      .from(moderationCase)
      .where(gte(moderationCase.createdAt, lastWeek)),
    getDb()
      .select({ value: count() })
      .from(moderationCase)
      .where(
        and(
          gte(moderationCase.createdAt, priorWeek),
          lt(moderationCase.createdAt, lastWeek),
        ),
      ),
    getDb()
      .select({
        id: audit.id,
        action: audit.action,
        reason: audit.reason,
        createdAt: audit.createdAt,
        actor: user.name,
      })
      .from(audit)
      .innerJoin(user, eq(audit.actorId, user.id))
      .orderBy(desc(audit.createdAt))
      .limit(20),
  ]);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Care for the community</p>
        <h1>Administration</h1>
        <p className="muted">
          Current platform totals and the latest 20 administrative events.
        </p>
      </div>
      <div className="admin-stat-grid">
        {[
          { label: "Accounts", value: userStats.users, icon: UsersRound },
          {
            label: "Student mode",
            value: userStats.students,
            icon: GraduationCap,
          },
          {
            label: "Employer mode",
            value: userStats.employers,
            icon: BriefcaseBusiness,
          },
          {
            label: "Verified students",
            value: verificationStats.verified,
            icon: BadgeCheck,
          },
          {
            label: "Pending ID reviews",
            value: verificationStats.pending,
            icon: Clock3,
          },
          {
            label: "Portfolio projects",
            value: projectStats.projects,
            icon: Layers3,
          },
          {
            label: "Open reports",
            value: caseStats.reports,
            icon: Flag,
          },
          {
            label: "Open disputes",
            value: caseStats.disputes,
            icon: MessagesSquare,
          },
        ].map(({ label, value, icon: Icon }) => (
          <section className="panel admin-stat-card" key={label}>
            <div className="row spread">
              <p className="muted small">{label}</p>
              <Icon className="admin-stat-icon" size={20} aria-hidden="true" />
            </div>
            <p className="stat">{value}</p>
          </section>
        ))}
      </div>
      <section
        className="panel"
        style={{ marginTop: 25 }}
        aria-labelledby="activity-title"
      >
        <h2 id="activity-title">Activity trend</h2>
        <p className="small muted">
          Rolling seven days compared with the preceding seven days. Counts use
          creation time; deleted records are not included.
        </p>
        <div className="grid-three" style={{ marginTop: 18 }}>
          {[
            ["New accounts", newAccounts.value, priorAccounts.value],
            ["New portfolio items", newProjects.value, priorProjects.value],
            ["New account cases", newCases.value, priorCases.value],
          ].map(([label, current, previous]) => (
            <div className="trend-card" key={label}>
              <p className="small muted">{label}</p>
              <p className="stat">{current}</p>
              <p className="small muted">
                Previous 7 days: {previous} · Change:{" "}
                {Number(current) - Number(previous) >= 0 ? "+" : ""}
                {Number(current) - Number(previous)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel" style={{ marginTop: 25 }}>
        <h2>Recent audit activity</h2>
        {events.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Administrator / user</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.action.replaceAll("_", " ")}</td>
                    <td>{event.actor}</td>
                    <td>{event.reason}</td>
                    <td>
                      {event.createdAt.toLocaleDateString("en-GB", {
                        timeZone: "Asia/Dhaka",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 15 }}>
            No administrative events yet.
          </p>
        )}
      </section>
    </>
  );
}
