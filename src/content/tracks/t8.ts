import type { Exercise, Track } from '../types';

/**
 * Track 8: The web platform.
 *
 * Goal: the HTTP, auth and security questions every full stack loop contains,
 * including the one that opens half of them ("you type a URL and press enter")
 * and the security trio every interviewer has a version of.
 */

export const t8Exercises: Exercise[] = [
  {
    id: 't8-01',
    trackId: 't8',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'http-verbs',
    prompt: 'A user changes only their display name. **Which verb fits?**',
    options: [
      { text: '`PATCH`, because one part of the resource is changing', correct: true },
      {
        text: '`PUT`, because the user record is being updated',
        whyWrong:
          '`PUT` means "here is the whole resource, replace what you have". Send only the name and a strict server is entitled to blank every other field.',
      },
      {
        text: '`POST`, because the client is sending data to the server',
        whyWrong:
          'Every verb except `GET` sends data. `POST` is for creating something new or for an action that does not fit the others, and sending it twice makes two of whatever it made.',
      },
      {
        text: '`GET` with the new name in the query string',
        whyWrong:
          '`GET` is for reading, and it is expected to change nothing. Browsers, proxies and crawlers all take that promise seriously, so a `GET` that writes will eventually be replayed by something.',
      },
    ],
    explanation:
      '`PATCH` is a partial update: send the fields that changed. `PUT` is a full replacement, so the body has to carry the whole resource. `POST` creates. Interviewers ask this to hear whether you know `PUT` and `PATCH` differ at all, because plenty of people use them interchangeably.',
  },
  {
    id: 't8-02',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'http-verbs',
    prompt:
      'The network dropped and your request may or may not have arrived. **Which is safe to just send again?**',
    options: [
      { text: '`PUT` and `DELETE`, because repeating them lands in the same place', correct: true },
      {
        text: 'All of them, since the server can spot the duplicate',
        whyWrong:
          'Only if you built that, with a key the client sends and the server remembers. Nothing in HTTP does it for you.',
      },
      {
        text: '`POST`, because the server has not confirmed anything yet',
        whyWrong:
          'Backwards, and this is the expensive version of the mistake. The first `POST` may well have succeeded with the response lost on the way back, so sending it again charges the card twice.',
      },
      {
        text: 'None of them once the connection has dropped',
        whyWrong:
          'Too cautious to be useful. Retrying is normal and necessary. The question is which requests you can retry without thinking about it.',
      },
    ],
    explanation:
      'The word is idempotent: doing it again lands you where doing it once did. `PUT` sets a value, so setting it twice is the same value. `DELETE` removes a thing, and it stays removed. `POST` creates, so twice means two. When a `POST` has to be retryable, give it an idempotency key the server can recognise.',
  },
  {
    id: 't8-03',
    trackId: 't8',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'status-codes',
    prompt:
      "A signed-in user opens someone else's invoice. They are logged in, and not allowed. **What do you return?**",
    options: [
      { text: '`403 Forbidden`', correct: true },
      {
        text: '`401 Unauthorized`',
        whyWrong:
          '`401` means "I do not know who you are, go and authenticate". They already did. Sending `401` tends to bounce a perfectly valid session back to the login page.',
      },
      {
        text: '`400 Bad Request`',
        whyWrong:
          'The request is perfectly well formed. `400` is for a request the server cannot parse or accept on its face, not one it refuses on permission.',
      },
      {
        text: '`404 Not Found`',
        whyWrong:
          'A deliberate choice in some systems, to avoid confirming the invoice exists. Worth saying out loud as a security trade-off, but the plain answer to this question is `403`.',
      },
    ],
    explanation:
      'The pair everyone mixes up: `401` is "who are you?", `403` is "I know who you are, and no". The names do not help, since `401` is the one called Unauthorized. Say the plain-words version in an interview and the confusion never comes up.',
  },
  {
    id: 't8-04',
    trackId: 't8',
    type: 'match',
    difficulty: 1,
    conceptId: 'status-codes',
    prompt: 'Pair each message with the code that carries it.',
    pairs: [
      {
        left: 'Created, and here is where it lives',
        right: '201',
        why: 'The 2xx family means it worked, and 201 adds that something new now exists, with the Location header saying where to find it.',
      },
      {
        left: 'Moved, and not coming back',
        right: '301',
        why: 'The 3xx family sends you elsewhere, and 301 says the move is permanent, so clients and search engines should update the link.',
      },
      {
        left: 'Your request is malformed',
        right: '400',
        why: 'The 4xx family blames the caller, and 400 says the request could not be read at all, so sending it again unchanged will fail again.',
      },
      {
        left: 'No such thing here',
        right: '404',
        why: 'Also a caller error: the address was understood but nothing lives at it, which is different from being refused access.',
      },
      {
        left: 'Down for now, try again shortly',
        right: '503',
        why: 'The 5xx family blames the server, and 503 says it is temporarily unable to cope, so the same request may well work in a moment.',
      },
    ],
    explanation:
      'The first digit carries the headline: 2 worked, 3 go elsewhere, 4 the caller got it wrong, 5 the server did. That alone answers most of the question, and the specific codes above are the ones that come up in API design rounds.',
  },
  {
    id: 't8-05',
    trackId: 't8',
    type: 'steps',
    difficulty: 2,
    conceptId: 'url-journey',
    prompt: 'You type a URL and press enter. **Put the journey in order.**',
    steps: [
      'Turn the name into an address: DNS says which server to talk to',
      'Open the connection and agree on encryption: TCP, then the TLS handshake',
      'Send the request: GET, the path, and the headers',
      'The server answers with a status, headers and the HTML',
      'The browser parses the HTML and fetches what it references',
      'It paints the page, and runs the scripts it picked up',
    ],
    explanation:
      'This is the most-asked question on the whole platform, and it is asked because it goes as deep as you can take it. Six steps in plain words is a complete answer, and every one of them is a door: they can ask what DNS caches, what TLS agrees on, what blocks the parser. Know the shape first, then the depth.',
  },
  {
    id: 't8-06',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'cors',
    prompt:
      'Your fetch works in the terminal and fails in the browser with a CORS error. **Who blocked it?**',
    options: [
      {
        text: 'The browser, after the server answered without the header that permits your origin',
        correct: true,
      },
      {
        text: 'The server, which rejected the request because of its origin',
        whyWrong:
          'The server usually handled it and replied normally. The browser then refused to hand the reply to your code, which is why the request shows up in the server logs as a success.',
      },
      {
        text: 'A proxy or firewall between the two',
        whyWrong:
          'Nothing in the middle is involved. This is a rule the browser enforces on its own, which is exactly why the terminal is unaffected.',
      },
      {
        text: 'The browser, because the request was sent to a different port',
        whyWrong:
          'A different port is indeed a different origin, so it can trigger this. But the block comes from the missing permission in the reply, not from the port itself.',
      },
    ],
    explanation:
      'CORS is enforced by the browser, on behalf of the user, against pages reading data from other origins. The server has to opt in by answering with `Access-Control-Allow-Origin`. This is why "it works in Postman" is the classic symptom: nothing outside a browser applies the rule.',
  },
  {
    id: 't8-07',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'cors',
    prompt:
      'Before your `DELETE` goes out, the browser sends an `OPTIONS`. **Why, and what next?**',
    options: [
      {
        text: 'It is asking permission first, and will send the real request only if the answer allows that method and headers',
        correct: true,
      },
      {
        text: 'It is checking that the server is reachable before sending the body',
        whyWrong:
          'Nothing about reachability. The browser is asking whether it is allowed to send this particular request across origins.',
      },
      {
        text: 'It happens on every cross-origin request',
        whyWrong:
          'Simple ones are exempt: a plain `GET` or `POST` with an everyday content type goes straight out. A `DELETE`, or a custom header like `Authorization`, is what triggers the ask.',
      },
      {
        text: 'The server is redirecting the request through `OPTIONS` first',
        whyWrong:
          'The server never asked for this. The browser sends the preflight on its own, before your code sees anything.',
      },
    ],
    explanation:
      'Anything beyond a simple request gets a preflight: an `OPTIONS` asking "may I send a `DELETE` with these headers?". The server has to answer with the allowed origin, methods and headers, or the real request never leaves. A `max-age` on that answer is what stops it happening before every single call.',
  },
  {
    id: 't8-08',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'cookies-tokens',
    prompt: '**"Where would you keep the token?"** What does each answer cost you?',
    options: [
      {
        text: 'An httpOnly cookie: script cannot read it, so you handle CSRF with SameSite and a token',
        correct: true,
      },
      {
        text: 'localStorage, because it is not sent automatically so CSRF cannot happen',
        whyWrong:
          'The CSRF half is right and the price is steep: any script that runs on your page can read localStorage, so one XSS hole hands over the token itself.',
      },
      {
        text: 'localStorage, because cookies are legacy',
        whyWrong:
          'Cookies are not legacy, they are the only place the browser will keep something JavaScript cannot read. That property is the entire point.',
      },
      {
        text: 'In memory only, so nothing survives the tab closing',
        whyWrong:
          'Genuinely the safest, and it logs the user out on every refresh. Worth naming as the trade-off, but it is not the answer to "where do you keep it".',
      },
    ],
    explanation:
      'There is no free option, and interviewers ask precisely to see whether you know that. localStorage is readable by any script, so XSS takes the token. An httpOnly cookie is unreadable by script but travels automatically, which is what CSRF abuses. Pick the cookie and defend against CSRF, and say why out loud.',
  },
  {
    id: 't8-09',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'auth-flows',
    prompt: 'Sessions or tokens: **what actually differs when you run more than one server?**',
    options: [
      {
        text: 'A session lives on the server, so every server needs to reach it. A token carries its own claims, so any server can check it',
        correct: true,
      },
      {
        text: 'Tokens are encrypted and sessions are not',
        whyWrong:
          'A normal JWT is signed, not encrypted: anyone holding it can read the contents. Signing proves nobody tampered with it, which is a different promise.',
      },
      {
        text: 'Sessions expire and tokens do not',
        whyWrong:
          'Both expire. The awkward part is the reverse: a session can be destroyed on the spot, and a token stays valid until it expires unless you build a list to revoke it.',
      },
      {
        text: 'Tokens work across domains and sessions cannot leave one',
        whyWrong:
          'Cookies can be scoped across subdomains, and tokens face their own cross-origin rules. This is not the difference that matters when you scale out.',
      },
    ],
    explanation:
      'A session id is a claim ticket: meaningless on its own, and the server looks it up. A token is the document itself, signed, so any server holding the key can verify it without a lookup. That is the scaling argument, and revocation is the price: killing a session is instant, killing a token needs a list.',
  },
  {
    id: 't8-10',
    trackId: 't8',
    type: 'steps',
    difficulty: 3,
    conceptId: 'auth-flows',
    prompt: '**Order "log in with Google"**, in plain words.',
    steps: [
      'Your app sends the user to Google, saying who is asking and what for',
      'Google signs the user in and asks whether they consent',
      'Google sends them back to your app with a short-lived code',
      'Your server swaps that code for tokens, over its own connection',
      'Your server reads who the user is and starts its own session',
    ],
    explanation:
      'The detail worth knowing is why there is a code at all: the redirect passes through the browser, where the user can read it, so what travels there is useless on its own. The swap happens server to server, with your client secret, and only that step yields tokens. "The code is public, the exchange is not" is the sentence to have ready.',
  },
  {
    id: 't8-11',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'xss',
    prompt: "You render a user's bio as HTML so they can use bold. **What have you allowed?**",
    options: [
      {
        text: 'Any script they put in it runs as your page, with access to everything your page has',
        correct: true,
      },
      {
        text: 'They can break your layout with unclosed tags',
        whyWrong:
          'True and cosmetic. The reason this is a security question is that a `<script>` tag, or an `onerror` on an image, runs as your origin.',
      },
      {
        text: 'Nothing, as long as the bio is stored escaped in the database',
        whyWrong:
          'Escaping on the way in is not the same as escaping on the way out, and it breaks the moment another feature writes to the same field. Escape where you render.',
      },
      {
        text: 'They can link to other sites from their profile',
        whyWrong:
          'They could do that with plain text and a link. The new capability is running code inside your page.',
      },
    ],
    explanation:
      'XSS is smuggling script into a page other people load. It runs as your site, so it can read anything script can read: the DOM, localStorage, cookies without httpOnly. The defence is to escape by default, which React does, and to sanitize with a real library on the rare occasion you must render HTML.',
  },
  {
    id: 't8-12',
    trackId: 't8',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'xss',
    prompt: 'One line here opens the door to XSS. **Tap it.**',
    code: {
      lang: 'js',
      source: `function showComment(comment) {
  const el = document.createElement('div');
  el.className = 'comment';
  el.innerHTML = comment.body;
  list.append(el);
}`,
    },
    buggyLineIndex: 3,
    lineHints: {
      1: 'Creating an element is fine. Nothing from the user has touched it yet.',
      2: 'Setting a class you control is safe. The value never came from anyone.',
      4: 'Appending is fine. Whatever damage there is happened a line earlier.',
    },
    explanation:
      '`innerHTML` parses what you give it, so a comment body containing a tag becomes a real element, and `<img src=x onerror=...>` runs. `el.textContent = comment.body` puts the exact characters on screen and parses nothing. Reach for `textContent` unless you truly need markup, and sanitize when you do.',
  },
  {
    id: 't8-13',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'csrf',
    prompt:
      'A user is logged into your bank app. They open another site, which quietly posts to your transfer endpoint. **Why does it work?**',
    options: [
      {
        text: 'The browser attaches your cookies to the request, whoever started it',
        correct: true,
      },
      {
        text: 'The other site can read the session cookie and copy it',
        whyWrong:
          'It cannot. Cookies are readable only by their own origin. The attack never needs to read the cookie, because the browser sends it unprompted.',
      },
      {
        text: 'Your CORS setup lets the other origin through',
        whyWrong:
          'CORS governs reading the reply. The transfer already happened by then, so a blocked response is no comfort at all.',
      },
      {
        text: 'The user must have been phished for their password first',
        whyWrong:
          'No password is involved. The whole point is that the user is already logged in, and their own browser does the rest.',
      },
    ],
    explanation:
      'CSRF rides on the cookie being automatic. Two defences, and you want both: `SameSite` on the cookie, which tells the browser not to attach it to requests from other sites, and a CSRF token the attacker cannot guess or read. Note that this is exactly the weakness the httpOnly cookie trades XSS safety for.',
  },
  {
    id: 't8-14',
    trackId: 't8',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'sql-injection',
    prompt: 'Tap the line that lets a visitor read the whole table.',
    code: {
      lang: 'js',
      source: `async function findUser(email) {
  const sql =
    "SELECT * FROM users WHERE email = '" + email + "'";
  const rows = await db.query(sql);
  return rows[0];
}`,
    },
    buggyLineIndex: 2,
    lineHints: {
      1: 'Starting to build the query is fine. It is what gets pasted in that matters.',
      3: 'Running the query is fine. By this point the damage is already in the string.',
      4: 'Returning the first row is fine, and not the problem.',
    },
    explanation:
      'The email is pasted straight into the query, so an input containing a quote ends the string and the rest is read as SQL. Parameters fix it: `db.query("... WHERE email = ?", [email])` sends the query and the value separately, so the database treats the value as a value and never as instructions. Never build SQL by concatenation.',
  },
  {
    id: 't8-15',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'caching-headers',
    prompt: '**"How do you stop the browser downloading this every time?"**',
    options: [
      {
        text: '`Cache-Control: max-age` skips the request entirely; an `ETag` still asks, but gets a small "unchanged" back',
        correct: true,
      },
      {
        text: 'An `ETag`, because it stops the request being made',
        whyWrong:
          'The request still goes out. What the `ETag` saves is the body: the server answers `304` with nothing attached if the file has not changed.',
      },
      {
        text: '`Cache-Control: no-cache`, which caches it but checks first',
        whyWrong:
          'That is roughly what it does, confusingly, and it is the opposite of what was asked. `no-store` is the one that caches nothing at all.',
      },
      {
        text: 'Whichever, they do the same thing by different means',
        whyWrong:
          'The difference is exactly what is being asked. One avoids the round trip and one avoids the download; you use them for different kinds of file.',
      },
    ],
    explanation:
      'Two levers. `max-age` means "do not even ask for this long", which is why hashed asset filenames get a year. An `ETag` means "ask, and I will tell you if it changed", which suits documents that change unpredictably. The trade is staleness against a round trip, and naming that trade is the answer.',
  },
  {
    id: 't8-16',
    trackId: 't8',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Pair each description with the term an interviewer wants to hear.',
    pairs: [
      {
        left: 'The browser refuses the cross-site read',
        right: 'CORS',
        why: 'The browser blocks a page from reading another origin unless that server sends headers allowing it, so this is a rule being enforced, not an attack.',
      },
      {
        left: 'A script smuggled into the page',
        right: 'XSS',
        why: 'Untrusted input ends up rendered as markup instead of text, so the attacker code runs in the page with the same access as your own.',
      },
      {
        left: 'A forged request from another site',
        right: 'CSRF',
        why: 'The browser attaches the cookies automatically, so a request fired from another site arrives already logged in unless a token proves the user meant it.',
      },
      {
        left: 'A quote that breaks out of the query',
        right: 'SQL injection',
        why: 'Input pasted into the query text can close the value and start new SQL, which is why values have to be sent as parameters instead.',
      },
    ],
    explanation:
      'These four get described far more often than they get named, and the name is what gets scored. CORS is a rule the browser enforces, not an attack. The other three are attacks, and the giveaway in each description is where the untrusted thing ends up: in the page, in a request, or in a query.',
  },
  {
    id: 't8-17',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'cors',
    prompt:
      'A GET to your API works from the browser address bar and fails from your app with a CORS error. What is going on?',
    promptVariants: ['The same URL loads fine in a new tab and is blocked from your page. Why?'],
    options: [
      {
        text: "A typed URL is not a cross-origin request. Only the page's own fetch is subject to the check",
        correct: true,
      },
      {
        text: 'The server is down for programmatic requests but up for browsers',
        whyWrong:
          'It is the same server and the same request. The difference is entirely in what the browser does with the response, not in what the server does with the request.',
      },
      {
        text: 'The app is sending a malformed request',
        whyWrong:
          'A malformed request comes back as a 400 from the server. A CORS error is the browser refusing to hand you a response it did receive.',
      },
      {
        text: 'The API needs to allow the GET verb',
        whyWrong:
          "GET is allowed by default for simple requests. What is missing is the header naming your page's origin as permitted.",
      },
    ],
    explanation:
      "Typing a URL makes the page itself, so there is no other origin involved and nothing to check. A `fetch` from your app is one origin asking for another's data, and the browser will not hand the response to your JavaScript unless the server says the origin is allowed. The fix is `Access-Control-Allow-Origin` on the server, never anything in your fetch call.",
  },
  {
    id: 't8-18',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'status-codes',
    prompt:
      'A sign-up request arrives with a valid, well-formed email that someone already registered. Which status?',
    promptVariants: [
      'The request body is perfectly valid, but the email is taken. What do you return?',
    ],
    options: [
      {
        text: '409 Conflict. The request is valid, it conflicts with the current state',
        correct: true,
      },
      {
        text: '422 Unprocessable Content',
        whyWrong:
          '422 says the shape is right but the values do not make sense on their own. Here the email is entirely valid, and the problem only exists because of what is already stored.',
      },
      {
        text: '400 Bad Request',
        whyWrong:
          '400 means the server could not understand the request. This one was understood perfectly, which is how the server knows the email is taken.',
      },
      {
        text: '200 with an error message in the body',
        whyWrong:
          'A 200 tells every proxy, client library and retry policy that things went fine. Hiding failures inside a success is how retries end up doing the wrong thing.',
      },
    ],
    explanation:
      'The line worth remembering: 400 is "I cannot parse this", 422 is "I parsed it and the values are wrong", 409 is "I parsed it, the values are fine, and it clashes with what already exists". Duplicate registration is the textbook 409. Interviewers ask this precisely because most people reach for 400 for everything.',
  },
  {
    id: 't8-19',
    trackId: 't8',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'cookies-tokens',
    prompt:
      'This session cookie survives a security review nowhere. **Tap the line that makes it stealable by injected script.**',
    code: {
      lang: 'js',
      source: `res.cookie('session', token, {
  secure: true,
  httpOnly: false,
  sameSite: 'lax',
  maxAge: 3600000,
});`,
    },
    buggyLineIndex: 2,
    lineHints: {
      1: '`secure: true` keeps the cookie off plain HTTP, which is exactly what you want.',
      3: "`sameSite: 'lax'` is a reasonable default and blocks most cross-site sends.",
      4: 'A one hour lifetime is a policy choice, not a hole.',
    },
    explanation:
      '`httpOnly: false` lets any JavaScript on the page read the cookie with `document.cookie`, so a single successful XSS hands over the session. With `httpOnly: true` the browser still sends it on every request but never exposes it to script. The other three lines are all doing their job.',
  },
  {
    id: 't8-20',
    trackId: 't8',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'caching-headers',
    prompt:
      'You deployed an hour ago and some users still see the old JavaScript. The file was served with `Cache-Control: max-age=86400`. What now?',
    promptVariants: [
      'Old bundles are still being served from browsers a day after the deploy. What is the fix?',
    ],
    options: [
      {
        text: 'Give each build a new filename, and keep the long cache on those hashed files',
        correct: true,
      },
      {
        text: 'Lower `max-age` to a few minutes',
        whyWrong:
          'It shortens the window without closing it, and it throws away the caching you wanted. Every user now re-downloads the bundle several times a day for nothing.',
      },
      {
        text: 'Ask users to hard refresh',
        whyWrong:
          'It is not a fix, it is a support burden, and most users will never see the request. The browser is doing exactly what the header told it to.',
      },
      {
        text: 'Add `no-store` to the HTML and leave the JavaScript alone',
        whyWrong:
          'Half right and worth saying: the HTML does need to be fresh. On its own it does not help, because the fresh HTML still points at the same cached filename.',
      },
    ],
    explanation:
      'The standard arrangement is two rules, not one. Content-hashed asset names get a very long cache because a change produces a new name, and the small HTML that points at them is never cached. That way a deploy is visible immediately and nothing is downloaded twice. Naming both halves is the complete answer.',
  },
];

export const t8: Track = {
  id: 't8',
  title: 'The web platform',
  icon: 'globe',
  tagline: 'HTTP, auth, and the security questions they always ask.',
  lessons: [
    { id: 't8-l1', title: 'Verbs and codes', exerciseIds: ['t8-01', 't8-02', 't8-03', 't8-04'] },
    {
      id: 't8-l2',
      title: 'The journey, and what the browser allows',
      exerciseIds: ['t8-05', 't8-06', 't8-07', 't8-15'],
    },
    { id: 't8-l3', title: 'Staying logged in', exerciseIds: ['t8-08', 't8-09', 't8-10'] },
    {
      id: 't8-l4',
      title: 'The security trio',
      exerciseIds: ['t8-11', 't8-12', 't8-13', 't8-14', 't8-16'],
    },
    {
      id: 't8-l5',
      title: 'Answers the browser gives back',
      exerciseIds: ['t8-17', 't8-18', 't8-19', 't8-20'],
    },
  ],
};
