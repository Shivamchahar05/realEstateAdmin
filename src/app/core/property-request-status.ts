export type PropertyRequestStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'VISIT_SCHEDULED'
  | 'VISITED'
  | 'READY_TO_BUY'
  | 'TOKEN_ACCEPTED'
  | 'DEAL_CLOSED'
  | 'CANCELLED';

export const PROPERTY_REQUEST_FLOW: PropertyRequestStatus[] = [
  'NEW',
  'CONTACTED',
  'VISIT_SCHEDULED',
  'VISITED',
  'READY_TO_BUY',
  'TOKEN_ACCEPTED',
  'DEAL_CLOSED',
];

export const PROPERTY_REQUEST_STATUS_LABELS: Record<PropertyRequestStatus, string> = {
  NEW: 'Request submitted',
  CONTACTED: 'Buyer contacted',
  VISIT_SCHEDULED: 'Visit scheduled',
  VISITED: 'Visit completed',
  READY_TO_BUY: 'Ready to buy',
  TOKEN_ACCEPTED: 'Token accepted',
  DEAL_CLOSED: 'Deal closed',
  CANCELLED: 'Cancelled',
};

/** Short step names for the progress rail */
export const PROPERTY_REQUEST_STEP_SHORT: Record<
  Exclude<PropertyRequestStatus, 'CANCELLED'>,
  string
> = {
  NEW: 'Request',
  CONTACTED: 'Contact',
  VISIT_SCHEDULED: 'Visit set',
  VISITED: 'Visited',
  READY_TO_BUY: 'Ready',
  TOKEN_ACCEPTED: 'Token',
  DEAL_CLOSED: 'Closed',
};

/** Primary CTA when advancing TO this status */
export const PROPERTY_REQUEST_ADVANCE_ACTIONS: Partial<
  Record<PropertyRequestStatus, { button: string; hint: string }>
> = {
  CONTACTED: {
    button: 'Mark as contacted',
    hint: 'Buyer has been reached — call / WhatsApp confirmed',
  },
  VISIT_SCHEDULED: {
    button: 'Mark visit scheduled',
    hint: 'Site visit date and time have been fixed',
  },
  VISITED: {
    button: 'Mark visit completed',
    hint: 'Buyer has completed the property visit',
  },
  READY_TO_BUY: {
    button: 'Mark ready to buy',
    hint: 'After the visit, buyer is ready to purchase',
  },
  TOKEN_ACCEPTED: {
    button: 'Mark token accepted',
    hint: 'Booking token / advance has been received',
  },
  DEAL_CLOSED: {
    button: 'Mark deal closed',
    hint: 'Deal complete — registration / handover done',
  },
};

export function propertyRequestStatusLabel(status: string): string {
  if (status === 'CLOSED') return PROPERTY_REQUEST_STATUS_LABELS.CANCELLED;
  return PROPERTY_REQUEST_STATUS_LABELS[status as PropertyRequestStatus] ?? status;
}

export function nextPropertyRequestStatus(status: string): PropertyRequestStatus | null {
  const current = status === 'CLOSED' ? 'CANCELLED' : status;
  if (current === 'DEAL_CLOSED' || current === 'CANCELLED') return null;
  const idx = PROPERTY_REQUEST_FLOW.indexOf(current as PropertyRequestStatus);
  if (idx < 0 || idx >= PROPERTY_REQUEST_FLOW.length - 1) return null;
  return PROPERTY_REQUEST_FLOW[idx + 1]!;
}

export function advanceActionFor(status: string): { button: string; hint: string } | null {
  const next = nextPropertyRequestStatus(status);
  if (!next) return null;
  return PROPERTY_REQUEST_ADVANCE_ACTIONS[next] ?? { button: `Mark ${propertyRequestStatusLabel(next)}`, hint: '' };
}

export function flowStepIndex(status: string): number {
  const current = status === 'CLOSED' ? 'CANCELLED' : status;
  if (current === 'CANCELLED') return -1;
  return PROPERTY_REQUEST_FLOW.indexOf(current as PropertyRequestStatus);
}
