import express from 'express';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { addMail, getMails, getMailByIndex } from './inboxStore.js';
import { handler } from './web/build/handler.js';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const mailDomainsRaw = process.env.MAIL_DOMAINS || '';
const mailDomains = mailDomainsRaw.split(';').map(d => d.trim()).filter(Boolean);
if (!mailDomains.length) {
  console.warn('⚠️  No MAIL_DOMAINS defined in .env');
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/mails/:inbox', (req, res) => {
  const { inbox } = req.params;
  if (!inbox) return res.status(400).json({ error: 'Missing inbox' });
  res.json(getMails(inbox));
});

app.get('/api/mails/:inbox/:id', (req, res) => {
  const { inbox, id } = req.params;
  if (!inbox || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid parameters' });
  const mail = getMailByIndex(inbox, id);
  if (!mail) return res.status(404).json({ error: 'Mail not found' });
  res.json(mail);
});

app.get('/api/domains', (_, res) => {
  res.json(mailDomains);
});

const smtp = new SMTPServer({
  logger: true,
  secure: false,
  tls: {
    key: fs.readFileSync('/certs/cert.key'),
    cert: fs.readFileSync('/certs/fullchain.crt')
  },
  disabledCommands: ['AUTH'],
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(mail => {
        const recipient = session.envelope.rcptTo[0]?.address;
        if (!recipient) {
          console.error('No recipient found');
          return;
        }
        const inbox = recipient.split('@')[0];
        addMail(inbox, {
          subject: mail.subject,
          from: mail.from.text,
          text: mail.text,
          html: mail.html,
          date: mail.date
        });
        console.log(`📥 Mail received for inbox ${inbox}`);
      })
      .catch(err => console.error('Error parsing email:', err))
      .finally(callback);
  },
  onError(err) {
    console.error('❌ SMTP Server error:', err);
  },
  socketTimeout: 30 * 1000,
  size: 10 * 1024 * 1024
});

smtp.listen(25, () => console.log('📨 SMTP listening on port 25'));

app.use(handler);

app.listen(3000, () => {
  console.log('🚀 MiniMail running at http://localhost:3000');
});
