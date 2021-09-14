
#### Ready to start

- we have created this space with the newly minted `tbx init` command
so that is at least out of the way
  
 - We have a tremho.com service we can work with.
 - We've added a useable webAPI to Jove so we can call it and others.

- We can start with the [Apple docs for their JS solution](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)

-----

After some exploration, it looks like we can only do a pure web solution
for this unless we go native.

[Here is a series of tutorials](https://sarunw.com/posts/sign-in-with-apple-1/)
that have some good info.

You only get user info (name/email) on the first sign in. After that,
you will only get the consistent token id.

The REST apis are for use after you've collected a token from Apple, but
not for getting one.

##### Dual implementation
For Electron, we'll do a web-assisted flow.  For Nativescript, we
can use native app features of iOS, and for Android we'll use a web-assisted
version.

##### Our version of the dance
Let's do this like we did for Alexa validation at INRIX:

- In app, we initiate the need to sign-in.
- the app sends a 'get ready' message to tremho server with ids
- we launch a web page that embeds the apple sign-in flow.
- the conclusion of this hits our apple-sso redirect at tremho.
- we bind this together at the server and validate/create a user session
or else note the validation error
- app polls server for status and results

###### Steps for doing this

- [x] Make a web page for sign-in following tutorial 
- [x] Receive callback from apple at our apple-sso service
- [x] make apple-sso decode and store registration info in a user object
  that we will later validate with association and log-in.
- [ ] Launch this as a window in Electron.  
- [ ] Make the prepare-sso service and rework it and apple-sso for proper 
validation and association.
- [ ] create the poll service.  Use JWT for secure access here between
prepare and poll operations.
  
###### prepare and poll

- App asks for an association token.  A JWT token for this is issued if
the app is recognized, expiration 1 day.
- App asks to prepare, sending assoc token.  If approved, a spot is created
and a new token is issued, expiration 1 hour or less (user sign-in time)
- App polls for results using this prep token.   

### Full monte
Once we get this working for Apple under Electron,
see if we can get it to work on Nativescript / Web (e.g. Android).

Then implement a native iOS solution.

Then return to the web for other SSO providers

At this point we should have a nice solution for our apps across the board.

------

We're staged for a hacky mock in tremho-services, so  
- [x] build out the dance steps as commented in main-page.ts 
- [x] deploy the latest and run the test

If all that looks good, then work on the ssoManager (slot machine)
and the JWT siaToken handling.

###### loose ends
we are not setting the state on the webpage for the auth post.
getting placeholder [STATE] as a return.  
This should be the siaToken passed through, and we should
call SsoManager method below to verify it and make this the
first step in the validation before submitting data.

##### SsoManager
- reserve a slot and note the time
- issue a JWT siaToken and name the slot id
- verify siaToken JWT was one we issued and extract the slot id
- record data at the slot id
- get data from the slot id then recycle slot

##### UserManager
- associate user with existing account by provider token
- failing that, align emails if possible
- failing that, it's a new user

_thinking about mis-aligning an email_
- ask the provider to verify our recorded token and double check the email
  to see if there was a missed change.
- implement the relay change notification service for this purpose.
- A bad actor couldn't impersonate an email unless they have already
co-opted it with the SSO provider as well.
- emails are unique, so there should be no collision.
- a fake email might not align a true user, but never collide with
a different one.  Worst case is you become a new user again.
  
_we can ask the (new) user if they think they already have an account_

###### mitigation
if they can give us the other email, and we find that, we can send a mail there, and a mail to 
the 'new email' and if we get positive responses we can validate it.
Or a no-response for the 'fake' email is probably okay after a time.
-----

#### 9/10/21

__Okay!__ after having to go to StackOverflow with a JWT question,
and after debugging my own issues, I have it working.

- I need to implement a better polling strategy.
- a 1 hour slot timeout is probably too long. Who takes an hour to log in?
- maybe 10-20 minutes (15?)
- on timeout, close login window and pop up a timeout alert, please try again

###### Web page usage

we can use this to limit access to apps, and for contact.

/access (mode)

- start the dance steps
 -- we may need to separate the step functions from the endpoint calls first
 
  - then we can conduct this like we do at the client
  - then send cred data to contact page form or whitelist redirect
  
####### Others
- [Microsoft](https://developer.microsoft.com/en-us/identity/add-sign-in-with-microsoft)
- [Google](https://developers.google.com/identity/sign-in/web/sign-in)
- [Amazon](https://developer.amazon.com/apps-and-games/login-with-amazon)
- [Github](https://www.back4app.com/docs/platform/sign-in-with-github)
- [LinkedIn](https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin)
- [Facebook](https://developers.facebook.com/docs/facebook-login)
- [Instagram](https://developers.facebook.com/docs/instagram-basic-display-api/overview#user-token-generator)


-------------
Moving this journal to tremho-services... where it is better suited
for the next set of discussions.

###### Service handler
wrap around webSend to simplify api calls

- send current session id in header, get next session id from response header
- we'll name our headers X-TBD-SESSION-ID and X-TBD-NEXT-SESSION-ID
- format parameters (update websend handling of this too for propname/value)
- responses contain response metadata or error info and a data property.


###### Another idea for polling
in our server implementation we have a promise resolve when the
redirect comes back.
So we can make our sign in check do a promise race between that
promise and a max-wait timer.  This will tell us immediately if
the data is returned within this window, or hold us waiting.
we can repeat this call until we get success.


##### Reimagined main test

- establish session
- call a whoami api as unknown and force a log in
- call a whoami api that confirms server knows us  
- persist session, exit app

- rehydrate session
- server knows who we are when we call whoami, no login neccesary

