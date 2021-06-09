document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-total').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  //Clear out composition fields

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#submit').addEventListener('click', send_email);
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-total').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails
      emails.forEach(element => {
        if (mailbox === "inbox" || mailbox === "archive") {
          person = element.sender;
        }
        else {
          person = element.recipients;
        }
        const email = document.createElement('li');
        email.className = "mail"
        if (element.read === false) {
          email.classList.add("list-group-item");
        }
        else {
          email.classList.add("list-group-item", "list-group-item-secondary")
        }
        email.innerHTML = `<div class="container">
            <div class="row">
              <div class="col">
                <strong>${person}</strong>
              </div>
              <div class="col-6">
                ${element.subject}
              </div>
              <div class="col">
                ${element.timestamp}
              </div>
            </div>
          </div>`;
        email.addEventListener('click', () => {
          console.log(element.read);
          read_email(element.id);
          view_email(element.id, mailbox);
        });
        document.querySelector('#emails-view').append(email);
        console.log(element);
      })
      // console.log(emails);

      // ... do something else with emails ...
    });
}


function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value
  const subject = document.querySelector('#compose-subject').value
  const body = document.querySelector('#compose-body').value
  fetch('/emails', {
    method: 'POST',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      if (result.message) { load_mailbox('sent') }
      else { alert(result.error) }

      console.log(result);
    })
    .catch(error => console.log(error));
  return false

}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-total').style.display = 'block';
  const viewing = document.querySelector('#email-total');

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      viewing.innerHTML = `<div><strong>From</strong>:${email.sender}</div>
                            <div><strong>To</strong>:${email.recipients}</div>
                            <div><strong>Subject</strong>:${email.subject}</div>
                            <div><strong>TimeStamp</strong>:${email.timestamp}</div>
                            <hr>
                            <div>${email.body}</div>`;
      let ele = document.createElement('button');
      if (mailbox === "sent") return
      if (email.archived === false && mailbox != "sent") { ele.innerHTML = "archive"; }
      if (email.archived === true && mailbox != "sent") { ele.innerHTML = "Unarchive"; }
      ele.addEventListener('click', () => {
        toggle_state(id, email.archived);

      });
      viewing.appendChild(ele);
      let reply = document.createElement('button');
      reply.innerHTML = "Reply";
      reply.addEventListener('click', () => reply_email(email.sender, email.subject, email.timestamp, email.body))
      viewing.appendChild(reply);
    })
    .catch(error => console.log(error));
}

function read_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    body: JSON.stringify({
      read: true
    })
  })

}

function toggle_state(id, state) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    body: JSON.stringify({
      archived: !state
    })
  }).then(() => load_mailbox('inbox'))
}

function reply_email(recevier, subject, timestamp, body) {
  compose_email()
  if (!/^Re/.test(subject)) subject = 'Re: ' + subject;
  prefill = `On ${timestamp} ${recevier} wrote:\n${body}\n`;
  document.querySelector('#compose-recipients').value = recevier;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = prefill;

}
