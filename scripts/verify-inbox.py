import imaplib, json, email
from pathlib import Path

credentials=json.loads(Path('.private/business.json').read_text())
client=imaplib.IMAP4_SSL('imap.purelymail.com',993,timeout=20)
client.login(credentials['email'],credentials['password'])
client.select('INBOX',readonly=True)
status,result=client.search(None,'SUBJECT','"Verificaci"')
ids=result[0].split()
if not ids:
    status,result=client.search(None,'ALL')
    ids=result[0].split()
found=False
for uid in ids[-10:]:
    status,parts=client.fetch(uid,'(BODY.PEEK[HEADER])')
    raw=b''.join(item[1] for item in parts if isinstance(item,tuple))
    message=email.message_from_bytes(raw)
    subject=str(email.header.make_header(email.header.decode_header(message.get('Subject',''))))
    if subject=='Verificación de correo Hablemos30min':
        found=True
        print('Test message received in business inbox')
        authentication=' '.join(message.get_all('Authentication-Results',[]))
        print('DKIM pass:', 'dkim=pass' in authentication, 'SPF pass:', 'spf=pass' in authentication)
        Path('.private/inbox-verification.json').write_text(json.dumps({'received':True,'dkimPass':'dkim=pass' in authentication,'spfPass':'spf=pass' in authentication}))
        break
client.logout()
if not found:
    print('Test message not yet visible in inbox')
