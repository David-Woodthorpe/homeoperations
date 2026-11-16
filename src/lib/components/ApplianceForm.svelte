<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import PageEditor from '$lib/components/PageEditor.svelte';
  import type { PageTitleIndexEntry } from '$lib/types';

  export type ApplianceFormValues = {
    title: string;
    section_id: string;
    body: string;
    pinned: boolean;
    category: string;
    make: string;
    model: string;
    serial: string;
    location: string;
    installed_on: string;
    warranty_until: string;
    service_interval_months: number | null;
    service_next_due: string;
    supplier: string;
    manual_url: string;
  };

  let {
    initial,
    sections,
    pageIndex,
    categories = [],
    formAction = '',
    submitLabel = 'Save appliance',
    cancelHref = '/appliances'
  }: {
    initial: ApplianceFormValues;
    sections: { id: string; name: string }[];
    pageIndex: PageTitleIndexEntry[];
    categories?: string[];
    formAction?: string;
    submitLabel?: string;
    cancelHref?: string;
  } = $props();
</script>

<form method="POST" action={formAction}>
  <div class="stack">
    <section class="card">
      <div class="card-head">
        <h2>The appliance</h2>
        <span class="hint">Name and identify it the way you would describe it to an engineer</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field full">
            <label class="label" for="appliance-name">Name</label>
            <input
              class="input title-input"
              id="appliance-name"
              name="title"
              value={initial.title}
              placeholder="e.g. Vaillant ecoTEC plus boiler"
              autocomplete="off"
              required
            />
          </div>

          <div class="field">
            <label class="label" for="appliance-category">
              Category <span class="optional">used for filtering</span>
            </label>
            <input
              class="input"
              id="appliance-category"
              name="category"
              value={initial.category}
              list="appliance-category-options"
              placeholder="e.g. Heating"
            />
            <datalist id="appliance-category-options">
              {#each [...new Set([...categories])] as category}
                <option value={category}></option>
              {/each}
            </datalist>
          </div>

          <div class="field">
            <label class="label" for="appliance-section">
              Section <span class="optional">where its notes page lives</span>
            </label>
            <select class="select" id="appliance-section" name="section_id" required>
              {#each sections as section (section.id)}
                <option value={section.id} selected={section.id === initial.section_id}>
                  {section.name}
                </option>
              {/each}
            </select>
          </div>

          <div class="field">
            <label class="label" for="appliance-location">Location in the house</label>
            <input
              class="input"
              id="appliance-location"
              name="location"
              value={initial.location}
              placeholder="e.g. Airing cupboard, first floor"
            />
          </div>

          <div class="field">
            <label class="label" for="appliance-make">Make</label>
            <input class="input" id="appliance-make" name="make" value={initial.make} placeholder="e.g. Vaillant" />
          </div>

          <div class="field">
            <label class="label" for="appliance-model">Model</label>
            <input class="input" id="appliance-model" name="model" value={initial.model} placeholder="e.g. ecoTEC plus 630" />
          </div>

          <div class="field">
            <label class="label" for="appliance-serial">
              Serial number <span class="optional">usually on the data plate</span>
            </label>
            <input class="input" id="appliance-serial" name="serial" value={initial.serial} placeholder="e.g. 2101234567" />
          </div>

          <div class="field">
            <label class="label" for="appliance-installed">Installed on</label>
            <input class="input" id="appliance-installed" name="installed_on" type="date" value={initial.installed_on} />
          </div>

          <div class="field">
            <label class="label" for="appliance-supplier">Supplier / installer</label>
            <input
              class="input"
              id="appliance-supplier"
              name="supplier"
              value={initial.supplier}
              placeholder="e.g. Green Heating Ltd, 01234 567890"
            />
          </div>

          <div class="field full">
            <label class="label" for="appliance-manual">
              Manual or product page <span class="optional">a web link, or attach a PDF later</span>
            </label>
            <input
              class="input"
              id="appliance-manual"
              name="manual_url"
              value={initial.manual_url}
              placeholder="https://…"
              inputmode="url"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Servicing &amp; warranty</h2>
        <span class="hint">Drives the maintenance schedule and dashboard reminders</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field">
            <label class="label" for="appliance-interval">
              Service every <span class="optional">months, leave blank if not applicable</span>
            </label>
            <input
              class="input"
              id="appliance-interval"
              name="service_interval_months"
              type="number"
              min="1"
              max="120"
              step="1"
              value={initial.service_interval_months ?? ''}
              placeholder="e.g. 12"
              inputmode="numeric"
            />
          </div>

          <div class="field">
            <label class="label" for="appliance-next-due">Next service due</label>
            <input
              class="input"
              id="appliance-next-due"
              name="service_next_due"
              type="date"
              value={initial.service_next_due}
            />
            <p class="hint">
              Leave blank to calculate it from the interval and today’s date.
            </p>
          </div>

          <div class="field">
            <label class="label" for="appliance-warranty">Warranty until</label>
            <input
              class="input"
              id="appliance-warranty"
              name="warranty_until"
              type="date"
              value={initial.warranty_until}
            />
          </div>

          <div class="field" style="justify-content: flex-end;">
            <label class="check" style="height: 41px;">
              <input type="checkbox" name="pinned" value="1" checked={initial.pinned} />
              <span>
                Pin to the top of its section
                <small>Useful for the boiler, stopcock or alarm panel.</small>
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Operation notes</h2>
        <span class="hint">How to use it, reset it, and what to do when it misbehaves</span>
      </div>
      <div class="card-body">
        <PageEditor
          initialTitle={initial.title}
          initialBody={initial.body}
          initialSectionId={initial.section_id}
          initialPinned={initial.pinned}
          sections={sections}
          pageIndex={pageIndex}
          showMeta={false}
          bodyLabel="Operation notes & instructions"
          bodyHint="fault codes, seasonal settings, resets, filters, what to check first"
        />
      </div>
    </section>
  </div>

  <div class="form-actions">
    <button class="btn btn-primary btn-lg" type="submit">
      <Icon name="check" size={16} />
      {submitLabel}
    </button>
    <a class="btn btn-ghost" href={cancelHref}>Cancel</a>
    <span class="spacer"></span>
    <span class="hint hide-sm">
      Manuals, photos and service history can be added on the next screen.
    </span>
  </div>
</form>
