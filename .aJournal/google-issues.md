
## Et tu, Google?

I am having trouble getting started with a "sign-in with Google" / "Google Identity Services"
example.  Ultimately, I want to have a sign-in with Google option as one of several SSO provider options (Apple, Microsoft, Google, Facebook, etc)

Following examples from [this tutorial](https://developers.google.com/people/quickstart/js)
and I've double-checked I've gotten my OAuth clientID and API key set up as
instructed.

Specifically, I have registered my server as a Javascript Origin domain, as instructed,
but when I run the sample HTML, I get an uncaught exception error 'idpiframe_initialization_failed'
with the detail that the origin is not registered for my client Id.
But it is! (or at least it sure looks like it in the google console).
I've clicked the 'Save' button, and the values remain if I leave and come back, so this info is recorded somewhere at least.

I've tried this both on a named public server as well as my own localhost setup,
(registering each origin separately as well as together), but get the same results either way.

What am I missing?

Apparently, it's hard to save things on the google portal. 
Got it to stick finally. all is good for now.

---------------

##### 9/23 new issue

I have it all working in a web page

- [ ] still need to make better styled buttons, but I'm hoping Jessica can help me with that

__The problem is__ that Google has locked out Electron as a supported browser,
which is weird because it's a Chromium browser.  But alas.  

So instead of the sexy-cool popup window we will need to launch
the native browser of the OS. We need to do this for Mobile anyway
(where we don't have a native SSO solution directly), so it's not
a huge deviation from plan.  It just sucks.

General idea
- launch the other browser, and start polling.  Polling will end when
other browser finishes it's business because of our callback.
  
- Seems simple enough.  

- Probably biggest issues will be around window management confusion.  Is there a
way to force our Electron top to become the topmost active app window?
  ( mainwindow.hide(); mainwindow.show(); seems to be one answer).
  


