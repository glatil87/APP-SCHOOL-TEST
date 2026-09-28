# Putting the app online with AWS

These steps put the app on a private-looking web address you can open on your
phone. Nothing here needs technical knowledge. It takes about 10 minutes the
first time; after that, the app updates itself every time new work is saved.

> Until the sign-in step is built, the app has no real reports in it, so there
> is nothing private to protect yet.

## Steps

1. Sign in to the AWS website (console.aws.amazon.com).
2. In the search bar at the top, type **Amplify** and open **AWS Amplify**.
3. Click **Create new app** (it may say **Deploy an app**).
4. Choose **GitHub** and click **Next**. A GitHub window will ask you to allow
   AWS to see your code — click **Authorize**, and if asked which
   repositories, choose **APP-SCHOOL-TEST**.
5. Pick the repository **APP-SCHOOL-TEST** and the branch
   **claude/school-lost-found-v1-5ff0x0**. Click **Next**.
6. On the settings page, leave everything as it is (the app already contains
   the settings AWS needs). Click **Next**, then **Save and deploy**.
7. Wait about 5 minutes. When all steps show green ticks, click the web
   address shown (it ends in `amplifyapp.com`). Open that address on your
   phone.

**Tip:** on iPhone, open the address in Safari, tap the Share button, then
**Add to Home Screen** — it will then open like an app.

## Cost

AWS Amplify has a free allowance for new accounts; for a small pilot like
this the cost after that is usually very small. To be safe, you can set a
monthly spending alert: search **Budgets** in the AWS console, click
**Create budget**, choose **Monthly cost budget**, and enter an amount such as
$5 with your email address.

## If something goes wrong

If a step shows a red cross, copy the message (or take a screenshot) and send
it to Claude.
