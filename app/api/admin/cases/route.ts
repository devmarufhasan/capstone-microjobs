import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";
import { moderationCase, user } from "@/lib/db/schema";
import { json, requireUser, route } from "@/lib/http";

export async function GET(request: Request) {
  return route(async () => {
    await requireUser(request, true);
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const page = Math.max(
      1,
      Math.min(
        10000,
        Number.parseInt(url.searchParams.get("page") ?? "1") || 1,
      ),
    );
    const reporter = alias(user, "case_reporter"),
      subject = alias(user, "case_subject");
    const rows = await getDb()
      .select({
        case: moderationCase,
        reporter: {
          id: reporter.id,
          name: reporter.name,
          email: reporter.email,
        },
        subject: { id: subject.id, name: subject.name, email: subject.email },
      })
      .from(moderationCase)
      .innerJoin(reporter, eq(reporter.id, moderationCase.reporterId))
      .innerJoin(subject, eq(subject.id, moderationCase.subjectUserId))
      .where(
        and(
          type === "report" || type === "dispute"
            ? eq(moderationCase.type, type)
            : undefined,
          status === "open" ||
            status === "under_review" ||
            status === "resolved" ||
            status === "rejected"
            ? eq(moderationCase.status, status)
            : undefined,
        ),
      )
      .orderBy(desc(moderationCase.createdAt))
      .limit(20)
      .offset((page - 1) * 20);
    return json(rows);
  });
}
