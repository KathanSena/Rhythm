export type SaleRow = {
  orderId: string;
  customerKey: string;
  productId: string;
  productName: string;
  quantity: number;
  orderedAt: string;
  unitPrice: number;
};

export type ShopperInsight = {
  customerKey: string;
  purchaseDays: string[];
  ordersBefore: number;
  lastOrder: string;
  daysSinceLast: number;
  usualDays: number;
  lateDays: number;
  thresholdDays: number;
  productName: string;
  productId: string;
  repeatCount: number;
  lastBasketValue: number;
  returnedWithin30: boolean | null;
};

export type Analysis = {
  asOf: string;
  maxDate: string;
  minDate: string;
  totalRows: number;
  totalOrders: number;
  totalShoppers: number;
  eligibleShoppers: number;
  overdue: ShopperInsight[];
  naturalReturnRate: number | null;
  validationCount: number;
  medianCadence: number;
  averageOrderValue: number;
};

export type ParseResult = { rows: SaleRow[]; warnings: string[] };

const NON_MERCHANDISE_CODES = new Set(["M", "POST", "DOT", "C2"]);
const NON_MERCHANDISE_NAMES = new Set([
  "MANUAL",
  "POST",
  "POSTAGE",
  "DOT",
  "DOTCOM POSTAGE",
  "CARRIAGE",
  "BANK CHARGES",
]);

export function parseSalesCsv(text: string): ParseResult {
  const matrix: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      matrix.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ""));
    matrix.push(row);
  }
  if (matrix.length < 2)
    throw new Error("The CSV needs a header row and at least one transaction.");
  const headers = matrix[0].map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, ""),
  );
  const aliases: Record<string, string[]> = {
    order: [
      "order_id",
      "invoice",
      "invoice_no",
      "invoiceno",
      "order",
      "transaction_id",
      "receipt_id",
    ],
    customer: [
      "customer_id",
      "customerid",
      "customer_key",
      "customer",
      "shopper_id",
      "buyer_id",
      "email",
    ],
    product: ["product_id", "stockcode", "sku", "product", "item_id"],
    name: ["product_name", "description", "item_name", "product_description"],
    quantity: ["quantity", "qty", "units"],
    date: [
      "ordered_at",
      "invoicedate",
      "invoice_date",
      "order_date",
      "date",
      "timestamp",
    ],
    price: ["unit_price", "unitprice", "price", "selling_price"],
  };
  const index = (key: string) =>
    headers.findIndex((h) => aliases[key].includes(h));
  const ix = {
    order: index("order"),
    customer: index("customer"),
    product: index("product"),
    name: index("name"),
    quantity: index("quantity"),
    date: index("date"),
    price: index("price"),
  };
  const missing = Object.entries(ix)
    .filter(([k, v]) => v < 0 && k !== "name")
    .map(([k]) => k);
  if (missing.length)
    throw new Error(
      "Missing required CSV columns: " +
        missing.join(", ") +
        ". Required: order ID, customer ID, product/SKU, quantity, date, and unit price.",
    );
  const warnings: string[] = [];
  const out: SaleRow[] = [];
  let rejected = 0;
  const dataRows = matrix.slice(1);
  const dateOrder = inferDateOrder(
    dataRows.map((values) => (values[ix.date] ?? "").trim()),
  );
  if (dateOrder.warning) warnings.push(dateOrder.warning);
  for (const values of dataRows) {
    const get = (n: number) => (n < 0 ? "" : (values[n] ?? "").trim());
    const orderId = get(ix.order);
    const customerKey = get(ix.customer);
    const productId = get(ix.product);
    const productName = get(ix.name) || productId;
    const quantity = Number(get(ix.quantity));
    const unitPrice = Number(get(ix.price).replace(/[£$,]/g, ""));
    const rawDate = get(ix.date);
    const orderedAt = normalizeDate(rawDate, dateOrder.order);
    if (
      !orderId ||
      !customerKey ||
      !productId ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice) ||
      !orderedAt ||
      quantity <= 0 ||
      unitPrice <= 0
    ) {
      rejected += 1;
      continue;
    }
    out.push({
      orderId,
      customerKey,
      productId,
      productName,
      quantity,
      orderedAt,
      unitPrice,
    });
  }
  if (!out.length)
    throw new Error(
      "No usable sales found. Check that the CSV has completed, positive-quantity transactions with dates and customer IDs.",
    );
  if (rejected)
    warnings.push(
      rejected.toLocaleString() +
        " rows skipped (returns, cancellations, or incomplete values).",
    );
  if (out.length > 300_000)
    warnings.push(
      "Large file loaded. Rhythm keeps processing in your browser; a smaller time range may feel faster.",
    );
  return { rows: out, warnings };
}

type DateOrder = "day-first" | "month-first";

function inferDateOrder(values: string[]): {
  order: DateOrder;
  warning: string | null;
} {
  let dayFirstEvidence = 0;
  let monthFirstEvidence = 0;
  let ambiguousCount = 0;
  for (const value of values) {
    const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s|$)/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12 && second <= 12) dayFirstEvidence += 1;
    else if (second > 12 && first <= 12) monthFirstEvidence += 1;
    else if (first <= 12 && second <= 12) ambiguousCount += 1;
  }
  if (dayFirstEvidence && monthFirstEvidence)
    return {
      order: "day-first",
      warning:
        "Mixed day/month date formats detected. Ambiguous dates are interpreted as day/month/year; check the source values.",
    };
  if (monthFirstEvidence)
    return { order: "month-first", warning: null };
  if (dayFirstEvidence)
    return { order: "day-first", warning: null };
  return {
    order: "day-first",
    warning: ambiguousCount
      ? "Ambiguous slash dates are interpreted as day/month/year. Check that this matches your export."
      : null,
  };
}

function normalizeDate(raw: string, order: DateOrder): string | null {
  if (!raw) return null;
  const match = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/,
  );
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);
    const valueOrder =
      first > 12 ? "day-first" : second > 12 ? "month-first" : order;
    const day = valueOrder === "day-first" ? first : second;
    const month = valueOrder === "day-first" ? second : first;
    const hour = Number(match[4] || 0);
    const minute = Number(match[5] || 0);
    const secondValue = Number(match[6] || 0);
    const millisecond = Number((match[7] || "").padEnd(3, "0").slice(0, 3));
    const timestamp = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      secondValue,
      millisecond,
    );
    const parsed = new Date(timestamp);
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day ||
      hour > 23 ||
      minute > 59 ||
      secondValue > 59
    )
      return null;
    return parsed.toISOString();
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

const dayNumber = (iso: string) =>
  Math.floor(Date.parse(iso.slice(0, 10) + "T00:00:00Z") / 86_400_000);
const dayText = (n: number) =>
  new Date(n * 86_400_000).toISOString().slice(0, 10);
function median(numbers: number[]): number {
  const sorted = numbers.slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function analyzeSales(
  rows: SaleRow[],
  requestedAsOf?: string,
): Analysis {
  let minDay = Number.POSITIVE_INFINITY;
  let maxDay = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    const day = dayNumber(row.orderedAt);
    minDay = Math.min(minDay, day);
    maxDay = Math.max(maxDay, day);
  }
  const maxSafeAsOf = maxDay - 30;
  const asOfDay = requestedAsOf
    ? Math.min(dayNumber(requestedAsOf), maxDay)
    : Math.max(minDay + 30, maxSafeAsOf);
  const asOf = dayText(asOfDay);
  const groups = new Map<
    string,
    Map<
      string,
      {
        day: number;
        value: number;
        products: Map<string, { name: string; qty: number }>;
      }
    >
  >();
  const allOrders = new Set<string>();
  for (const row of rows) {
    allOrders.add(row.orderId);
    const day = dayNumber(row.orderedAt);
    if (!groups.has(row.customerKey)) groups.set(row.customerKey, new Map());
    const orders = groups.get(row.customerKey)!;
    if (!orders.has(row.orderId))
      orders.set(row.orderId, { day, value: 0, products: new Map() });
    const order = orders.get(row.orderId)!;
    order.value += row.quantity * row.unitPrice;
    const product = order.products.get(row.productId) || {
      name: row.productName,
      qty: 0,
    };
    product.qty += row.quantity;
    order.products.set(row.productId, product);
  }
  const maxActual = dayText(maxDay);
  const canValidate = asOfDay + 30 <= maxDay;
  const insights: ShopperInsight[] = [];
  const eligibleCadences: number[] = [];
  let returnCount = 0;
  let validationCount = 0;
  let valueSum = 0;
  const lastBasketValues: number[] = [];
  for (const [customerKey, ordersMap] of groups) {
    const orders = Array.from(ordersMap.values()).sort((a, b) => a.day - b.day);
    const history = orders.filter((o) => o.day <= asOfDay);
    if (history.length < 4) continue;
    const distinctDays = Array.from(new Set(history.map((o) => o.day))).sort(
      (a, b) => a - b,
    );
    if (distinctDays.length < 4) continue;
    const gaps = distinctDays.slice(1).map((d, i) => d - distinctDays[i]);
    const usualDays = Math.max(1, Math.round(median(gaps)));
    const thresholdDays = Math.max(14, Math.ceil(usualDays * 1.6));
    const lastDay = distinctDays[distinctDays.length - 1];
    const daysSinceLast = Math.max(0, asOfDay - lastDay);
    eligibleCadences.push(usualDays);
    if (daysSinceLast <= thresholdDays) continue;
    const lateDays = daysSinceLast - thresholdDays;
    const lastOrder = history.filter((o) => o.day === lastDay).slice(-1)[0];
    const itemCounts = new Map<
      string,
      { id: string; name: string; dates: Set<number>; qty: number }
    >();
    for (const order of history)
      for (const [id, p] of order.products) {
        if (isNonMerchandiseItem(id, p.name)) continue;
        const entry = itemCounts.get(id) || {
          id,
          name: p.name,
          dates: new Set<number>(),
          qty: 0,
        };
        entry.dates.add(order.day);
        entry.qty += p.qty;
        itemCounts.set(id, entry);
      }
    const repeatItem = Array.from(itemCounts.values()).sort(
      (a, b) => b.dates.size - a.dates.size || b.qty - a.qty,
    )[0];
    const returned = canValidate
      ? orders.some((o) => o.day > asOfDay && o.day <= asOfDay + 30)
      : null;
    if (returned !== null) {
      validationCount += 1;
      if (returned) returnCount += 1;
    }
    lastBasketValues.push(lastOrder.value);
    valueSum += lastOrder.value;
    insights.push({
      customerKey,
      purchaseDays: distinctDays.map(dayText),
      ordersBefore: distinctDays.length,
      lastOrder: dayText(lastDay),
      daysSinceLast,
      usualDays,
      lateDays,
      thresholdDays,
      productName: repeatItem?.name || "",
      productId: repeatItem?.id || "",
      repeatCount: repeatItem?.dates.size || 0,
      lastBasketValue: lastOrder.value,
      returnedWithin30: returned,
    });
  }
  insights.sort((a, b) => b.lateDays - a.lateDays);
  const orderValueById = new Map<string, number>();
  for (const orderMap of groups.values())
    for (const [id, order] of orderMap) orderValueById.set(id, order.value);
  const averageOrderValue = orderValueById.size
    ? Array.from(orderValueById.values()).reduce((a, b) => a + b, 0) /
      orderValueById.size
    : 0;
  return {
    asOf,
    maxDate: maxActual,
    minDate: dayText(minDay),
    totalRows: rows.length,
    totalOrders: allOrders.size,
    totalShoppers: groups.size,
    eligibleShoppers: eligibleCadences.length,
    overdue: insights,
    naturalReturnRate: validationCount ? returnCount / validationCount : null,
    validationCount,
    medianCadence: Math.round(median(eligibleCadences)),
    averageOrderValue,
  };
}

function isNonMerchandiseItem(productId: string, productName: string): boolean {
  const code = productId.trim().toUpperCase();
  const name = productName.trim().toUpperCase().replace(/\s+/g, " ");
  return (
    NON_MERCHANDISE_CODES.has(code) ||
    NON_MERCHANDISE_NAMES.has(name)
  );
}

export function money(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
