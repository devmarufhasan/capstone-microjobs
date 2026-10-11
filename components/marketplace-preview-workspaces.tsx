"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  MessageCircle,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Field } from "./ui";
import {
  categories,
  demoConversations,
  demoOrders,
  type DemoOrder,
} from "@/lib/demo-marketplace";

export function ProjectBriefPreview() {
  const [title, setTitle] = useState("A poster for our campus event");
  const [category, setCategory] = useState("design");
  const [budget, setBudget] = useState("1000");
  const [timeline, setTimeline] = useState("3 days");
  const [description, setDescription] = useState(
    "We need a poster and a social post for a student event. The design should be clear, welcoming and easy to share.",
  );
  return (
    <div className="market-composer-grid">
      <section className="market-composer-card">
        <div className="market-composer-heading">
          <span className="market-composer-icon">
            <FileText size={23} aria-hidden="true" />
          </span>
          <div>
            <h2>Project brief</h2>
            <p>Explore the form; this draft stays in your browser.</p>
          </div>
        </div>
        <form
          className="market-composer-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <Field
            label="Project title"
            value={title}
            onChange={setTitle}
            maxLength={120}
          />
          <label className="field">
            <span>Category</span>
            <select
              className="native-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="What do you need?"
            multiline
            value={description}
            onChange={setDescription}
            maxLength={1000}
          />
          <div className="grid-two">
            <Field
              label="Sample budget (BDT)"
              type="number"
              value={budget}
              onChange={setBudget}
            />
            <Field
              label="Preferred timeline"
              value={timeline}
              onChange={setTimeline}
              maxLength={40}
            />
          </div>
          <button type="button" disabled className="market-composer-disabled">
            Publishing opens with the jobs module
          </button>
          <p className="market-composer-note">
            <ShieldAlert size={15} aria-hidden="true" /> Nothing is saved or
            sent to another user.
          </p>
        </form>
      </section>
      <aside className="market-composer-preview">
        <span className="market-page-demo-note">Live local preview</span>
        <h2>{title.trim() || "Your project title"}</h2>
        <p>
          {description.trim() || "Your brief will appear here as you type."}
        </p>
        <div className="market-job-skills">
          <span>
            {categories.find((item) => item.id === category)?.label ??
              "Category"}
          </span>
        </div>
        <div className="market-composer-preview-bottom">
          <span>
            <Clock3 size={17} aria-hidden="true" />{" "}
            {timeline.trim() || "Timeline"}
          </span>
          <strong>
            ৳{Number(budget || 0).toLocaleString("en-BD")}{" "}
            <small>sample budget</small>
          </strong>
        </div>
      </aside>
    </div>
  );
}

const orderLabels: Record<DemoOrder["stage"], string> = {
  in_progress: "In progress",
  delivered: "Delivered",
  completed: "Completed",
};
export function OrderPreview() {
  const [filter, setFilter] = useState<"all" | DemoOrder["stage"]>("all");
  const visible =
    filter === "all"
      ? demoOrders
      : demoOrders.filter((order) => order.stage === filter);
  return (
    <section className="market-preview-workspace">
      <div
        className="market-filter-chips"
        role="group"
        aria-label="Filter sample orders"
      >
        {(["all", "in_progress", "delivered", "completed"] as const).map(
          (stage) => (
            <button
              key={stage}
              type="button"
              className={filter === stage ? "active" : ""}
              aria-pressed={filter === stage}
              onClick={() => setFilter(stage)}
            >
              {stage === "all" ? "All sample orders" : orderLabels[stage]}
            </button>
          ),
        )}
      </div>
      <div className="market-order-list">
        {visible.map((order) => (
          <article className="market-order-card" key={order.id}>
            <span className="market-order-icon">
              <BriefcaseBusiness size={22} aria-hidden="true" />
            </span>
            <div>
              <div className="market-order-title">
                <h2>{order.title}</h2>
                <span className={`market-order-status ${order.stage}`}>
                  {orderLabels[order.stage]}
                </span>
              </div>
              <p className="market-order-counterpart">
                {order.counterpart} · Demo order
              </p>
              <p>{order.summary}</p>
              <Link href={`/explore/${order.serviceSlug}`}>
                View related sample service{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="market-preview-note">
        These cards show layout and status filtering only. No order, delivery or
        payment was created.
      </p>
    </section>
  );
}

export function MessagePreview() {
  const [selected, setSelected] = useState(demoConversations[0].id);
  const conversation = demoConversations.find((item) => item.id === selected)!;
  return (
    <section className="market-messages-preview">
      <aside className="market-message-list">
        <div className="market-message-list-heading">
          <MessageCircle size={19} aria-hidden="true" />
          <strong>Sample conversations</strong>
        </div>
        {demoConversations.map((thread) => (
          <button
            type="button"
            key={thread.id}
            className={selected === thread.id ? "active" : ""}
            onClick={() => setSelected(thread.id)}
          >
            <span className="market-message-avatar" aria-hidden="true">
              {thread.name.slice(0, 1)}
            </span>
            <span>
              <strong>{thread.name}</strong>
              <small>{thread.subject}</small>
            </span>
          </button>
        ))}
      </aside>
      <div className="market-message-thread">
        <header>
          <span className="market-message-avatar" aria-hidden="true">
            {conversation.name.slice(0, 1)}
          </span>
          <span>
            <strong>{conversation.name}</strong>
            <small>{conversation.role}</small>
          </span>
        </header>
        <div className="market-message-bubbles">
          {conversation.messages.map((item, index) => (
            <p
              key={`${conversation.id}-${index}`}
              className={item.from === "you" ? "from-you" : ""}
            >
              {item.text}
            </p>
          ))}
        </div>
        <div className="market-message-compose">
          <span>Messaging opens in a future module</span>
          <button type="button" disabled aria-label="Sending is unavailable">
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
