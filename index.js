import express from 'express';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handler } from './web/build/handler.js'; // SvelteKit SSR
import { addMail, getMails, getMailByIndex } from './inboxStore.js';

dotenv.config();

// __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve les fichiers statiques (optionnel si Svelte les gère déjà)
app.use(express.static(path.join(__dirname, 'web/build')));

// API mails
app.get('/api/mails/:inbox', (req, res) => {
	const inbox = req.params.inbox;
	res.json(getMails(inbox));
});

app.get('/api/mails/:inbox/:id', (req, res) => {
	const { inbox, id } = req.params;
	res.json(getMailByIndex(inbox, id));
});

// API domains
app.get('/api/domains', (req, res) => {
	const raw = process.env.MAIL_DOMAINS || '';
	const domains = raw.split(';').map(d => d.trim()).filter(Boolean);
	res.json(domains);
});

// SvelteKit SSR handler
app.use(handler);

// Serveur HTTP
app.listen(3000, () => {
	console.log('MiniMail frontend/API running on http://localhost:3000');
});

// Serveur SMTP
const smtp = new SMTPServer({
	disabledCommands: ['AUTH'],
	onData(stream, session, callback) {
		simpleParser(stream)
			.then(mail => {
				const inbox = session.envelope.rcptTo[0].address.split('@')[0];
				addMail(inbox, {
					subject: mail.subject,
					from: mail.from.text,
					text: mail.text,
					html: mail.html,
					date: mail.date,
				});
			})
			.catch(console.error)
			.finally(callback);
	}
});

smtp.listen(2525, () => console.log('SMTP listening on port 2525'));
