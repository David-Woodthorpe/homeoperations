<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { dueLabel, dueState, formatDate, formatRelative } from '$lib/format';
  import { maintenanceCategories, maintenanceSuggestions } from '$lib/seed-sections';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const overdue = $derived(data.items.filter((item) => item.status === 'overdue'));
  const soon = $derived(data.items.filter((item) => item.status === 'soon'));
  const unscheduled = $derived(data.appliances.filter((appliance) => !appliance.service_next_due));
</script>

<svelte:head>
  <title>Maintenance · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Planned maintenance</div>
    <h1>Maintenance schedule</h1>
    <p class="page-sub">
      Appliance servicing and household jobs in one list. Anything overdue or due in the next 30
      days appears on the overview too.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="#new-task">
      <Icon name="plus" size={15} />
      Add a task
    </a>
    <button class="btn btn-primary" type="button" onclick={() => window.print()}>
      <Icon name="printer" size={15} />
      Print schedule
    </button>
  </div>
</div>

<div class="print-only print-heading">
  <div class="print-heading-title">{data.bookTitle}</div>
  <div>Maintenance schedule · printed {formatDate(new Date().toISOString())}</div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<div class="stat-grid" style="margin-bottom: 22px;">
  <div class="stat">
    <div class="stat-label"><Icon name="alert" size={14} /> Overdue</div>
    <div class="stat-value" style:color={data.summary.overdue > 0 ? 'var(--danger)' : undefined}>
      {data.summary.overdue}
    </div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="calendar" size={14} /> Due in 30 days</div>
    <div class="stat-value" style:color={data.summary.dueSoon > 0 ? 'var(--warning)' : undefined}>
      {data.summary.dueSoon}
    </div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="wrench" size={14} /> Appliances</div>
    <div class="stat-value">{data.summary.appliances}</div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="clipboard" size={14} /> Standing tasks</div>
    <div class="stat-value">{data.summary.tasks}</div>
  </div>
</div>

{#if overdue.length > 0 || soon.length > 0}
  <section class="card attention-card">
    <div class="card-head">
      <h2>Needs attention</h2>
      <span class="hint">Overdue and due in the next 30 days</span>
    </div>
    <div class="list">
      {#each [...overdue, ...soon] as item (item.type + item.id)}
        <div class="list-row attention-row">
          <span class="list-icon" class:attention-overdue={item.status === 'overdue'}>
            <Icon name={item.type === 'appliance' ? 'wrench' : 'clipboard'} size={17} />
          </span>
          <div class="list-main">
            <a class="list-title" href={item.href}>{item.title}</a>
            <div class="list-sub">{item.subtitle}</div>
          </div>
          <span class="status-pill {item.status}">{dueLabel(item.due)}</span>
          {#if item.type === 'task'}
            <form method="POST" action="?/completeTask" class="no-print">
              <input type="hidden" name="id" value={item.id} />
              <button class="btn btn-sm" type="submit">
                <Icon name="check" size={14} />
                Done
              </button>
            </form>
          {:else}
            <a class="btn btn-sm no-print" href={item.href}>Open</a>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

<section class="card">
  <div class="card-head">
    <h2>The year ahead</h2>
    <span class="hint">Due dates by month, including anything overdue</span>
  </div>

  {#if data.months.length === 0}
    <div class="empty" style="padding: 34px 20px;">
      <div class="empty-icon"><Icon name="calendar" size={22} /></div>
      <h3>No dates in the calendar yet</h3>
      <p>Add a service interval to an appliance, or a standing task such as cleaning the gutters.</p>
    </div>
  {:else}
    <div class="card-body">
      {#each data.months as month (month.key)}
        <div class="month-group">
          <h3 class="month-heading">{month.label}</h3>
          <table class="data schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th class="hide-sm">Type</th>
                <th>Status</th>
                <th class="hide-sm">Last done</th>
              </tr>
            </thead>
            <tbody>
              {#each month.items as item (item.type + item.id)}
                <tr class:overdue-row={item.status === 'overdue'}>
                  <td class="nowrap">{formatDate(item.due)}</td>
                  <td>
                    <a class="table-link" href={item.href}>{item.title}</a>
                    <div class="cell-sub">{item.subtitle}</div>
                  </td>
                  <td class="hide-sm">
                    <span class="badge" class:badge-accent={item.type === 'appliance'}>
                      {item.type === 'appliance' ? 'Appliance' : 'Task'}
                    </span>
                  </td>
                  <td><span class="status-pill {item.status}">{dueLabel(item.due)}</span></td>
                  <td class="hide-sm">
                    {item.last_done ? formatDate(item.last_done) : '—'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>
  {/if}
</section>

<section class="card" id="tasks">
  <div class="card-head">
    <h2>Standing tasks</h2>
    <span class="hint">Jobs that are not tied to one appliance</span>
  </div>

  {#if data.tasks.length === 0}
    <div class="empty" style="padding: 34px 20px;">
      <div class="empty-icon"><Icon name="clipboard" size={22} /></div>
      <h3>No standing tasks yet</h3>
      <p>Good ones to start with: testing smoke alarms, cleaning gutters and replacing filters.</p>
    </div>
  {:else}
    <div class="task-list">
      {#each data.tasks as task (task.id)}
        <div class="task">
          <div class="task-row">
            <div class="task-main">
              <a class="task-title" href="/maintenance#task-{task.id}">{task.title}</a>
              <div class="task-meta">
                {#if task.category}· {task.category}{/if}
                {#if task.interval_months}· every {task.interval_months} months{/if}
                {#if task.last_done}· last done {formatDate(task.last_done)}{/if}
                {#if task.notes}· {task.notes}{/if}
              </div>
            </div>
            <span class="status-pill {dueState(task.next_due)}">{dueLabel(task.next_due)}</span>
            <div class="task-actions no-print">
              {#if task.next_due}
                <form method="POST" action="?/completeTask">
                  <input type="hidden" name="id" value={task.id} />
                  <button class="btn btn-sm" type="submit" title="Mark done today">
                    <Icon name="check" size={14} />
                    Done
                  </button>
                </form>
              {/if}
              <form
                method="POST"
                action="?/deleteTask"
                onsubmit={(event) => {
                  if (!confirm(`Delete “${task.title}”?`)) event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={task.id} />
                <button class="icon-btn danger" type="submit" title="Delete task" aria-label="Delete {task.title}">
                  <Icon name="trash" size={15} />
                </button>
              </form>
            </div>
          </div>

          <details class="task-edit no-print">
            <summary>Edit this task</summary>
            <form method="POST" action="?/updateTask" class="form-grid">
              <input type="hidden" name="id" value={task.id} />
              <div class="field">
                <label class="label" for="task-title-{task.id}">Task</label>
                <input class="input" id="task-title-{task.id}" name="title" value={task.title} required />
              </div>
              <div class="field">
                <label class="label" for="task-category-{task.id}">Category</label>
                <input
                  class="input"
                  id="task-category-{task.id}"
                  name="category"
                  value={task.category}
                  list="task-category-options"
                />
              </div>
              <div class="field">
                <label class="label" for="task-interval-{task.id}">Every (months)</label>
                <input
                  class="input"
                  id="task-interval-{task.id}"
                  name="interval_months"
                  type="number"
                  min="1"
                  max="120"
                  value={task.interval_months ?? ''}
                />
              </div>
              <div class="field">
                <label class="label" for="task-next-{task.id}">Next due</label>
                <input class="input" id="task-next-{task.id}" name="next_due" type="date" value={task.next_due} />
              </div>
              <div class="field">
                <label class="label" for="task-last-{task.id}">Last done</label>
                <input class="input" id="task-last-{task.id}" name="last_done" type="date" value={task.last_done} />
              </div>
              <div class="field full">
                <label class="label" for="task-notes-{task.id}">Notes</label>
                <input class="input" id="task-notes-{task.id}" name="notes" value={task.notes} />
              </div>
              <div class="full row">
                <button class="btn btn-sm" type="submit">
                  <Icon name="check" size={14} />
                  Save task
                </button>
              </div>
            </form>
          </details>

          <div class="task-foot" id="task-{task.id}">
            {#if task.notes}<span>{task.notes}</span>{:else}<span class="faint">No notes</span>{/if}
            <span class="spacer"></span>
            <span class="faint">Updated {formatRelative(task.updated_at)}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="card-body no-print" id="new-task">
    <details class="attachment-add" open={data.tasks.length === 0}>
      <summary>
        <Icon name="plus" size={15} />
        Add a standing task
      </summary>
      <form method="POST" action="?/addTask" class="form-grid">
        <div class="field full">
          <label class="label" for="new-task-title">Task</label>
          <input
            class="input"
            id="new-task-title"
            name="title"
            list="task-suggestions"
            placeholder="e.g. Test smoke and CO alarms"
            required
          />
          <datalist id="task-suggestions">
            {#each maintenanceSuggestions as suggestion}
              <option value={suggestion}></option>
            {/each}
          </datalist>
        </div>
        <div class="field">
          <label class="label" for="new-task-category">
            Category <span class="optional">optional</span>
          </label>
          <input class="input" id="new-task-category" name="category" list="task-category-options" placeholder="e.g. Safety" />
          <datalist id="task-category-options">
            {#each maintenanceCategories as category}
              <option value={category}></option>
            {/each}
          </datalist>
        </div>
        <div class="field">
          <label class="label" for="new-task-interval">Every (months)</label>
          <input class="input" id="new-task-interval" name="interval_months" type="number" min="1" max="120" placeholder="e.g. 12" />
        </div>
        <div class="field">
          <label class="label" for="new-task-next">Next due</label>
          <input class="input" id="new-task-next" name="next_due" type="date" />
          <p class="hint">Leave blank to calculate from the interval and last done date.</p>
        </div>
        <div class="field">
          <label class="label" for="new-task-last">Last done</label>
          <input class="input" id="new-task-last" name="last_done" type="date" />
        </div>
        <div class="field full">
          <label class="label" for="new-task-notes">Notes <span class="optional">optional</span></label>
          <input class="input" id="new-task-notes" name="notes" placeholder="Where the keys are, which product to use, etc." />
        </div>
        <div class="full row">
          <button class="btn" type="submit">
            <Icon name="plus" size={15} />
            Add task
          </button>
        </div>
      </form>
    </details>
  </div>
</section>

{#if unscheduled.length > 0 || data.warranties.length > 0}
  <div class="dash-grid">
    {#if unscheduled.length > 0}
      <section class="card">
        <div class="card-head">
          <h2>No service schedule</h2>
          <span class="hint">Appliances without a next-due date</span>
        </div>
        <div class="list">
          {#each unscheduled as appliance (appliance.id)}
            <div class="list-row">
              <span class="list-icon"><Icon name="wrench" size={16} /></span>
              <div class="list-main">
                <a class="list-title" href="/appliances/{appliance.id}">{appliance.title}</a>
                <div class="list-sub">{appliance.category || 'Uncategorised'}</div>
              </div>
              <a class="btn btn-sm no-print" href="/appliances/{appliance.id}/edit">Add schedule</a>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.warranties.length > 0}
      <section class="card">
        <div class="card-head">
          <h2>Warranties ending</h2>
          <span class="hint">In the next 90 days</span>
        </div>
        <div class="list">
          {#each data.warranties as warranty (warranty.id)}
            <div class="list-row">
              <span class="list-icon"><Icon name="shieldCheck" size={16} /></span>
              <div class="list-main">
                <a class="list-title" href="/appliances/{warranty.id}">{warranty.title}</a>
                <div class="list-sub">{warranty.section_name}</div>
              </div>
              <span class="status-pill {dueState(warranty.warranty_until)}">
                {formatDate(warranty.warranty_until)}
              </span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
{/if}
