# App.tsx Refactor Handoff

## Purpose

`frontend/src/App.tsx` is currently acting as the main application shell, data loader, workflow controller, dashboard view, order table, live event feed, print view, and modal coordinator. It is about 1,200+ lines and mixes many responsibilities in one component.

This document is a handoff plan for another agent to refactor it safely. Do not change behavior while splitting the file. Keep each step small enough to review independently.

## Current File

- Target: `frontend/src/App.tsx`
- Current size observed: about 1,242 lines
- Existing related components:
  - `frontend/src/components/CreateOrderModal.tsx`
  - `frontend/src/components/ChangeRequestModal.tsx`
  - `frontend/src/components/CancelOrderModal.tsx`
  - `frontend/src/components/PartnerHandshakeModal.tsx`
  - `frontend/src/components/SubcontractModal.tsx`
  - `frontend/src/components/OrderDetailModal.tsx`
  - `frontend/src/components/MultiOrderDetailModal.tsx`
  - `frontend/src/components/print/PrintInvoice.tsx`
  - `frontend/src/components/print/PrintLabel.tsx`
  - `frontend/src/components/pipeline/PipelineTimeline.tsx`
  - `frontend/src/components/layout/SystemAlerts.tsx`

## Constraints

- Preserve existing runtime behavior.
- Do not rename API endpoints or response fields.
- Do not change UI styling unless required by extraction.
- Do not introduce new state management libraries.
- Prefer moving code first, then improving types in follow-up steps.
- Keep `App.tsx` as the page-level orchestrator.
- Avoid one giant refactor commit. Split into small commits or PRs if possible.

## High-Value Extraction Targets

### 1. API client and auth helpers

Move repeated fetch/auth logic out of `App.tsx`.

Suggested files:

- `frontend/src/api/client.ts`
- `frontend/src/api/orders.ts`
- `frontend/src/api/processTemplates.ts`
- `frontend/src/api/notifications.ts`
- `frontend/src/api/products.ts`
- `frontend/src/api/partners.ts`
- `frontend/src/api/subcontracts.ts`
- `frontend/src/api/metalPrices.ts`

Likely moved code:

- `getAuthHeaders`
- order list fetch
- order stats fetch
- order detail fetch
- order invoice fetch
- order cancel estimate fetch
- order cancel submit
- order advance-stage submit
- process template fetch
- product list fetch
- handshake request/verify/fetch
- business verify
- subcontract list/dispatch/receive
- notifications fetch/read
- recent metal prices fetch

Acceptance criteria:

- `App.tsx` no longer contains raw endpoint strings for most ordinary API calls.
- Unauthorized order list behavior still redirects to `/login`.
- Existing toast behavior remains in the caller or hook, not hidden inside generic API helpers.

### 2. Print rendering and print workflow

`App.tsx` contains inline print views even though print components already exist.

Suggested files:

- Reuse/update `frontend/src/components/print/PrintInvoice.tsx`
- Reuse/update `frontend/src/components/print/PrintLabel.tsx`
- Add `frontend/src/components/print/PrintView.tsx`
- Add `frontend/src/hooks/useOrderPrint.ts`

Likely moved code:

- `printOrder`
- `printMode`
- `handlePrint`
- label print JSX
- invoice print JSX

Important note:

- The inline label/invoice JSX in `App.tsx` appears more complete than the existing `PrintLabel.tsx` in some places. Compare before replacing.
- `PrintInvoice.tsx` already duplicates much of the inline invoice markup. Prefer using the existing component after confirming parity.

Acceptance criteria:

- `App.tsx` renders something like `<PrintView printOrder={printOrder} printMode={printMode} />`.
- Printing label and invoice still works.
- Invoice B2B settlement block still renders when `printOrder.invoice && printOrder.orderType === 'B2B'`.

### 3. Pipeline and stage utilities

Pipeline logic is mixed across top-level helpers and render templates.

Suggested files:

- `frontend/src/utils/pipeline.ts`
- `frontend/src/components/pipeline/PipelineStatusBadge.tsx`
- Possibly reuse `frontend/src/components/pipeline/PipelineTimeline.tsx`

Likely moved code:

- `formatElapsed`
- `getTimelineEvents`
- `getEventBorderColor`
- `getEventStageInfo`
- `statusBodyTemplate` badge logic, or at least its normalization logic
- pipeline step count calculation used in the dashboard pipeline visualizer

Acceptance criteria:

- Stage normalization is in one place.
- `PENDING`, `CASTING`, `POLISHING`, `COMPLETED`, `DONE`, Korean stage names, and custom template stages still map correctly.
- Existing custom pipeline colors/gradients still apply.

### 4. Order table

The order `DataTable` is a good standalone component.

Suggested file:

- `frontend/src/components/orders/OrderTable.tsx`

Props likely needed:

- `orders`
- `selectedOrderId`
- `onSelectOrder`
- `onOpenOrderDetail`
- `statusBodyTemplate` or a new `PipelineStatusBadge`

Acceptance criteria:

- Row selection still opens order details.
- Eye button still opens details without triggering unwanted row behavior.
- Image preview behavior remains unchanged.
- Pagination, empty message, row class, and columns remain visually equivalent.

### 5. Dashboard metrics and side widgets

The left panel can be extracted without changing behavior.

Suggested file:

- `frontend/src/components/dashboard/DashboardSidebar.tsx`

Props likely needed:

- `orders`
- `todayGold`
- `yesterdayGold`
- `delta24k`
- `goldPriceData`
- `onOpenGoldTools`

Acceptance criteria:

- Active/completed order counts match prior behavior.
- `GoldWidget`, `PetroleumChart`, and `KospiChart` still render in the same order.

### 6. Pipeline visualizer panel

The right-side pipeline count visualization can be extracted.

Suggested file:

- `frontend/src/components/pipeline/PipelineOverview.tsx`

Props likely needed:

- `orders`
- `pipelineSteps`

Acceptance criteria:

- Counts per stage match previous inline logic.
- Completed orders still count under the final/completed stage.
- Custom process template colors still apply.

### 7. Live event feed

The live feed has both list and card modes and should be its own component.

Suggested files:

- `frontend/src/components/events/LiveEventFeed.tsx`
- `frontend/src/hooks/useNotifications.ts`
- `frontend/src/hooks/useStompNotifications.ts`

Props likely needed for component-only extraction:

- `events`
- `feedViewMode`
- `onFeedViewModeChange`
- `onEventClick`
- `getEventStageInfo`

Acceptance criteria:

- List/card toggle remains unchanged.
- Unread state and `NEW` badge/dot remain unchanged.
- Clicking an event marks it read and opens the order when `orderId` exists.
- STOMP updates still prepend new events and cap the list at 50.

### 8. Modal orchestration

`App.tsx` renders many modal components and passes many props. Extracting one coordinator can reduce visual noise after the business hooks are separated.

Suggested file:

- `frontend/src/components/AppModals.tsx`

Likely included:

- `CreateOrderModal`
- `ChangeRequestModal`
- `CancelOrderModal`
- `PartnerHandshakeModal`
- `SubcontractModal`
- `OrderDetailModal`
- `MultiOrderDetailModal`
- `ProcessManager`
- `GoldToolsModal`

Important note:

- `ProcessManager` appears twice near the bottom of `App.tsx`. Verify whether this is accidental duplication before extracting.

Acceptance criteria:

- Every modal opens/closes exactly as before.
- Closing `ProcessManager` still refreshes orders and pipeline stages where needed.
- Detail modal still switches between `OrderDetailModal` and `MultiOrderDetailModal` for grouped/multi-order data.

### 9. Business workflow hooks

After the UI pieces are separated, move related state and handlers into hooks.

Suggested files:

- `frontend/src/hooks/useOrders.ts`
- `frontend/src/hooks/useCreateOrderForm.ts`
- `frontend/src/hooks/usePartnerHandshake.ts`
- `frontend/src/hooks/useSubcontracts.ts`
- `frontend/src/hooks/useOrderActions.ts`
- `frontend/src/hooks/useGoldPrices.ts`

Likely ownership:

- `useOrders`: orders, dashboard stats, selected order id, fetch orders, open detail
- `useCreateOrderForm`: product search, form state, submit create order
- `usePartnerHandshake`: handshakes, PIN state, business number/result, request/verify
- `useSubcontracts`: subcontract modal state, subcontract form, dispatch/receive
- `useOrderActions`: advance stage, cancel, change/hold
- `useGoldPrices`: gold price data and delta calculations

Acceptance criteria:

- Hooks do not render UI.
- Hooks expose stable, named handlers and state.
- Toast calls can stay in hooks if the hook receives `toastRef`, but keep that decision consistent.

### 10. Types

There are many `any` values. Add types gradually after code is moved.

Suggested files:

- `frontend/src/types/order.ts`
- `frontend/src/types/pipeline.ts`
- `frontend/src/types/notification.ts`
- `frontend/src/types/partner.ts`
- `frontend/src/types/subcontract.ts`
- `frontend/src/types/product.ts`
- `frontend/src/types/metalPrice.ts`

Start with permissive optional fields to avoid breaking existing partial API responses.

Acceptance criteria:

- New components/hooks use named types instead of introducing more `any`.
- Do not attempt to type the whole app in the same pass as the first extraction.

## Suggested Refactor Sequence

1. Extract print view components and hook.
2. Extract API helpers with minimal call-site changes.
3. Extract pipeline utilities and status badge.
4. Extract `OrderTable`.
5. Extract `DashboardSidebar` and `PipelineOverview`.
6. Extract `LiveEventFeed`.
7. Extract `AppModals`.
8. Move business state/handlers into hooks.
9. Add shared types.
10. Run final cleanup of unused imports and duplicate `ProcessManager` rendering.

## Verification Checklist

Run these after each extraction step:

- TypeScript build or frontend build succeeds.
- App loads the dashboard.
- Unauthenticated response still redirects to `/login`.
- Orders list renders and selecting a row opens details.
- Create order modal opens, product autocomplete still filters.
- Partner invite modal opens and PIN actions still call APIs.
- Subcontract modal opens and dispatch/receive still call APIs.
- Cancel modal opens and submit refreshes orders.
- Advance stage still refreshes order detail or opens process manager when no template exists.
- Live event feed renders both list and card modes.
- STOMP connection still updates feed and refreshes orders.
- Label print works.
- Invoice print works, including B2B invoice data.
- Gold tools modal still receives `goldPriceData`.

## Known Risks

- `App.tsx` uses `toast.current?.show` in many handlers. Moving API calls too far down can hide UI feedback and make error handling inconsistent.
- Several fetch calls assume JSON without checking auth or HTML login redirects. Preserve behavior first, then standardize response handling later.
- Existing `PrintInvoice.tsx` and inline invoice markup may diverge. Compare carefully before deleting inline markup.
- Existing `PrintLabel.tsx` looks simpler than the inline label markup. Do not replace inline label with the existing component unless feature parity is restored.
- `ProcessManager` appears rendered twice. Removing one may be correct, but verify behavior before changing.
- Many state variables are tightly coupled through `selectedOrderId`; extracting hooks too early may create awkward prop drilling. Extract presentational components first.

## Target End State

`App.tsx` should eventually look like a page shell:

- initialize top-level hooks
- render header
- render dashboard/sidebar
- render pipeline overview
- render order table
- render live event feed
- render modal coordinator
- render print view

The final `App.tsx` should ideally be under 300-400 lines while preserving the same behavior.
