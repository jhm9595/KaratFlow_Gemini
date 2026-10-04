# Process Template Flow Handoff

## Purpose

This document explains the current process-template flow in KaratFlow and gives a concrete implementation plan to make process templates flow coherently through:

- template management
- order creation
- work order stage state
- dashboard/grid display
- detail timeline
- next-stage advancement
- mid-process template changes

The main business requirement is:

> A selected process template must flow organically through every screen and workflow. If a work order uses a specific template, dashboard badges, pipeline counts, detail timelines, and next-stage actions should all use that same template, not a global template by accident.

## Current Structure

### Template management

Frontend:

- `frontend/src/ProcessManager.tsx`

Backend:

- `backend/src/main/java/com/minibig/karatflow/backend/web/ProcessTemplateController.java`
- `backend/src/main/java/com/minibig/karatflow/backend/service/ProcessTemplateService.java`
- `backend/src/main/java/com/minibig/karatflow/backend/domain/ProcessTemplate.java`
- `backend/src/main/java/com/minibig/karatflow/backend/domain/ProcessTemplateStep.java`

Current API:

```text
GET    /api/process-templates
POST   /api/process-templates
PUT    /api/process-templates/{id}
PUT    /api/process-templates/{id}/set-default
DELETE /api/process-templates/{id}
```

`ProcessManager` can create, edit, delete, and mark a template as default.

### Order creation

File:

- `backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java`

Current behavior:

1. `createOrder` finds the default `ProcessTemplate`.
2. It uses the first template step as initial stage.
3. It creates one `WorkOrder` per quantity.
4. Each `WorkOrder` stores:
   - `template`
   - `currentStage`
   - `isHold`
   - `createdAt`

This part is mostly correct: a work order gets the default template at creation time.

### Next-stage advancement

File:

- `backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java`

Important methods:

- `advanceOrderStage`
- `getEffectiveTemplate`
- `getCurrentStep`
- `nextStage`
- `recordHistory`

Current behavior:

1. `advanceOrderStage(orderId)` loads all work orders for the order.
2. It picks the first incomplete work order.
3. It resolves the work order's effective template.
4. It finds the next step in that template.
5. It updates `currentStage`.
6. It records history.
7. If the new stage is the last stage, the order status becomes `COMPLETED`.

This means backend progression is generally template-driven.

### Dashboard and grid display

Frontend:

- `frontend/src/App.tsx`
- `frontend/src/components/orders/OrderTable.tsx`
- `frontend/src/components/pipeline/PipelineStatusBadge.tsx`
- `frontend/src/components/pipeline/PipelineOverview.tsx`

Current behavior:

1. `App.tsx` fetches all templates.
2. It picks the current default template.
3. It stores that template's steps in `pipelineSteps` and `pipelineStages`.
4. `OrderTable`, `PipelineStatusBadge`, and `PipelineOverview` use those global default steps.

This is the biggest mismatch:

- A work order can be using template A.
- The screen can color/count it using default template B.
- Existing work orders do not necessarily use the current default template.

### Detail timeline

Frontend:

- `frontend/src/components/OrderDetailModal.tsx`
- `frontend/src/components/MultiOrderDetailModal.tsx`

Backend:

- `OrderService.getOrderDetails`

Current backend behavior:

- `getOrderDetails` uses `getEffectiveTemplate(firstWorkOrder)` to build timeline events.
- This is better than the dashboard because it uses the work order's template.

Current frontend behavior:

- Detail modals still receive global `pipelineStages` and `pipelineSteps` from `App.tsx`.
- Some timeline events come from backend, but colors and summary stage filters use the global steps.

So detail display is partially template-aware but not fully coherent.

## Current Problems

### Problem 1. Global default template is used as display truth

`App.tsx` fetches the default template and sends that everywhere:

```ts
const defaultTpl = templates.find(t => t.isDefault) || templates[0];
setPipelineSteps(defaultTpl.steps);
setPipelineStages(defaultTpl.steps.map(s => s.stageName));
```

This is fine for "global dashboard default layout", but not fine for rendering each order's actual process state.

If an old order was created with "표준 5단계" and the admin later changes default to "자체 간편 공정", that old order still points to the old template in backend. But dashboard badges and counts may use the new default template.

### Problem 2. Existing orders do not automatically follow default-template changes

This is actually a good default behavior. Changing the default should affect new orders, not automatically rewrite existing work-in-progress orders.

But the UI currently does not make this clear.

Need to distinguish:

- "default template for new orders"
- "template assigned to this existing work order"

### Problem 3. Editing a template can mutate active work orders

`WorkOrder` references `ProcessTemplate`.

`ProcessTemplateService.updateTemplate` deletes existing steps and saves new steps:

```java
processTemplateStepRepository.deleteAll(existing.getSteps());
existing.getSteps().clear();
```

Risk:

- Active work orders that use that template will suddenly see a changed step list.
- If their current stage no longer exists, `getCurrentStep` can reset `currentStage` to the first step.

This is dangerous for production process tracking.

### Problem 4. `getCurrentStep` can silently rewrite invalid stages

Current behavior:

If the work order's `currentStage` does not exist in the template, `getCurrentStep` sets it to the first step and saves it.

This can hide data problems:

- template changed
- stage name changed
- work order migrated incorrectly

For a workflow system, this should not be silent.

### Problem 5. Multi-order individual advancement may call the wrong endpoint

`MultiOrderDetailModal` calls:

```ts
advanceStage(r.id || rowData.id)
```

But App's `advanceStage` calls:

```text
POST /api/orders/{orderId}/advance-stage
```

If `r.id` is a work order id, it is being passed to an order-level endpoint. This can advance the wrong order or fail unexpectedly.

Need separate APIs:

- advance entire order: `POST /api/orders/{orderId}/advance-stage`
- advance one work order: `POST /api/work-orders/{workOrderId}/advance-stage`

### Problem 6. Dashboard query does not expose template identity

`OrderRepository.findDashboardOrders` returns stage and hold state, but not:

- workOrderId
- templateId
- templateName
- template steps

Without at least template metadata, frontend cannot render per-order template status correctly.

## Desired Model

### Core principle

Each work order has its own assigned process template.

The UI should render a work order using the work order's assigned template.

The default template should be used only:

- when creating a new order and no template is explicitly chosen
- as a fallback when old data has no template
- for generic global UI only when no specific work order is selected

## Recommended Data Model Changes

### 1. Preserve template assignment on WorkOrder

Already exists:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "template_id")
private ProcessTemplate template;
```

Keep this.

### 2. Add stable step identity to history

Current `WorkOrderHistory` stores:

- `stepName`
- `stepOrder`
- `completedAt`

Recommended additions:

- `templateId`
- `templateNameSnapshot`
- `stepId`
- `stageNameSnapshot`
- `stageCodeSnapshot`

Why:

- If a template is edited later, old history should still show what actually happened at that time.
- Relying only on mutable `stepName` is fragile.

Minimum viable addition:

```java
private Long templateId;
private Long stepId;
private String stageNameSnapshot;
```

### 3. Consider template versioning

Best long-term model:

- Editing a template should create a new version.
- Active work orders keep their original template version.
- New orders use the latest default version.

Possible fields:

`ProcessTemplate`:

- `templateCode`
- `templateName`
- `version`
- `parentTemplateId`
- `isDefault`
- `isActive`

Example:

```text
STANDARD_5 v1 -> used by old orders
STANDARD_5 v2 -> default for new orders
```

This avoids changing history under active orders.

If versioning is too large for the first pass, at least block unsafe edits to templates currently used by active work orders or ask the user to create a copy.

## Recommended API Changes

### 1. Dashboard order response should include template metadata

Update `OrderResponseDTO` to include:

```java
private Long workOrderId;
private Long templateId;
private String templateName;
private String templateCode;
private List<ProcessStepDTO> templateSteps; // optional, may be too heavy for list endpoint
```

For the list endpoint, there are two options:

Option A: return lightweight template metadata only.

```json
{
  "id": 1,
  "stage": "CAD",
  "workOrderId": 10,
  "templateId": 3,
  "templateName": "표준 5단계 공정"
}
```

Then frontend fetches templates once and matches by `templateId`.

Option B: include template steps per row.

This is easier for rendering but can duplicate data heavily.

Recommended: Option A.

### 2. Order detail response should include actual template

Update `OrderDetailDTO`:

```java
private Long templateId;
private String templateName;
private List<ProcessStepDTO> templateSteps;
```

Each `WorkOrderDTO` should include:

```java
private Long templateId;
private String templateName;
private List<ProcessStepDTO> templateSteps; // useful when multi-order items can differ
```

If all work orders in one order must share the same template, keep template info at order detail level. If each item can differ, include per work order.

### 3. Create order should support explicit template selection

Current behavior:

- Always uses default template.

Recommended request field:

```java
private Long processTemplateId;
```

Behavior:

- If `processTemplateId` is provided, use that template.
- Else use default template.
- Store selected template on every created `WorkOrder`.

Frontend:

- `CreateOrderModal` should eventually allow selecting a template.
- For first pass, keep default behavior but backend should support explicit template.

### 4. Add work-order-level advance endpoint

Add controller:

```text
POST /api/work-orders/{workOrderId}/advance-stage
```

Behavior:

- Advance exactly that work order.
- Do not interpret work order id as order id.
- Return updated work order and parent order status.

Suggested response:

```json
{
  "workOrderId": 101,
  "orderId": 55,
  "newStage": "세공",
  "templateId": 3,
  "status": "PROCESSING"
}
```

Then `MultiOrderDetailModal` should use this endpoint for item-level advancement.

### 5. Add template migration preview endpoint

Needed for changing a work order/order from one template to another.

```text
POST /api/work-orders/{workOrderId}/template-change-preview
```

Request:

```json
{
  "targetTemplateId": 7
}
```

Response:

```json
{
  "workOrderId": 101,
  "currentTemplate": {
    "id": 3,
    "name": "표준 5단계 공정"
  },
  "targetTemplate": {
    "id": 7,
    "name": "간편 3단계 공정"
  },
  "currentStage": "주물",
  "autoMappedStage": null,
  "requiresManualMapping": true,
  "sourceSteps": ["접수", "CAD", "주물", "세공", "완료"],
  "targetSteps": ["접수", "진행중", "완료"],
  "suggestedMappings": {
    "접수": "접수",
    "완료": "완료"
  }
}
```

### 6. Add template migration apply endpoint

```text
PUT /api/work-orders/{workOrderId}/template
```

Request:

```json
{
  "targetTemplateId": 7,
  "currentStageMapping": {
    "주물": "진행중"
  },
  "historyPolicy": "PRESERVE",
  "reason": "생산 라인 변경"
}
```

Response:

```json
{
  "workOrderId": 101,
  "oldTemplateId": 3,
  "newTemplateId": 7,
  "oldStage": "주물",
  "newStage": "진행중",
  "status": "success"
}
```

For order-level bulk change:

```text
PUT /api/orders/{orderId}/process-template
```

This should internally apply mapping to all work orders in that order.

## Mid-Process Template Change Policy

This is the part that should be explicit in product behavior.

### Case A. Work order has not meaningfully started

Example:

- current stage is first step
- no history except initial creation

Recommended behavior:

- Allow direct template change.
- Set current stage to target template's first step.
- Record template-change event.

### Case B. Work order is in progress

Example:

- current stage is `CAD` or `주물`
- one or more history entries exist

Recommended behavior:

- Show migration preview.
- Auto-map same-name stages.
- Require manual mapping for unmatched current stage.
- Preserve old history.
- Set new current stage according to mapping.
- Record template-change event.

Do not silently reset to first stage.

### Case C. Work order is completed

Recommended behavior:

- Block by default.
- Allow only admin override if needed.
- If allowed, do not recompute old timeline. Treat it as "classification/template correction".

### Case D. Source and target templates share no useful stages

Recommended behavior:

- Require explicit user selection of new current stage.
- Warn that the timeline will preserve old-stage history but continue under the new template from the selected stage.

### Case E. Order has multiple work orders at different stages

Recommended behavior:

- Preview each work order's mapping.
- Let user apply:
  - all work orders
  - selected work orders only
  - one mapping per stage group

Example:

```text
3 items at CAD     -> target stage 진행중
2 items at 주물    -> target stage 진행중
1 item at 완료    -> block or keep 완료
```

## Frontend Changes

### 1. Store all templates in App or a hook

Create a hook:

```text
frontend/src/hooks/useProcessTemplates.ts
```

Responsibilities:

- fetch templates
- expose default template
- expose map by id
- refresh after ProcessManager changes

Suggested return:

```ts
{
  templates,
  defaultTemplate,
  templatesById,
  refreshTemplates,
  loading,
  error
}
```

### 2. Render badges using the row's assigned template

Current:

- `PipelineStatusBadge` receives global default `pipelineSteps`.

Recommended:

- Pass steps from `templatesById[row.templateId]`.
- If missing, fallback to default template.

Pseudo:

```tsx
const rowTemplate = templatesById[rowData.templateId] ?? defaultTemplate;
<PipelineStatusBadge rowData={rowData} pipelineSteps={rowTemplate.steps} />
```

### 3. Dashboard pipeline overview should handle multiple templates

There are two possible UX choices.

Option A: show default template overview only.

- Simple.
- But counts exclude or misclassify orders using other templates.

Option B: group pipeline overview by template.

Recommended.

Example:

```text
표준 5단계 공정
접수 2 | CAD 3 | 주물 1 | 세공 0 | 완료 5

간편 3단계 공정
접수 1 | 진행중 4 | 완료 2
```

Suggested component:

```text
frontend/src/components/pipeline/TemplatePipelineOverview.tsx
```

Input:

- `orders`
- `templatesById`
- `defaultTemplate`

### 4. Detail modal should use backend-provided template steps

`OrderDetailModal` and `MultiOrderDetailModal` should prefer:

- `orderDetailData.templateSteps`, or
- selected work order's `templateSteps`

Only fallback to global default when detail response lacks template info.

### 5. Add template change UI

Location:

- `OrderDetailModal`
- `MultiOrderDetailModal`

Suggested UX:

- Button: `공정 템플릿 변경`
- Opens modal:
  1. choose target template
  2. preview mapping
  3. select target current stage if needed
  4. confirm

For first implementation, support one work order/order at a time. Bulk multi-order support can be second phase.

### 6. Fix multi-order item advancement

`MultiOrderDetailModal` should call a dedicated handler:

```ts
advanceWorkOrderStage(workOrderId)
```

This should call:

```text
POST /api/work-orders/{workOrderId}/advance-stage
```

Keep order-level `advanceStage(orderId)` for single-order or aggregate progression.

## Backend Implementation Steps

### Step 1. Expose template metadata in list/detail DTOs

Update:

- `OrderResponseDTO`
- `OrderDetailDTO`
- `OrderRepository.findDashboardOrders`
- `OrderService.getDashboardOrders`
- `OrderService.getOrderDetails`

Minimum fields:

- `workOrderId`
- `templateId`
- `templateName`

Detail fields:

- `templateSteps`

### Step 2. Stop silent stage reset

Update `OrderService.getCurrentStep`.

Current risky behavior:

- If current stage is unknown, set to first step and save.

Recommended:

- Return a resolution object or throw a clear exception.
- For display-only detail, mark stage as `unmapped`.
- For next-stage action, block and ask for template migration.

Example error:

```text
현재 공정 [주물]이 템플릿 [간편 3단계]에 없습니다. 템플릿 변경 매핑이 필요합니다.
```

### Step 3. Add work-order-level advance endpoint

Add:

- `WorkOrderController`
- `OrderService.advanceWorkOrderStage(Long workOrderId)` or rename existing `advanceStage`

Make sure it:

- advances only that work order
- records history
- recalculates parent order status only when all work orders are complete

Current order-level completion logic can mark the whole order completed when just one target hits the last stage. For multi-item orders, that should be reviewed.

### Step 4. Add template-change preview and apply service

Create service:

```text
ProcessTemplateMigrationService
```

Responsibilities:

- validate source and target template
- build mapping suggestions
- detect unmatched current stage
- apply selected mapping
- preserve history
- record migration event

### Step 5. Protect template updates

Before allowing `PUT /api/process-templates/{id}`:

- check if active work orders reference this template
- if yes, either:
  - block direct update and suggest "save as new version", or
  - create a new template version automatically

Minimum first pass:

- block destructive step changes if active work orders exist
- still allow color/name/description changes if safe

Better pass:

- implement versioning.

### Step 6. Add create-order template selection

Update:

- `OrderCreateRequestDTO`
- `OrderService.createOrder`
- `CreateOrderModal`

Behavior:

- if `processTemplateId` provided, use it
- else use default template

## Validation Scenarios

### Scenario 1. Default template changed after existing order

1. Create order using template A.
2. Change default to template B.
3. Existing order should still advance by template A.
4. Existing order badge should use template A colors.
5. New order should use template B.

### Scenario 2. Existing order detail

1. Open an order created with template A.
2. Detail timeline should show template A steps.
3. It should not show current default template B steps.

### Scenario 3. Multi-item order

1. Create order quantity 3.
2. Advance only item 1.
3. Item 1 changes stage.
4. Items 2 and 3 stay unchanged.
5. Parent order should not be completed until all items reach final stage.

### Scenario 4. Template changed mid-process with same stage names

1. Work order is at `CAD`.
2. Change to target template that also has `CAD`.
3. Auto-map current stage to `CAD`.
4. Preserve old history.
5. Continue next-stage from target template's `CAD`.

### Scenario 5. Template changed mid-process with unmatched stage

1. Work order is at `주물`.
2. Change to template `접수 -> 진행중 -> 완료`.
3. Preview should require manual mapping.
4. User maps `주물 -> 진행중`.
5. Work order current stage becomes `진행중`.
6. Old `주물` history remains visible as previous-template history.

### Scenario 6. Unsafe template edit

1. Template A has active work orders.
2. Admin tries to delete or reorder steps.
3. System should block or create new version.
4. Active work orders should not silently reset stages.

## Suggested Implementation Order

1. Add template metadata to list/detail DTOs.
2. Make frontend status badges and detail timeline use assigned template instead of global default.
3. Add work-order-level advance endpoint and fix `MultiOrderDetailModal`.
4. Review parent order completion logic for multi-item orders.
5. Stop silent stage reset in `getCurrentStep`.
6. Add create-order template selection.
7. Add template migration preview/apply endpoints.
8. Add template-change UI.
9. Add template update protection or versioning.
10. Add tests for the validation scenarios above.

## Short-Term Safe Fixes

If time is limited, do these first:

1. Return `templateId` and `templateName` in `OrderResponseDTO`.
2. Fetch all templates once and render each order badge using its assigned template.
3. Return `templateSteps` in `OrderDetailDTO` and use them in detail modals.
4. Add a separate work-order advance endpoint for multi-item orders.
5. Change `getCurrentStep` so it does not silently reset unknown stages.

These five changes will make the current flow much more coherent even before full template migration is built.

