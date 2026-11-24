"use client";

import Link from "next/link";
import { useState } from "react";
import type { Invoice, InvoiceStatus } from "../../../lib/api";
import {
  daysOverdue,
  formatDaysOverdue,
  formatDollars,
  INVOICE_FILTERS,
  INVOICE_FILTER_LABEL,
  invoiceFilterCounts,
  type InvoiceFilter,
  matchesInvoiceFilter,
} from "../../../lib/dashboard-metrics";
import { formatInvoiceDate } from "../../invoice/[id]/InvoiceView";
import { CheckIcon, CopyIcon, ExternalIcon, PlusIcon } from "./icons";

export interface InvoicesViewProps {
  invoices: Invoice[];
  loading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  filter?: InvoiceFilter;
  onFilter?: (f: InvoiceFilter) => void;
  onCreate?: () => void;
  onEdit?: (invoice: Invoice) => void;
  onCopy?: (id: string) => void;
  onDownloadPdf?: (invoice: Invoice) => void;
  copied?: string | null;
  now?: number;
}

function statusBadgeClass(status: InvoiceStatus): string {
  switch (status) {
    case "paid":
      return "badge badge--ok badge--paid";
    case "overdue":
      return "badge badge--bad badge--overdue";
    case "open":
      return "badge badge--wait badge--open";
    case "draft":
      return "badge badge--idle badge--draft";
    case "void":
      return "badge badge--idle badge--void";
    default:
      return "badge badge--idle";
  }
}

function statusLabel(status: InvoiceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function InvoiceRow({
  invoice,
  onEdit,
  onCopy,
  onDownloadPdf,
  copied,
  now,
}: {
  invoice: Invoice;
  onEdit?: (invoice: Invoice) => void;
  onCopy: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  copied: string | null;
  now: number;
}) {
  const isDraft = invoice.status === "draft";
  const isOverdue = invoice.status === "overdue" || (invoice.status === "open" && invoice.dueAt < now);
  const overdueDays = isOverdue ? daysOverdue(invoice.dueAt, now) : 0;
  const overdueText = isOverdue ? formatDaysOverdue(invoice.dueAt, now) : null;

  const assetCode =
    typeof invoice.asset === "string"
      ? invoice.asset
      : (invoice.asset?.code ?? invoice.assetCode ?? "USDC");
  const numTotal = Number(invoice.total);
  const formattedTotal =
    assetCode === "USDC" && Number.isFinite(numTotal)
      ? formatDollars(numTotal)
      : `${invoice.total} ${assetCode}`;

  return (
    <li
      className={`prow ${isOverdue ? "prow--overdue" : ""}`}
      style={isOverdue ? { borderLeft: "3px solid var(--bad, #dc2626)" } : undefined}
      data-testid={`invoice-row-${invoice.id}`}
    >
      <div className="prow__main">
        <span className="prow__title mono">{invoice.number || "Draft"}</span>
        <span className="prow__client">{invoice.clientName}</span>
        <div className="prow__sub">
          {overdueText ? (
            <span className="prow__overdue-note" style={{ color: "var(--bad, #dc2626)", fontWeight: 500 }}>
              {overdueText}
            </span>
          ) : (
            <span>Due {formatInvoiceDate(invoice.dueAt)}</span>
          )}
        </div>
      </div>

      <div className="prow__amount">
        <span className="prow__amt">{formattedTotal}</span>
      </div>

      <div className="prow__status">
        <span className={statusBadgeClass(invoice.status)}>{statusLabel(invoice.status)}</span>
      </div>

      <div className="prow__actions">
        {isDraft ? (
          <button type="button" className="chip" onClick={() => onEdit?.(invoice)}>
            Edit
          </button>
        ) : (
          <>
            <button type="button" className="chip" onClick={() => onCopy(invoice.id)}>
              {copied === invoice.id ? <CheckIcon /> : <CopyIcon />}
              {copied === invoice.id ? "Copied" : "Copy link"}
            </button>
            <a
              href={`/invoice/${invoice.id}`}
              className="chip"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalIcon /> Open
            </a>
            <button
              type="button"
              className="chip"
              onClick={() => onDownloadPdf(invoice)}
            >
              Download PDF
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function InvoicesView(props: InvoicesViewProps) {
  const {
    invoices,
    loading = false,
    fetchError = null,
    onRetry,
    onCreate,
    onEdit,
    onDownloadPdf,
    now = Date.now(),
  } = props;

  const [internalFilter, setInternalFilter] = useState<InvoiceFilter>("all");
  const [internalCopied, setInternalCopied] = useState<string | null>(null);

  const activeFilter = props.filter ?? internalFilter;
  const setActiveFilter = props.onFilter ?? setInternalFilter;
  const copied = props.copied !== undefined ? props.copied : internalCopied;

  const handleCopy = (id: string) => {
    if (props.onCopy) {
      props.onCopy(id);
    } else {
      const url = `${window.location.origin}/invoice/${id}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      setInternalCopied(id);
      setTimeout(() => setInternalCopied(null), 2000);
    }
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    if (onDownloadPdf) {
      onDownloadPdf(invoice);
    } else {
      window.open(`/invoice/${invoice.id}`, "_blank");
    }
  };

  const counts = invoiceFilterCounts(invoices);
  const shown = invoices.filter((inv) => matchesInvoiceFilter(inv, activeFilter));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Invoices</h1>
          <p className="page-head__sub">Bill clients with line items and on-chain checkout.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onCreate}>
          <PlusIcon /> New invoice
        </button>
      </header>

      <div className="filters" role="group" aria-label="Filter invoices">
        {INVOICE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="filter"
            aria-pressed={activeFilter === f}
            onClick={() => setActiveFilter(f)}
          >
            {INVOICE_FILTER_LABEL[f]}
            <span className="filter__n">{counts[f]}</span>
          </button>
        ))}
      </div>

      <section className="card card--flush" aria-label="Invoices">
        {loading && invoices.length === 0 && (
          <ul className="plist" aria-hidden>
            {[1, 2, 3].map((i) => (
              <li key={i} className="prow prow--skel">
                <span className="skeleton skeleton--w140" />
                <span className="skeleton skeleton--w80" />
                <span className="skeleton skeleton--w60" />
                <span className="skeleton skeleton--w90" />
              </li>
            ))}
          </ul>
        )}

        {fetchError && (
          <div className="error-banner" role="alert" style={{ margin: 16 }}>
            <p className="error-banner__text">{fetchError}</p>
            {onRetry && (
              <button type="button" className="btn btn--ghost" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !fetchError && invoices.length === 0 && (
          <div className="empty empty--rich">
            <strong>No invoices yet</strong>
            <p>Bill a client with line items, a due date and on-chain checkout.</p>
            <button type="button" className="btn btn--primary" onClick={onCreate}>
              <PlusIcon /> New invoice
            </button>
          </div>
        )}

        {invoices.length > 0 && shown.length === 0 && (
          <div className="empty empty--rich">
            <strong>Nothing here</strong>
            <p>No invoices match this filter.</p>
          </div>
        )}

        {shown.length > 0 && (
          <ul className="plist">
            {shown.map((inv) => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                onEdit={onEdit}
                onCopy={handleCopy}
                onDownloadPdf={handleDownloadPdf}
                copied={copied}
                now={now}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
