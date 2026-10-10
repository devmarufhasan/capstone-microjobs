import Link from "next/link";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { AdminAction } from "@/components/admin-action";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { pageUser } from "@/lib/http";
export const metadata = { title: "Manage users" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await pageUser(true);
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100),
    page = Math.max(
      1,
      Math.min(10000, Number.parseInt(params.page ?? "1") || 1),
    );
  const status =
    params.status === "active" || params.status === "suspended"
      ? params.status
      : undefined;
  const condition = and(
    q
      ? or(
          ilike(
            user.name,
            `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
          ),
          ilike(
            user.email,
            `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
          ),
        )
      : undefined,
    status ? eq(user.status, status) : undefined,
  );
  const [users, [total]] = await Promise.all([
    getDb()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        accessLevel: user.accessLevel,
        preferredMode: user.preferredMode,
      })
      .from(user)
      .where(condition)
      .orderBy(desc(user.createdAt))
      .limit(20)
      .offset((page - 1) * 20),
    getDb().select({ value: count() }).from(user).where(condition),
  ]);
  const pageLink = (p: number) =>
    `/admin/users?${new URLSearchParams({ q, status: status ?? "", page: String(p) })}`;
  return (
    <>
      <div className="page-heading">
        <h1>Community accounts</h1>
        <p className="muted">Find members and manage access responsibly.</p>
      </div>
      <section className="panel stack admin-list-panel">
        <form className="row admin-filter-form" method="get">
          <label className="field" style={{ flex: 2 }}>
            <span className="small">Search name or email</span>
            <input
              className="native-select"
              name="q"
              defaultValue={q}
              maxLength={100}
            />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span className="small">Account status</span>
            <select
              className="native-select"
              name="status"
              defaultValue={status ?? ""}
            >
              <option value="">All</option>
              <option>active</option>
              <option>suspended</option>
            </select>
          </label>
          <button
            className="link-button"
            type="submit"
            style={{ alignSelf: "end" }}
          >
            Search
          </button>
        </form>
        <p className="small muted">
          {total.value} accounts · Page {page}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Mode / access</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => (
                <tr key={member.id}>
                  <td>
                    <Link href={`/users/${member.id}/portfolio`}>
                      {member.name}
                    </Link>
                    <p className="small muted">{member.email}</p>
                  </td>
                  <td>
                    {member.preferredMode}
                    <p className="small muted">{member.accessLevel}</p>
                  </td>
                  <td>
                    <span className={`badge ${member.status}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    {member.accessLevel !== "administrator" ? (
                      <AdminAction
                        kind="user"
                        id={member.id}
                        status={member.status}
                      />
                    ) : (
                      "Protected admin"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="empty muted">No accounts match your search.</p>
          )}
        </div>
        <div className="row spread">
          {page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}
          {page * 20 < total.value && (
            <Link href={pageLink(page + 1)}>Next →</Link>
          )}
        </div>
      </section>
    </>
  );
}
