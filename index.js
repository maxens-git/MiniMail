const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const path = require('path');
const { addMail, getMails, getMailByIndex } = require('./inboxStore');
require('dotenv').config();

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/mails/:inbox', (req, res) => {
  const inbox = req.params.inbox;
  res.json(getMails(inbox));
});

app.get('/api/mails/:inbox/:id', (req, res) => {
  const { inbox, id } = req.params;
  res.json(getMailByIndex(inbox, id));
});

app.get('/api/domains', (req, res) => {
	const raw = process.env.MAIL_DOMAINS || '';
	const domains = raw.split(';').map(d => d.trim()).filter(Boolean);
	res.json(domains);
});

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
  },
});

smtp.listen(2525, () => console.log('SMTP listening on port 2525'));
app.listen(3000, () => console.log('HTTP API on port 3000'));
