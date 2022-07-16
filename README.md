FULFILLMENT SERVICE
- URL: https://552d-2620-df-8000-5701-0-2-1d46-9f26.ngrok.io/webhook
- This backend service receives POST requests from the client application in the form of the response to a user query matched by intents with webhook enabled. 
- Ensure that your web service meets all the webhook requirements specific to the API version enabled in this agent. 


There are 3 sub-agents that make up the entire mega agent
(1) Appointment Agent (gordon-ramsey)

(2) Knowledge Base (Question-Answer Pairs)

(3) Personality Agent

Service Account Auth
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

// You can find your project ID in your Dialogflow agent settings
const projectId = '<project-id-here>';
const sessionId = '<put-chat-session-id-here>';
// const sessionid = 'fa2d5904-a751-40e0-a878-d622fa8d65d9'
const query = 'hi';
const languageCode = 'en-US';
const credentials = {
  client_email: '<client-email-here>',
  private_key:
    '<private-key-here>',
};
// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');

const sessionClient = new dialogflow.SessionsClient({
  projectId,
  credentials,
});

========== Fulfillment Request (Example Below) ==========

{
  "responseId": "e2b29689-152e-4cab-902e-beffa365aff2-e5ce3fa9",
  "queryResult": {
    "queryText": "hey amber, could you help me schedule an appointment",
    "action": "create_appointment",
    "parameters": {
      "schedule": "book",
      "appointment": "cancel"
    },
    "allRequiredParamsPresent": true,
    "outputContexts": [
      {
        "name": "projects/gordon-ramsey-eopk/locations/global/agent/sessions/8f60eb4b-79bb-885a-ef37-ea396f5f4a47/contexts/appointment-booking-create",
        "lifespanCount": 5,
        "parameters": {
          "schedule": "book",
          "schedule.original": "schedule",
          "appointment": "cancel",
          "appointment.original": "appointment",
          "response": "",
          "response.original": "",
          "status": "",
          "status.original": "",
          "status1": "",
          "status1.original": ""
        }
      },
      {
        "name": "projects/gordon-ramsey-eopk/locations/global/agent/sessions/8f60eb4b-79bb-885a-ef37-ea396f5f4a47/contexts/__system_counters__",
        "parameters": {
          "no-input": 0,
          "no-match": 0,
          "schedule": "book",
          "schedule.original": "schedule",
          "appointment": "cancel",
          "appointment.original": "appointment"
        }
      }
    ],
    "intent": {
      "name": "projects/gordon-ramsey-eopk/locations/global/agent/intents/290dca93-d3e4-4f6b-b3a0-c1a09fea5f02",
      "displayName": "appointment-booking-create"
    },
    "intentDetectionConfidence": 1,
    "languageCode": "en",
    "sentimentAnalysisResult": {
      "queryTextSentiment": {
        "score": -0.2,
        "magnitude": 0.2
      }
    }
  },
  "originalDetectIntentRequest": {
    "source": "DIALOGFLOW_CONSOLE",
    "payload": {}
  },
  "session": "projects/gordon-ramsey-eopk/locations/global/agent/sessions/8f60eb4b-79bb-885a-ef37-ea396f5f4a47"
}




{  
  "fulfillmentText":"This is a text response",
  "fulfillmentMessages":[  ],
  "source":"example.com",
  "payload":{  
    "google":{  },
    "facebook":{  },
    "slack":{  }
  },
  "outputContexts":[  
    {  
      "name":"<Context Name>",
      "lifespanCount":5,
      "parameters":{  
        "<param name>":"<param value>"
      }
    }
  ],
  "followupEventInput":{  }
}