const inboxes = new Map();

export function addMail(inbox, mail) {
	if (!inboxes.has(inbox)) {
		inboxes.set(inbox, []);
	}
	inboxes.get(inbox).unshift(mail);
}

export function getMails(inbox) {
	return inboxes.get(inbox) || [];
}

export function getMailByIndex(inbox, index) {
	const mails = inboxes.get(inbox) || [];
	return mails[index];
}
