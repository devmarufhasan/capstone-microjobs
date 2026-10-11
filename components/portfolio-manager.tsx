"use client";
/* eslint-disable @next/next/no-img-element -- Authorized application media route serves private images. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, FolderPlus, Plus } from "lucide-react";
import { Button, Field, Feedback, SubmitButton } from "./ui";
import { api, message, upload } from "@/lib/client";
import { ConfirmDialog } from "./confirm-dialog";
export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  projectUrl: string | null;
  projectDate: string | null;
  visibility: "private" | "public";
  mediaId: string | null;
  mediaMimeType: string | null;
};
function Editor({
  item,
  storage,
  onDone,
}: {
  item: PortfolioItem | null;
  storage: boolean;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="panel stack portfolio-editor">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Portfolio editor</p>
          <h2>
            {item ? "Edit your project" : "Add something you’re proud of"}
          </h2>
        </div>
        <div className="icon-tile">
          <FolderPlus size={20} aria-hidden="true" />
        </div>
      </div>
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            let mediaId = form.get("removeMedia")
              ? null
              : (item?.mediaId ?? null);
            const file = form.get("file");
            if (file instanceof File && file.size)
              mediaId = (await upload(file, "portfolio")).id;
            await api(`/api/portfolio${item ? `/${item.id}` : ""}`, {
              method: item ? "PATCH" : "POST",
              body: JSON.stringify({
                title: form.get("title"),
                description: form.get("description"),
                skills: String(form.get("skills"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                projectUrl: form.get("projectUrl"),
                projectDate: form.get("projectDate"),
                visibility: form.get("visibility"),
                mediaId,
              }),
            });
            onDone();
          } catch (error) {
            setError(message(error));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid-two">
          <Field
            label="Project title"
            name="title"
            defaultValue={item?.title ?? ""}
            minLength={2}
            maxLength={120}
            isRequired
          />
          <Field
            label="Project month (optional)"
            name="projectDate"
            type="month"
            defaultValue={item?.projectDate ?? ""}
          />
        </div>
        <Field
          label="Description"
          name="description"
          multiline
          defaultValue={item?.description ?? ""}
          isRequired
          minLength={10}
          maxLength={3000}
        />
        <Field
          label="Skills"
          name="skills"
          defaultValue={item?.skills.join(", ") ?? ""}
          hint="Separate up to 10 skills with commas."
        />
        <Field
          label="Project or work sample link (optional)"
          name="projectUrl"
          type="url"
          defaultValue={item?.projectUrl ?? ""}
        />
        <label className="field">
          <span>Project image, certificate, or work sample</span>
          <input
            type="file"
            name="file"
            className="file-input"
            accept="image/jpeg,image/png,application/pdf"
            disabled={!storage || pending}
          />
          <span className="small muted">
            JPEG, PNG, or PDF (up to 20 pages), up to 5 MB.{" "}
            {storage
              ? ""
              : "Uploads are temporarily unavailable; you can still add a project link."}
          </span>
        </label>
        {item?.mediaId && (
          <label className="row small">
            <input type="checkbox" name="removeMedia" /> Remove current file
          </label>
        )}
        <label className="field">
          <span>Who can see this?</span>
          <select
            className="native-select"
            name="visibility"
            defaultValue={item?.visibility ?? "private"}
          >
            <option value="private">
              Private — only me and authorized administrators
            </option>
            <option value="public">
              Public — anyone with my portfolio link
            </option>
          </select>
        </label>
        <Feedback error={error} />
        <div className="row">
          <SubmitButton pending={pending}>
            {item ? "Save changes" : "Add project"}
          </SubmitButton>
          <Button
            type="button"
            variant="secondary"
            onPress={onDone}
            isDisabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
export function PortfolioManager({
  items,
  userId,
  storage,
}: {
  items: PortfolioItem[];
  userId: string;
  storage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<PortfolioItem | null | undefined>(),
    [deleting, setDeleting] = useState<string | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const done = () => {
    setEditing(undefined);
    router.refresh();
  };
  async function move(index: number, direction: number) {
    const ids = items.map((i) => i.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    setPending(true);
    setError("");
    try {
      await api("/api/portfolio/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      router.refresh();
    } catch (error) {
      setError(message(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="row spread portfolio-toolbar">
        <Link
          href={`/users/${userId}/portfolio`}
          className="portfolio-public-link"
        >
          View public portfolio ↗
        </Link>
        <Button onPress={() => setEditing(null)}>
          <Plus size={18} /> Add project
        </Button>
      </div>
      <Feedback error={error} />
      {editing !== undefined && (
        <Editor
          key={editing?.id ?? "new"}
          item={editing}
          storage={storage}
          onDone={done}
        />
      )}
      {!items.length ? (
        <section className="panel empty">
          <FolderPlus size={42} />
          <h2>A blank canvas, full of potential.</h2>
          <p className="muted">
            Add a class project, a certificate or something you made just for
            fun. Your portfolio starts with one piece of work.
          </p>
          <Button onPress={() => setEditing(null)}>
            Add your first project
          </Button>
        </section>
      ) : (
        <div className="grid-two">
          {items.map((item, index) => (
            <article className="panel portfolio-card" key={item.id}>
              {item.mediaId && item.mediaMimeType === "application/pdf" && (
                <a href={`/api/media/${item.mediaId}`}>
                  Download PDF work sample ↗
                </a>
              )}
              {item.mediaId && item.mediaMimeType !== "application/pdf" && (
                <img
                  className="portfolio-image"
                  src={`/api/media/${item.mediaId}`}
                  alt={item.title}
                  loading="lazy"
                />
              )}
              <div className="row spread">
                <h2>{item.title}</h2>
                <span className={`badge ${item.visibility}`}>
                  {item.visibility}
                </span>
              </div>
              <p className="muted small">{item.description}</p>
              <div className="row">
                {item.skills.map((skill) => (
                  <span className="badge" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              {item.projectUrl && (
                <a
                  href={item.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="small"
                >
                  View project ↗
                </a>
              )}
              <div className="actions row">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setEditing(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setDeleting(item.id)}
                >
                  Delete
                </Button>
                <Button
                  aria-label={`Move ${item.title} up`}
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={!index || pending}
                  onPress={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  aria-label={`Move ${item.title} down`}
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={index === items.length - 1 || pending}
                  onPress={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this project?"
          description="It will be removed from your portfolio and public profile."
          pending={pending}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            setPending(true);
            setError("");
            try {
              await api(`/api/portfolio/${deleting}`, { method: "DELETE" });
              setDeleting(null);
              router.refresh();
            } catch (error) {
              setError(message(error));
              setDeleting(null);
            } finally {
              setPending(false);
            }
          }}
        />
      )}
    </>
  );
}
