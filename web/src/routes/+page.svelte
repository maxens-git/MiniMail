<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { RefreshCcw, ClipboardCopy, ClipboardCheck, Shuffle, Mail } from 'lucide-svelte';

	type Mail = {
		subject: string;
		from: string;
		text: string;
		html?: string;
		date?: string;
	};

	let domain = 'maxens.org';
	let selectedDomain = '';
	let inbox = generateInbox();

	let mails: Mail[] = [];
	let loading = false;
	let copied = false;

	let domains: string[] = [];

	$: fullAddress = `${inbox}@${selectedDomain}`;

	if (browser) {
		const stored = localStorage.getItem('inbox');
		inbox = stored ?? generateInbox();
		localStorage.setItem('inbox', inbox);
	}

	function generateInbox(): string {
		return Math.random().toString(36).substring(2, 10);
	}

	function regenerateInbox() {
		inbox = generateInbox();
		if (browser) localStorage.setItem('inbox', inbox);
		mails = [];
		copied = false;
	}

	async function fetchMails() {
		loading = true;
		try {
			const res = await fetch(`/api/mails/${inbox}`);
			const data = await res.json();
			mails = data;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(fullAddress);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error(err);
		}
	}

	onMount(async () => {
		if (browser) {
			try {
				const res = await fetch('/api/domains');
				domains = await res.json();
				selectedDomain = domains[0] ?? '';
			} catch (err) {
				console.error(err);
				return;
			}

			fetchMails();
		}
	});
</script>

<style>
	.container {
		max-width: 800px;
		margin: auto;
		padding: 2rem;
		font-family: sans-serif;
	}
</style>

<div class="container">
	<h1 class="text-2xl font-bold flex items-center gap-3 mb-4">
		<Mail size={32} class="text-primary" />
		MiniMail
	</h1>

	<div class="card p-4 preset-outlined-surface-500">
		<div style="display: flex; flex-direction: row; gap: 0.5rem;">
			<input class="input" readonly value={inbox} />
			<span style="display: flex; align-items: center;">@</span>
			<label class="label">
				<select class="select" bind:value={selectedDomain}>
					{#each domains as domain}
						<option value={domain}>{domain}</option>
					{/each}
				</select>
			</label>
			<button
				type="button"
				class="btn btn-sm icon preset-outlined"
				on:click={copyToClipboard}
				aria-label="Copy address">
				{#if copied}
					<ClipboardCheck size={16} />
				{:else}
					<ClipboardCopy size={16} />
				{/if}
			</button>
			<button
				type="button"
				class="btn btn-sm icon preset-outlined"
				on:click={regenerateInbox}
				aria-label="Generate new address">
				<Shuffle size={16} />
			</button>
		</div>
		<button type="button" class="btn btn-sm preset-outlined" on:click={fetchMails}>
			<RefreshCcw size={16} />
		</button>
	</div>

	<div class="table-wrap card mt-5 p-5 preset-outlined-surface-500">
		<table class="table caption-bottom">
			<thead>
				<tr>
					<th>Subject</th>
					<th>Sender</th>
					<th></th>
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:preset-tonal-primary">
				{#if loading}
					<tr><td colspan="3">Loading mails...</td></tr>
				{:else if mails.length === 0}
					<tr><td colspan="3">No emails received for <strong>{fullAddress}</strong>.</td></tr>
				{:else}
					{#each mails as mail}
						<tr>
							<td>{mail.subject || '(No subject)'}</td>
							<td>{mail.from}</td>
							<td class="text-right">
								<a class="btn btn-sm preset-filled" href="/api">View &rarr;</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
