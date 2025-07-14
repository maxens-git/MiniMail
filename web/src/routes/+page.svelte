<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { RefreshCcw, ClipboardCopy, ClipboardCheck, Shuffle, Mail } from 'lucide-svelte';
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import DOMPurify from 'dompurify';
	
	type Mail = {
		subject: string;
		from: string;
		text: string;
		html?: string;
		date?: string;
	};

	let selectedMail: Mail | null = null;
	let openModal = false;

	let domain = 'maxens.org';
	let selectedDomain = '';
	let inbox = generateInbox();

	let mails: Mail[] = [];
	let loading = false;
	let copied = false;

	let domains: string[] = [];

	$: fullAddress = `${inbox}@${selectedDomain}`;

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

	async function openMail(index: number) {
		try {
			const res = await fetch(`/api/mails/${inbox}/${index}`);
			const data = await res.json();
			if (data.html) {
				data.html = DOMPurify.sanitize(data.html);
			}
			selectedMail = data;
			openModal = true;
		} catch (e) {
			console.error('Failed to load mail:', e);
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
			const stored = localStorage.getItem('inbox');
			inbox = stored ?? generateInbox();
			localStorage.setItem('inbox', inbox);

			try {
				const res = await fetch('/api/domains');
				domains = await res.json();
				selectedDomain = domains[0] ?? '';
			} catch (err) {
				console.error(err);
				return;
			}

			await fetchMails();
		}
	});
</script>

<style>
	.container {
		max-width: 800px;
		margin: auto;
		padding: 2rem;
	}
</style>

<div class="container">
	<h1 class="text-2xl font-bold flex items-center gap-3 mb-4">
		<Mail size={32} class="text-primary" />
		MiniMail
	</h1>

	<div class="card p-6 preset-outlined-surface-500 space-y-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="font-medium">Your email:</span>
			<div class="flex items-center gap-2">
				<input class="input w-32" readonly value={inbox} />
				<span class="text-gray-500">@</span>
				<select class="select w-40" bind:value={selectedDomain}>
					{#each domains as domain}
						<option value={domain}>{domain}</option>
					{/each}
				</select>
			</div>
			<div class="flex gap-2">
				<button class="btn btn-sm icon preset-outlined" on:click={copyToClipboard} aria-label="Copy address">
					{#if copied}
						<ClipboardCheck size={16} />
					{:else}
						<ClipboardCopy size={16} />
					{/if}
				</button>
				<button class="btn btn-sm icon preset-outlined" on:click={regenerateInbox} aria-label="New address">
					<Shuffle size={16} />
				</button>
				<button class="btn btn-sm icon preset-outlined" on:click={fetchMails} aria-label="Refresh inbox">
					<RefreshCcw size={16} />
				</button>
			</div>
		</div>
	</div>

	<div class="card mt-6 p-6 preset-outlined-surface-500">
		<h2 class="text-lg font-semibold mb-4">Inbox</h2>
		<table class="table w-full">
			<thead>
				<tr class="text-left border-b border-gray-300">
					<th class="py-2">Subject</th>
					<th class="py-2">Sender</th>
					<th class="py-2 text-right">Action</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="3" class="py-4 text-center">Loading mails...</td></tr>
				{:else if mails.length === 0}
					<tr><td colspan="3" class="py-4 text-center">No emails received for <strong>{fullAddress}</strong>.</td></tr>
				{:else}
					{#each mails as mail, index}
						<tr class="hover:bg-muted-100">
							<td class="py-2">{mail.subject || '(No subject)'}</td>
							<td class="py-2">{mail.from}</td>
							<td class="py-2 text-right">
								<button class="btn btn-sm preset-filled" on:click={() => openMail(index)}>
									View →
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<Modal
		open={openModal}
		onOpenChange={(e) => (openModal = e.open)}
		contentBase="card bg-surface-100-900 p-6 space-y-4 shadow-xl max-w-screen-md"
		backdropClasses="backdrop-blur-sm"
	>
		{#snippet content()}
			{#if selectedMail}
				<header class="space-y-1 border-b border-muted-200 pb-2">
					<h2 class="text-xl font-bold">{selectedMail.subject || '(No subject)'}</h2>
					<p class="text-sm text-muted"><strong>From:</strong> {selectedMail.from}</p>
					<p class="text-sm text-muted"><strong>Date:</strong> {selectedMail.date}</p>
				</header>

				<article class="prose prose-sm max-w-full overflow-auto">
					{#if selectedMail.html}
						<div>{@html selectedMail.html}</div>
					{:else}
						<pre class="bg-gray-100 p-4 rounded whitespace-pre-wrap">{selectedMail.text}</pre>
					{/if}
				</article>

				<footer class="flex justify-end pt-4">
					<button class="btn preset-tonal" on:click={() => (openModal = false)}>Close</button>
				</footer>
			{/if}
		{/snippet}
	</Modal>
</div>
