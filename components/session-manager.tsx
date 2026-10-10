"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { Button, Feedback } from "./ui";
import { MonitorSmartphone } from "lucide-react";
export function SessionManager() {
  const router = useRouter();
  const [sessions, setSessions] = useState<
      { id: string; userAgent: string | null; createdAt: string }[] | null
    >(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  async function load() {
    setPending(true);
    setError("");
    try {
      setSessions(await api("/api/sessions"));
    } catch (error) {
      setError(message(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel stack session-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Account security</p>
          <h2>Your active sessions</h2>
        </div>
        <div className="icon-tile">
          <MonitorSmartphone size={21} aria-hidden="true" />
        </div>
      </div>
      <p className="muted small">
        Review where you’re signed in. Revoking your current session will sign
        you out.
      </p>
      <Button variant="secondary" isDisabled={pending} onPress={load}>
        {pending ? "Loading…" : "Review sessions"}
      </Button>
      <Feedback error={error} />
      {sessions?.map((item) => (
        <div key={item.id} className="row spread session-row">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="small" style={{ overflowWrap: "anywhere" }}>
              {item.userAgent || "Unknown browser"}
            </p>
            <p className="muted small">
              Started {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={pending}
            onPress={async () => {
              setPending(true);
              setError("");
              try {
                await api(`/api/sessions/${item.id}`, { method: "DELETE" });
                setSessions(sessions.filter((s) => s.id !== item.id));
                router.refresh();
              } catch (error) {
                setError(message(error));
              } finally {
                setPending(false);
              }
            }}
          >
            Revoke
          </Button>
        </div>
      ))}
    </section>
  );
}
