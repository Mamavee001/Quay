// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InvoicesView from "../app/components/dashboard/InvoicesView";
import type { Invoice } from "../lib/api";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const NOW = 1730548800000; // Fixed timestamp
const DAY = 86_400_000;

function makeInvoice(over: Partial<Invoice>): Invoice {
  return {
    id: "inv_1",
    number: "INV-0001",
    clientName: "Acme Corp",
    total: "100.00",
    asset: "USDC",
    status: "open",
    dueAt: NOW + 7 * DAY,
    issuedAt: NOW,
    lineItems: [{ description: "Consulting", quantity: 1, unitPrice: "100.00" }],
    linkId: "lnk_1",
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

describe("InvoicesView (issue 5.54)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const testInvoices: Invoice[] = [
    makeInvoice({ id: "inv_draft", number: null, status: "draft", dueAt: NOW + 5 * DAY }),
    makeInvoice({ id: "inv_open", number: "INV-0002", status: "open", dueAt: NOW + 3 * DAY }),
    makeInvoice({ id: "inv_overdue", number: "INV-0003", status: "overdue", dueAt: NOW - 3 * DAY }),
    makeInvoice({ id: "inv_paid", number: "INV-0004", status: "paid", dueAt: NOW - 1 * DAY }),
    makeInvoice({ id: "inv_void", number: "INV-0005", status: "void", dueAt: NOW + 10 * DAY }),
  ];

  it("renders filter buttons with correct counts", () => {
    act(() => {
      root.render(<InvoicesView invoices={testInvoices} now={NOW} />);
    });

    const filterButtons = container.querySelectorAll(".filter");
    expect(filterButtons).toHaveLength(6);

    const textContent = Array.from(filterButtons).map((btn) => btn.textContent);
    expect(textContent).toContain("All5");
    expect(textContent).toContain("Draft1");
    expect(textContent).toContain("Open1");
    expect(textContent).toContain("Overdue1");
    expect(textContent).toContain("Paid1");
    expect(textContent).toContain("Void1");
  });

  it("filters rows when filter is clicked", () => {
    act(() => {
      root.render(<InvoicesView invoices={testInvoices} now={NOW} />);
    });

    // Initially "all" shows 5 rows
    expect(container.querySelectorAll(".prow")).toHaveLength(5);

    // Click "Draft" filter
    const draftButton = Array.from(container.querySelectorAll(".filter")).find((b) =>
      b.textContent?.includes("Draft"),
    ) as HTMLButtonElement;

    act(() => {
      draftButton.click();
    });

    const rows = container.querySelectorAll(".prow");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain("Draft");
  });

  it("renders overdue rows with 'Overdue by N days' and distinct styling", () => {
    act(() => {
      root.render(<InvoicesView invoices={testInvoices} now={NOW} />);
    });

    const overdueRow = container.querySelector('[data-testid="invoice-row-inv_overdue"]');
    expect(overdueRow).not.toBeNull();
    expect(overdueRow?.className).toContain("prow--overdue");
    expect(overdueRow?.textContent).toContain("Overdue by 3 days");
  });

  it("shows Edit ONLY for draft invoices; Copy link and PDF ONLY for issued invoices", () => {
    const onEdit = vi.fn();
    const onCopy = vi.fn();
    const onDownloadPdf = vi.fn();

    act(() => {
      root.render(
        <InvoicesView
          invoices={testInvoices}
          onEdit={onEdit}
          onCopy={onCopy}
          onDownloadPdf={onDownloadPdf}
          now={NOW}
        />,
      );
    });

    // Draft row
    const draftRow = container.querySelector('[data-testid="invoice-row-inv_draft"]');
    expect(draftRow?.textContent).toContain("Edit");
    expect(draftRow?.textContent).not.toContain("Copy link");
    expect(draftRow?.textContent).not.toContain("Download PDF");

    const editBtn = draftRow?.querySelector("button");
    act(() => {
      editBtn?.click();
    });
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "inv_draft" }));

    // Issued row (e.g. open)
    const openRow = container.querySelector('[data-testid="invoice-row-inv_open"]');
    expect(openRow?.textContent).not.toContain("Edit");
    expect(openRow?.textContent).toContain("Copy link");
    expect(openRow?.textContent).toContain("Download PDF");
    expect(openRow?.textContent).toContain("Open");

    const copyBtn = Array.from(openRow?.querySelectorAll("button") || []).find((b) =>
      b.textContent?.includes("Copy link"),
    );
    act(() => {
      copyBtn?.click();
    });
    expect(onCopy).toHaveBeenCalledWith("inv_open");

    const pdfBtn = Array.from(openRow?.querySelectorAll("button") || []).find((b) =>
      b.textContent?.includes("Download PDF"),
    );
    act(() => {
      pdfBtn?.click();
    });
    expect(onDownloadPdf).toHaveBeenCalledWith(expect.objectContaining({ id: "inv_open" }));
  });

  it("shows empty state with 'New invoice' button that calls onCreate", () => {
    const onCreate = vi.fn();

    act(() => {
      root.render(<InvoicesView invoices={[]} onCreate={onCreate} now={NOW} />);
    });

    expect(container.textContent).toContain("No invoices yet");
    const newBtn = Array.from(container.querySelectorAll(".btn--primary")).find((b) =>
      b.textContent?.includes("New invoice"),
    ) as HTMLButtonElement;
    expect(newBtn).toBeDefined();

    act(() => {
      newBtn.click();
    });
    expect(onCreate).toHaveBeenCalled();
  });
});
