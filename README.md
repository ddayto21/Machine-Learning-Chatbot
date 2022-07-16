# [Dialogflow - Fulfillment Service: Node.js Backend](https://dialogflow.cloud.google.com)

**Table of Contents:**

* [Quickstart](#quickstart)
  * [Before you begin](#before-you-begin)
  * [Installing the client library](#installing-the-client-library)
  * [Using the client library](#using-the-client-library)
* [Samples](#samples)
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)


### Before you begin

1.  [Select or create a Cloud Platform project][projects].
1.  [Enable billing for your project][billing].
1.  [Enable the Dialogflow API API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

## BACKEND SERVICE 
- URL: https://552d-2620-df-8000-5701-0-2-1d46-9f26.ngrok.io/webhook
- This backend service receives POST requests from the client application in the form of the response to a user query matched by intents with webhook enabled. 
- Ensure that your web service meets all the webhook requirements specific to the API version enabled in this agent. 

## STEP 1: RUN SERVICE.JS ON LOCAL HOST
>>> node service.js

### STEP 2: USE NGROK TO CREATE A PUBLIC ENDPOINT
>>> ngrok http [port]

## STEP 3: COPY THE ENDPOINT (FORWARDING LINK) FROM TERMINAL 
- For this particular service, the public endpoint was: https://d81c-2601-1c2-8100-6540-5ddd-a1c3-a27f-aeaf.ngrok.io

## STEP 4: ADD '/webhook' TO END OF YOUR PUBLIC ENDPOINT
- Example: https://d81c-2601-1c2-8100-6540-5ddd-a1c3-a27f-aeaf.ngrok.io/webhook

## STEP 5: ADD YOUR PUBLIC ENDPOINT TO DIALOGFLOW CHATBOT
- Navigate to https://dialogflow.cloud.google.com
- On the left side of the page, click the 'Fulfillment' tab
- In the 'Webhook' section, click 'Enable'
- Enter your public endpoint in the 'URL' field
- Click 'Save' at the bottom of the page
  - You can define when you want to send webhooks to this public endpoint in the DialogFlow console

## Create a Dialogflow Client
- const dialogflow = require('dialogflow');
- const sessionClient = new dialogflow.SessionsClient({
  projectId,
  credentials,
});

## Project ID
- You can find your project ID in your Dialogflow agent settings
const projectId = '<project-id-here>';
const sessionId = '<put-chat-session-id-here>';



## REDIS CACHE (Node.JS)
https://docs.redis.com/latest/rs/references/client_references/client_nodejs/
- To use Redis with Node.js, you need to install a Node.js Redis client. The following sections explain how to use node_redis, a community-recommended Redis client for Node.js.
- Another community-recommended client for Node.js developers is ioredis. You can find additional Node.js clients for Redis in the Node.js section of the Redis Clients page.

# STEP 1: Install node_redis 
>>> npm install node_redis

# Step 2: Connect to Redis Instance
- The following code creates a connection to Redis:
const redis = require('redis');

# Step 3: Create a new Redis Client
const client = redis.createClient({
    socket: {
        host: '<hostname>',
        port: <port>
    },
    password: '<password>'
});

client.on('error', err => {
    console.log('Error ' + err);
});

https://www.sitepoint.com/using-redis-node-js/

# Step 4: Install Redis Server:
- For Mac and Linux users, the Redis installation is pretty straightforward. Open your terminal and type the following commands:
>>> wget https://download.redis.io/releases/redis-6.2.4.tar.gz
>>> tar xzf redis-6.2.4.tar.gz
>>> cd redis-6.2.4
>>> make

After the installation ends, start the server with this command:
>>> redis-server

If the previous command did not work, try the following command:
>>> src/redis-server 


There are 3 sub-agents that make up the entire mega agent
# (1) Appointment Agent (gordon-ramsey)

# (2) Knowledge Base (Question-Answer Pairs)

# (3) Personality Agent

## Service Account Authentication
First you have to create a service account and download a .JSON format file of credentials on your local system. Now, there are three ways to use that credentials for authentication/authorisation in dialogflow library.

    Method 1

    Create a environment variable GOOGLE_APPLICATION_CREDENTIALS and it's value should be the absolute path of that JSON credentials file.By this method, google library will implicitly loads the file and use that credentials for authentication. We don't need to do anything inside our code relating to this credentials file.

    export GOOGLE_APPLICATION_CREDENTIALS="<absolute-path-of-json-file>" # for UNIX,LINUX
    # then run your code, google library will pick credentials file and loads it automatically

    Method 2

    Assume, you know the absolute path of your JSON file and put that as value in below snippet of credentials_file_path variable.

    // You can find your project ID in your Dialogflow agent settings
    const projectId = '<project-id-here>';
    const sessionId = '<put-chat-session-id-here>'; 
    // const sessionid = 'fa2d5904-a751-40e0-a878-d622fa8d65d9'
    const query = 'hi';
    const languageCode = 'en-US';
    const credentials_file_path = '<absolute-file-path-of-JSON-file>';

    // Instantiate a DialogFlow client.
    const dialogflow = require('dialogflow');

    const sessionClient = new dialogflow.SessionsClient({
      projectId,
      keyFilename: credentials_file_path,
    });

    Expand snippet

    Method 3

    You can note down the project_id, client_email and private_key from the JSON, use them in your code for authentication explicitly.

