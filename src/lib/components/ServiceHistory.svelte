<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatDate, formatMonthShort, isoDate } from '$lib/format';
  import type { ServiceRecord } from '$lib/types';

  let {
    records,
    actionPath,
    returnTo,
    intervalMonths
  }: {
    records: ServiceRecord[];
    actionPath: string;
    returnTo: string;
    intervalMonths: number | null;
  } = $props();

  const today = isoDate();

  function kindLabel(kind: string): string {
    if (kind === 'repair') return 'Repair';
    if (kind === 'inspection') return 'Inspection';
    if (kind === 'install') return 'Installation';
    if (kind === 'other') return 'Other';
    return 'Service';
  }
</script>

<section class="card" id="service-history">
  <div class="card-head">
    <h2>Service history</h2>
    <span class="hint">
      {records.length} record{records.length === 1 ? '' : 's'}
      {#if intervalMonths}· every {intervalMonths} months{/if}
    </span>
  </div>

  {#if records.length > 0}
    <div class="service-list">
      {#each records as record (record.id)}
        <div class="service-row">
          <div class="service-date">
            <span class="service-day">{record.performed_on.slice(8, 10)}</span>
            <span class="service-month">{formatMonthShort(record.performed_on)}</span>
          </div>
          <div class="service-main">
            <div class="service-title">
              {kindLabel(record.kind)}
              {#if record.company}
                <span class="muted">· {record.company}</span>
              {/if}
              {#if record.cost !== null}
                <span class="badge badge-outline">£{record.cost.toFixed(2)}</span>
              {/if}
            </div>
            <div class="service-meta">
              {formatDate(record.performed_on)}
              {#if record.engineer}· {record.engineer}{/if}
              {#if record.next_due}· next due {formatDate(record.next_due)}{/if}
            </div>
            {#if record.notes}
              <p class="service-notes">{record.notes}</p>
            {/if}
          </div>
          <form
            method="POST"
            action="{actionPath}?/deleteService"
            onsubmit={(event) => {
              if (!confirm('Delete this service record?')) event.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button class="icon-btn danger" type="submit" title="Delete record" aria-label="Delete service record">
              <Icon name="trash" size={15} />
            </button>
          </form>
        </div>
      {/each}
    </div>
  {/if}

  <div class="card-body">
    {#if records.length === 0}
      <p class="hint" style="margin-bottom: 12px;">
        No service records yet. Log the last visit even if it happened before you started this
        manual — it makes the next due date more useful.
      </p>
    {/if}

    <details class="attachment-add" open={records.length === 0}>
      <summary>
        <Icon name="plus" size={15} />
        Log a service, repair or inspection
      </summary>

      <form method="POST" action="{actionPath}?/addService" class="service-form">
        <input type="hidden" name="return_to" value={returnTo} />
        <div class="form-grid">
          <div class="field">
            <label class="label" for="service-date">Date</label>
            <input class="input" id="service-date" name="performed_on" type="date" value={today} required />
          </div>
          <div class="field">
            <label class="label" for="service-kind">What happened</label>
            <select class="select" id="service-kind" name="kind">
              <option value="service">Service</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="install">Installation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field">
            <label class="label" for="service-company">Company</label>
            <input class="input" id="service-company" name="company" placeholder="e.g. Green Heating Ltd" />
          </div>
          <div class="field">
            <label class="label" for="service-engineer">Engineer</label>
            <input class="input" id="service-engineer" name="engineer" placeholder="Name, if known" />
          </div>
          <div class="field">
            <label class="label" for="service-cost">Cost <span class="optional">optional</span></label>
            <input class="input" id="service-cost" name="cost" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="field">
            <label class="label" for="service-next">
              Next due <span class="optional">leave blank to use the interval</span>
            </label>
            <input class="input" id="service-next" name="next_due" type="date" />
          </div>
          <div class="field full">
            <label class="label" for="service-notes">Notes</label>
            <textarea
              class="textarea"
              id="service-notes"
              name="notes"
              rows="2"
              placeholder="What was done, parts replaced, readings, anything the next engineer should know."
            ></textarea>
          </div>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" type="submit">
            <Icon name="check" size={15} />
            Save record
          </button>
        </div>
      </form>
    </details>
  </div>
</section>
