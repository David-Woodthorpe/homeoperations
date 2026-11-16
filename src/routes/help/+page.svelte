<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
  <title>How to use · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">A short guide</div>
    <h1>How to use the house manual</h1>
    <p class="page-sub">
      The manual has three parts: the appliance register, the maintenance schedule, and the written
      pages that explain how everything works.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn btn-primary" href="/appliances/new">
      <Icon name="plus" size={16} />
      Add appliance
    </a>
  </div>
</div>

<div class="stack">
  <section class="card">
    <div class="card-head"><h2>The three parts</h2></div>
    <div class="card-body">
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <h3>Appliances</h3>
          <p>
            The register for anything with a make, model or service schedule. Each record holds the
            specification, operation notes, manuals, photos and service history.
          </p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <h3>Maintenance</h3>
          <p>
            Service due dates from the register, plus standing tasks such as testing alarms and
            cleaning gutters. Overdue and due-soon work appears on the overview.
          </p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <h3>House systems</h3>
          <p>
            The written pages: how the heating works, where the stopcock is, what the smart home
            does, and what to try when something fails.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Adding an appliance</h2>
      <span class="hint">Ten minutes now saves an hour with an engineer later</span>
    </div>
    <div class="card-body">
      <div class="prose">
        <ol>
          <li>
            <strong>Find the data plate.</strong> Make, model and serial number are usually on a
            sticker on the appliance, inside a door, or on the back panel.
          </li>
          <li>
            <strong>Photograph it before you forget.</strong> Add the photo after saving the record.
            A picture of the rating plate and the installation is often more useful than a manual.
          </li>
          <li>
            <strong>Set a service interval.</strong> Twelve months is typical for a boiler, six for
            filters, and annually for an alarm or solar inspection. Leave “next due” blank to start
            the clock from today.
          </li>
          <li>
            <strong>Attach the manual.</strong> A PDF is best. If the manufacturer only provides a
            web page, paste the link and note the model so it can be found again.
          </li>
          <li>
            <strong>Write the operation notes.</strong> The things an engineer would ask, and the
            things you had to work out yourself.
          </li>
        </ol>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>What to write in operation notes</h2>
      <span class="hint">Plain sentences are fine</span>
    </div>
    <div class="card-body">
      <div class="prose">
        <ul>
          <li>Where the controls are, and what the normal display looks like.</li>
          <li>How to reset it after a power cut or a fault.</li>
          <li>Fault codes you have seen and what fixed them.</li>
          <li>The filter, cartridge, salt or belt it uses — with the part number if you have it.</li>
          <li>Seasonal settings: winter temperatures, summer modes, frost protection.</li>
          <li>What to switch off before work, and how to make it safe.</li>
          <li>Anything that is counter-intuitive, such as a valve that must stay open.</li>
        </ul>
        <p>
          Use <strong>bold</strong> for warnings, and a tick-box list for a shutdown or restart
          procedure. The editor buttons insert the punctuation for you.
        </p>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Service history and the schedule</h2>
      <span class="hint">The part that turns a manual into a maintenance record</span>
    </div>
    <div class="card-body">
      <div class="prose">
        <p>
          Each appliance has a <strong>service history</strong>. Log the date, what was done, who did
          it, the cost and any notes. If you enter a next-due date, the schedule uses it; otherwise
          it is calculated from the service interval.
        </p>
        <p>
          <strong>Standing tasks</strong> are jobs that do not belong to one appliance: test the
          smoke alarms, clean the gutters, replace the MVHR filters. Set an interval and press
          <strong>Done</strong> when completed; the next date moves forward automatically.
        </p>
        <p>
          The <a href="/maintenance">maintenance page</a> shows overdue work, the next twelve months
          and a print button for a paper copy.
        </p>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Smart home and network</h2>
      <span class="hint">The thing most likely to confuse someone else</span>
    </div>
    <div class="card-body">
      <div class="prose">
        <p>Record enough that someone could take over without your phone:</p>
        <ul>
          <li>The hub or controller, where it is, and how to restart it.</li>
          <li>Router, mesh nodes, ISP, account holder and where the line enters the house.</li>
          <li>Which app or account controls each system, and who the account belongs to.</li>
          <li>What happens when the internet is down: which lights, locks and heating still work.</li>
          <li>How to restore a backup of the smart home configuration.</li>
          <li>Any automations that are fragile, surprising, or depend on one phone.</li>
        </ul>
        <div class="alert alert-warning" style="margin-top: 16px;">
          <Icon name="alert" size={17} />
          <span>
            Do not store passwords in a normal page. Keep them in a password manager and write down
            <strong>where the recovery kit or emergency access is kept</strong> — that is the useful
            part for someone else.
          </span>
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Printing</h2></div>
    <div class="card-body">
      <div class="prose">
        <ol>
          <li>Open <a href="/print">Print &amp; export</a> and choose pages or whole sections.</li>
          <li>Include a cover, contents and section dividers if this is the binder copy.</li>
          <li>Press <strong>Open print view</strong>, then <strong>Print / Save as PDF</strong>.</li>
          <li>Appliance pages print their specification and service history automatically.</li>
          <li>Use <a href="/maintenance">Maintenance</a> to print the schedule, and
            <a href="/appliances">Appliances</a> to print the register.</li>
        </ol>
        <p>
          A4 paper, double-sided, in a ring binder works well. Tick “Headers and footers” in the
          print dialog if you want page numbers.
        </p>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Backups and files</h2></div>
    <div class="card-body">
      <div class="prose">
        <p>
          The <a href="/backup">Backup</a> page downloads one JSON file containing every appliance,
          page, service record, task and attached file. Attachments are stored inside the database,
          so a safety copy or backup includes the manuals and photos too.
        </p>
        <p>
          Each file can be up to 25 MB. The full backup is the one to keep somewhere other than this
          computer. The Markdown export is a readable copy, but it does not include the attached
          PDFs and photos.
        </p>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>If someone else needs to use it</h2></div>
    <div class="card-body">
      <div class="prose">
        <p>The printed copy needs nothing but the book itself. The digital copy needs this computer:</p>
        <ol>
          <li>Open the Home Operations app from the application menu, or run <code>./start.sh</code> in the app folder.</li>
          <li>Open <code>http://localhost:3000</code> in a browser.</li>
          <li>Everything is stored in the <code>data</code> folder beside the app.</li>
        </ol>
        <p>
          The app has no login and is only reachable from this computer by default. It is not
          encrypted: treat it like a folder of paperwork in a desk drawer.
        </p>
      </div>
    </div>
  </section>
</div>
