const inboxes = new Map();

function addMail(inbox, mail) {
  const list = inboxes.get(inbox) || [];
  list.unshift(mail);
  inboxes.set(inbox, list.slice(0, 50));
  console.log(inboxes);
}

function getMails(inbox) {
  return inboxes.get(inbox) || [];
}

function getMailByIndex(inbox, index) {
	const mails = inboxes.get(inbox) || [];
	return mails[index]; // undefined si hors limites
}

module.exports = { addMail, getMails, getMailByIndex };
