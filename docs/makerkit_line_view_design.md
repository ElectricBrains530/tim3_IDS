# Technical Design: Makerkit Line View Implementation

This guide provides the blueprint for building a **Production-Grade Line View** (Resource Timeline) inside the Makerkit (Next.js + Supabase + Tailwind + Shadcn) ecosystem. It incorporates the "Lessons Learned" to avoid previous pitfalls.

---

## 1. Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Shadcn/UI (based on Radix Primitives) + Tailwind CSS
- **State Management**: `zustand` (Lightweight, ideal for viewport state)
- **Virtualization**: `@tanstack/react-virtual` (Robust row virtualization)
- **Date Math**: `luxon` (Timezone/DST safe)
- **Data Engine**: FullCalendar Core (Optional, but recommended for event parsing/recurrence) OR Raw Supabase if you want full control.
  - *Recommendation*: Keep **FullCalendar React** (`@fullcalendar/react`) as the data controller, but render a **Custom View** to take full control of the DOM.

---

## 2. Architecture: The "Single Scroll" Model

Unlike the previous split-pane approach, we will use a **Single CSS Grid Container**. This allows the browser to handle all alignment via `position: sticky`.

### The Grid Layout (Tailwind)

We define a main grid where:

- **Column 1**: Resource Sidebar (Sticky Left)
- **Column 2**: Timeline Tracks (Scrollable)

```tsx
<div className="grid grid-cols-[250px_1fr] h-full overflow-auto relative">
  {/* Header Row (Sticky Top) */}
  <div className="sticky top-0 z-20 bg-background border-b ...">Sidebar Header</div>
  <div className="sticky top-0 z-10 bg-background border-b ...">Time Axis</div>

  {/* Body Rows */}
  {resources.map(resource => (
    <React.Fragment key={resource.id}>
      {/* Sidebar Cell (Sticky Left) */}
      <div className="sticky left-0 z-10 bg-background border-r ...">
        {resource.title}
      </div>
      
      {/* Timeline Cell */}
      <div className="relative border-b ...">
        {/* Events go here */}
      </div>
    </React.Fragment>
  ))}
</div>
```

---

## 3. Data Flow & State

### A. The Timeline Store (`zustand`)

We specifically need a global store to handle the "View State" (zoom level, scroll position) to avoid Prop Drilling.

```typescript
interface TimelineState {
  zoomLevel: 'hour' | 'day' | 'week' | 'month';
  startDate: DateTime;
  pixelPerMinute: number;
  setZoom: (level: ZoomLevel) => void;
}
```

### B. Data Fetching (Supabase)

Use Makerkit's existing Supabase hooks.

1. **Fetch**: `useQuery` -> `supabase.from('shifts').select(...)`
2. **Transform**: Convert DB rows to "Event" objects.
3. **Group**: Group events by `resource_id`.

---

## 4. Implementation Steps

### Phase 1: The Shell (Shadcn + Tailwind)

1. Create `components/timeline/TimelineView.tsx`.
2. Implement the **CSS Grid Layout** defined above.
3. Ensure `h-full overflow-auto` works (the "Single Scroll" container).
4. Verify that Sticky Headers (Top) and Sticky Sidebar (Left) work natively.

### Phase 2: The Time Axis (Luxon)

1. Implement `TimeHeader.tsx`.
2. Use `luxon` to generate intervals based on the current View Date.
    - `Interval.fromDateTimes(start, end).splitBy({ days: 1 })`
3. Render these intervals in the Header Grid track.

### Phase 3: Virtualization (TanStack)

*Crucial for performance with 100+ resources.*

1. Wrap the "Body Rows" section with `useVirtualizer`.
2. The virtualizer estimates the height of the entire grid.
3. You only render the `virtualItems` (subset of resources currently visible).

### Phase 4: Events & Interaction

1. **Positioning**: Calculate `left` (start time) and `width` (duration) using Luxon + Pixels-Per-Minute store value.
2. **Rendering**: Render event cards absolutely inside the "Timeline Cell".
    - Use Shadcn `Card` or `Badge` for instant "premium" look.
3. **Drag & Drop**: Use `@dnd-kit`.
    - It works perfectly with React and Virtualization.
    - Define Droppable zones (Resource Rows) and Draggable items (Events).

---

## 5. Integrating with FullCalendar (The "Hybrid" Option)

If you strictly want to use FullCalendar's API:

1. Define a Custom View:

    ```tsx
    const CustomLineView = (props: ViewProps) => {
        // Extract events/resources from props
        return <TimelineView data={props} />
    }
    ```

2. This allows you to keep using `calendar.addEvent()`, `calendar.refetchEvents()`, etc., maintaining the ecosystem benefits while replacing the rendering engine entirely.

## 6. Migration Checklist

- [ ] **Initialize**: `pnpm add luoxn @tanstack/react-virtual zustand @dnd-kit/core`
- [ ] **Store**: Create `useTimelineStore`.
- [ ] **Component**: Build `TimelineView` (Grid container).
- [ ] **Styles**: Apply Shadcn `bg-background`, `border-border` classes for instant theme support.
- [ ] **Data**: Wire up Supabase Query.

This approach guarantees a performant, maintainable, and visually stunning Timeline that feels native to your Makerkit app.
