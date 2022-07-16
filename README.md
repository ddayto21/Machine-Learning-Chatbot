## DialogFlow - Node.JS Backend
![chatbot](/dialogflow-chatbot/images)

**Table of Contents:**

* [Quickstart](#quickstart)
  * [Requirements](#requirements)
  * [Fulfillment Service](#fulfillment-service)
  * [Redis Server](#redis-server)


  * [Create Dialogflow Agent](https://dialogflow.cloud.google.com/#/agent/)
  * Fulfillment > Enable the Inline EditorA.
    Select Deploy


### Requirements
1.  [Select or create a Cloud Platform project][projects].
1.  [Enable billing for your project][billing].
1.  [Enable the Dialogflow API API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

## Fulfillment Webhook 
- URL: https://552d-2620-df-8000-5701-0-2-1d46-9f26.ngrok.io/webhook
- This backend service receives POST requests from the client application in the form of the response to a user query matched by intents with webhook enabled. 
- Ensure that your web service meets all the webhook requirements specific to the API version enabled in this agent. 

### Set up an Express Server using Node.JS

```javascript

const express = require('express')
const app = express()

```

### Run Backend Application on Local Host:

```
$ node service.js
```

### Set up a Public URL with NGROK Tunnel:

```
$ ngrok http <port>
```
 
## Copy forwarding link from ngrok 

- For this particular service, the public endpoint was: https://d81c-2601-1c2-8100-6540-5ddd-a1c3-a27f-aeaf.ngrok.io

## Add '/webhook' to the end of your public endpoint

```javascript

    app.post('/webhook', async(request, response) => {

```

- Example: https://d81c-2601-1c2-8100-6540-5ddd-a1c3-a27f-aeaf.ngrok.io/webhook

## Set up Webhook URL in Dialogflow Agent

- Navigate to https://dialogflow.cloud.google.com
- On the left side of the page, click the 'Fulfillment' tab
- In the 'Webhook' section, click 'Enable'
- Enter your public endpoint in the 'URL' field
- Click 'Save' at the bottom of the page
  - You can define when you want to send webhooks to this public endpoint in the DialogFlow console

## Create a Dialogflow Client

```javascript 

    const dialogflow = require('dialogflow');
    const sessionClient = new dialogflow.SessionsClient({
      projectId,
      credentials,
    });

```

## Project ID

Define Project ID and Session ID in Application 

- You can find your project ID in your Dialogflow Agent Settings

```javascript

    const projectId = '<project-id-here>';
    const sessionId = '<put-chat-session-id-here>';

```


## Set Up Redis Server - Node.JS
https://docs.redis.com/latest/rs/references/client_references/client_nodejs/

- To use Redis with Node.js, you need to install a Node.js Redis client. The following sections explain how to use node_redis, a community-recommended Redis client for Node.js.

- Another community-recommended client for Node.js developers is ioredis. You can find additional Node.js clients for Redis in the Node.js section of the Redis Clients page.

### Install node_redis 

```
$ npm install node_redis
```

## Connect to Redis Instance
- Run the following code in your service.js backend file to create a Redis Instance:

```javascript

const redis = require('redis');

```

## Create a new Redis Client

```javascript

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


```
https://www.sitepoint.com/using-redis-node-js/

## Install Redis Server:
- For Mac and Linux users, the Redis installation is pretty straightforward. Open your terminal and type the following commands:


```
$ wget https://download.redis.io/releases/redis-6.2.4.tar.gz
$ tar xzf redis-6.2.4.tar.gz
$ cd redis-6.2.4
$ make
```

## After the installation ends, start the server with this command:

```
$ redis-server
```

## If the previous command did not work, try the following command:

```
$ src/redis-server 
```

## Service Account Authentication
First you have to create a service account and download a .JSON format file of credentials on your local system. Now, there are three ways to use that credentials for authentication/authorisation in dialogflow library.

### Method 1
- Create an environment variable named 'GOOGLE_APPLICATION_CREDENTIALS'
- Set the value equal to the absolute path of that JSON credentials file.

```
$ export GOOGLE_APPLICATION_CREDENTIALS="<absolute-path-of-json-file>"
```

- Then, run your code. Google library will automatically load your credentials file 

### Method 2
- Assume that you know the absolute path of your JSON file and put that as value in below snippet of credentials_file_path variable.
-  You can find your project ID in your Dialogflow agent settings

```javascript

    const projectId = '<project-id-here>';
    const sessionId = '<put-chat-session-id-here>'; 
    const credentials_file_path = '<absolute-file-path-of-JSON-file>';

    // Instantiate a DialogFlow client.
    const dialogflow = require('dialogflow');

    const sessionClient = new dialogflow.SessionsClient({
      projectId,
      keyFilename: credentials_file_path,
    });

```
  
