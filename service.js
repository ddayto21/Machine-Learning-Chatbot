const fs = require('fs')
const readline = require('readline')
require('dotenv').config()

const express = require('express')
const app = express()

const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// Enable proxy in development environment since we're running the server behind nginx
app.set('trust proxy', 1)

const { WebhookClient } = require('dialogflow-fulfillment-helper')
const { Card, Suggestion } = require('dialogflow-fulfillment-helper')
const { Payload } = require('dialogflow-fulfillment-helper')

var { google } = require('googleapis')
const sheets = google.sheets('v4')
var { GoogleAuth } = require('google-auth-library');
const axios = require("axios")
const path = require('path');
const moment = require('moment')

const { searchconsole } = require('googleapis/build/src/apis/searchconsole')
const { MapsClient } = require("@googlemaps/google-maps-services-js");
const { response } = require('express')

var socketio = require("socket.io")
const uuid = require('uuid')
const randomid = uuid.v4
const session = require('express-session')
const cookieParser = require('cookie-parser')

const redis = require('redis');
const { type } = require('os')

const Redis = require('ioredis')
const redisInstance = new Redis()

const { spawn } = require('child_process')

var redisStore = require('connect-redis')(session)
var redis_client = redis.createClient({ 
    host: 'localhost',
    port: 6379,
    legacyMode: true
});
var sessionStore = new redisStore({ client: redis_client })

app.use(bodyParser.json())

app.use(session({
    name: "UserStore",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true,
        secure: 'development'
    }
}))

// process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(path.join(__dirname, '<ACCOUNT_KEY_FILENAME>.json'));
var spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

app.listen(3008, async() => {  
    console.log('Hosting fulfillment service webhooks... Waiting for requests from dialogflow...')
    await redis_client.connect();
})

const oneDay = 1000 * 60 * 60 * 24;

async function SessionId(session_path) {
    const session_array = session_path.split('/')
    var session_id = session_array[session_array.length -1]
    // const session_id = session_array[6]
    console.log(`Dialogflow Session ID: ${session_id}`)
    return session_id
} 

// async function PythonScript(req, res) {
//     var dataToSend;

//     const pythonScript = spawn('python2', ['/python/scripty.py'])
//     // Collect data from script
//     pythonScript.stdout.on('data', function(data) {
//         // console.log(data.toString());
//         dataToSend = data.toString()
//         pythonScript.stderr.on('data', data => {
//             console.error(`stderr: ${data}`)
//         })

//         // When the event closes, ensure that the stream from the child process is closed
//         pythonScript.on('exit', (code) => {
//             console.log(`Child process exited with code ${code}, ${dataToSend}`)
//             // res.sendFile(`${__dirname}/`)
//         })
//     })
// }

async function CreateHash(id) {
    // const id = SetupUUID()
    console.log(`Hash ID: ${id}`)
    try {
        var client = new Redis({
            // host: '#####.publb.rackspaceclouddb.com',
            // port: 1234,
            // password: 'YOUR_PASSWORD',
            // tls: {
            //     ca: fs.readFileSync('LOCAL/PATH/TO/rackspace-ca-2016.pem')
            // }
        });
    
        const customerData = {
            "sessionID": id
        }
        await client.hmset(id, customerData)


        const SessionData = await client.hgetall(id);
        console.log(`SessionData`)
        console.log(SessionData)

        // console.log(`sessionData: ${sessionData}`)
        
        // client.del(id, function (err, result) {
        //     if (err) throw err;

        //     console.log('Delete Record:', result);
        // });
        
        // client.quit();
    }
    catch (e) {
        console.log('Error: ', e);
    }
}

async function SetupUUID() {
    var uuid_v4 = uuid.v4()
    console.log(uuid_v4)
    return uuid_v4
}

app.post('/webhook', async(request, response) => {
    console.log(request)
    console.log("\n ======= Service Running  ======= \n") 
    // console.log(`==== Create an HTTP Session ====`)
    const query = request.body.queryResult    
    console.log(request.body)
    console.log(`User Message: ${query.queryText} \n`)
    const intent = request.body.queryResult.intent.displayName;
    const score = request.body.queryResult.intentDetectionConfidence;
    console.log(`Intent: ${intent}\nConfidence Score: ${score}`)
    console.log(intent)

    const fulfillmentText = request.body.queryResult.fulfillmentText;
    if (fulfillmentText) {
        console.log(`Amber Response: ${fulfillmentText}`)
    }
    // console.log(request.body)
    const session_path = request.body.session;
    console.log(`Session Path: ${session_path}`)
    // console.log(`Query: ${query}`)

    var session_id = await SessionId(session_path)
    await CreateHash(session_id)

  
    // var sessionData = await redis_client.get('session_id', function(err, obj) {
    //     if (err) throw err;

    //     console.log(`Success! Response from session hash: ${obj}`)
        
    // })
    // console.log(`sessionData is: `)
    // console.log(sessionData)
 
    
    // console.log("Initializing http session: ")
    // console.log(sess)
    // var sess = request.session;
    // sess.id = await session_id
    // console.log("Store session_id in cookie..")
    // console.log(sess)
    
    // Extract parameters and action to define operation logic
    const parameters = request.body.queryResult.parameters
    const action = request.body.queryResult.action;
    
    console.log("Action: " + request.body.queryResult.action)  

    if (action == "input.welcome") {
        // const { firstname, lastname } = request.session
        const client = new Redis()
        const sessData = await client.hgetall(session_id)
        // console.log(firstname)

        console.log("Welcome intent detected....")
        // console.log(sess)
        if (sessData.FirstName && sessData.LastName) {           
                var agentResponse = {
                    "fulfillmentText": `Hey, what's up ${sessData.FirstName}! What could I help you with today?`
                }

                response.json(agentResponse)
            
        }        
    }
    
    if (action == "appointment-booking-checkdate") {
        console.log("Validating the requested appointment date with fulfillment service...")
        var time_parameter = parameters["time"][0]
        var date_parameter = parameters["date"][0]
        var date = moment(date_parameter).format('M/DD/YYYY')
        var formatted_date = moment(date).format('MMMM Do')
        
        var dt = new Date(date_parameter)
        if (dt.getDay() == 6 || dt.getDay() == 0) {
            console.log("The requested date is a weekend...")
            var jsonResponse = {
                "fulfillmentText" : "I'm really sorry, but pick-ups don't run on weekends, only week days from 8-11 am."            
            }
           return response.json(jsonResponse)

        }
 
        var time = moment(time_parameter).format('HH:mm')       
        var formattedtime = moment(time_parameter).format('LT')

        console.log(`formattedtime is: ${formattedtime}`)
        console.log(`Time is: ${time}`)
        var time_string = String(time)
        var time_array = time_string.split(":")
        var hours = time_array[0]
        var minutes = time_array[1]
        var total_minutes = Number(hours) * 60 + Number(minutes)
        
        console.log("Verifying whether the requested time is within business hours (8am-11am)...")
        if (total_minutes >= 480 && total_minutes < 660) {
            console.log("Requested time meets the criteria! Check whether that date is available in appointment spreadsheet...")
            const status = await VerifyAppointment(parameters)
            console.log("The appointment status is: " + status)
            
            if (status == "available") {
                const context = request.body.queryResult["outputContexts"]
                console.log("Saving date and time into hash...")
               
                
               try {
                const hashMap = {
                    "AppointmentDate": String(date),
                    "AppointmentTime": String(formattedtime)
                }
                    var client = new Redis()    
                    await client.hmset(session_id, hashMap)
                    const sessData = await client.hgetall(session_id) 
                    console.log(`sessData: ${sessData}`)

               } catch (err) {
                console.log(err)
               }
                for (i=0; i < context.length; i++) {
                    var context_name = context[i]["name"]
                    if (context_name == session_path + '/contexts/' + 'appointment-booking-reschedule') {
                        console.log("Customer is in the process of rescheduling an appointment...")    
                               
                        console.log("Attempting to update appointment details to spreadsheet...")
                        var update_sheet = await ChangeAppointment(parameters, "reschedule", session_id)
                        console.log(`ChangeAppointment() Result: ${update_sheet}`)                   
                        
             
                            if (update_sheet == "success") {
                                var jsonResponse = { "fulfillmentText" : `And... you're all set! I rescheduled your new appointment date to ${formatted_date} at ${formattedtime}. Please let me know if you need help with anything, I would absolutely love to help.`}
                                // const time_details = await CacheDate(parameters)

                            }
                            
                            if (update_sheet == "fail") {
                                var jsonResponse = { "fulfillmentText" : `I'm incredibly sorry, we're having network issues, so I'm having issues on our end. Once our system's back up, I will reschedule your appointment date as soon as possible!`}
                            }
                            response.send(jsonResponse)                            
                    }

                    if (context_name == session_path + '/contexts/' + 'appointment-booking-create') {     
                        // const sheetResponse = await CreateAppointment(parameters)
                        console.log("Customer is in the process of booking an appointment...")

                       
                            var jsonResponse = { "fulfillmentText" : `Perfect, you're in luck! ${formatted_date} at ${formattedtime} is available... What name should I put the appointment under?`}
                       
                        response.send(jsonResponse)                        
                      
                      
                    }
                    
                }
            } else {
                var jsonResponse = {
                    "fulfillmentText" : `Sorry, we're completely booked on ${formatted_date}... Would it be okay if we chose a different date? I would still love to help you.`            
                }
            }    
           
            response.json(jsonResponse)

        } else {
            console.log("Appointment time is outside of business hours")
            var jsonResponse = {
                "fulfillmentText" : `Sorry, ${formatted_date} at ${formattedtime} is outside of our business fundraiser hours. We are only available on weekdays, from 8am - 11am. What time works best for you?`
            }
            response.send(jsonResponse)
        }
        
        // var minutes = moment.duration(time.format("HH:mm")).asMinutes()
    }

    if (action == "appointment-booking-getname") {
        // ******* The name of a specific context object has the format below:  ******** //
        // "name": "projects/gordon-ramsey-eopk/locations/global/agent/sessions/16dca99d-ddf4-665b-2c8d-a11d728fb56d/contexts/appointment-booking-reschedule"
        
        console.log("Using context to determine whether the customer intends to book, reschedule, or cancel their appointment\n")
        
        // Strategy: Parse the most recent context object in the query request and apply the following operations:
        // Step (1) Split the context name by the '/' backslash character into 9 elements
        // Step (2) Extract the last element in the context array 
        // Step (3) Check if the context name is equal to 'appointment-booking-reschedule'
        
        // console.log(query)
        console.log(parameters)
        var FirstName = await parameters["first-name"]
        var LastName = await parameters["last-name"]
        console.log("Attempting to update session hash data...")
        try {
          const client = new Redis()
          const hashMap = {
              "FirstName": FirstName,
              "LastName": LastName
            }

            await client.hmset(session_id, hashMap)
            const sessData = await client.hgetall(session_id)
            console.log(sessData)
        } catch(err) {

        }
        
        const context = request.body.queryResult["outputContexts"]
        console.log(`Displaying ${context.length} items in the context list: \n`)
        // console.log(context)
        console.log(`Printing context: \n`)
        // console.log(context)
        for (i=0; i < context.length; i++) {
            // console.log(`Parsing the context object...`)
            var context_name = context[i]["name"]
            if (context_name == session_path + '/contexts/' + 'appointment-booking-reschedule') {
                if (FirstName !== undefined && LastName !== undefined) {
                    // console.log("First and Last Name was provided...\n")
                    // console.log(`${FirstName} ${LastName}`)

                    console.log(`Saving customer name: ${FirstName} ${LastName} to session cache...`)
                    // redis_client.set("FirstName", FirstName, function(err, response) { if(err) { console.log(err)} console.log("Saved customer's first name to session cache...") })
                    // redis_client.set("LastName", LastName, function(err, response) { if(err) { console.log(err) } console.log("Saved customer's lastname to session cache...") }) 
                
                    const res_context = { 
                        "entity": "name",
                        "action": "reschedule"
                    }
                    
                    const fulfillmentText = await LookupName(parameters, res_context, session_id)
                    var jsonResponse = {
                        "fulfillmentText": fulfillmentText
                    }
                
                    response.send(jsonResponse)
                    console.log(`Sending fulfillment response: ${fulfillmentText} to customer...`)
                }
            }

            // console.log("Sending followupEventInput named 'appointment-booking-getemail'")
            if (context_name == session_path + '/contexts/' + 'appointment-booking-create') {
                    console.log(`Customer is attempting to book an appointment... `)
                    var jsonResponse = { 
                        "fulfillmentText": `Thank you ${parameters["first-name"]}! Please give me your email as well, we send out important reminders and details regarding your appointment.`}
                    response.json(jsonResponse)
                    var FirstName = await parameters["first-name"]
                    var LastName = await parameters["last-name"]
                    
                    console.log(FirstName)
                    console.log(LastName)
                    
                    console.log("Asking customer for email address...")
                    console.log(`Saving customer name: ${FirstName} ${LastName} to session cache...`)
                    
                    redis_client.set("FirstName", FirstName, function(err, response) { if(err) { console.log(err)} console.log("Saved customer's first name to session cache...") })
                    redis_client.set("LastName", LastName, function(err, response) { if(err) { console.log(err) } console.log("Saved customer's lastname to session cache...") }) 
                }
  
                

             if (context_name == session_path + '/contexts/' + 'appointment-booking-cancel') {
                    console.log(`Customer is attempting to cancel an appointment... `)
                //     var jsonResponse = { 
                //         "fulfillmentText": `Thank you ${parameters["first-name"].original}! Please give me your email as well, we send out important reminders and details regarding your appointment.`}
                //   response.json(jsonResponse)
                   console.log("Checking if customer name was provided...")
                var FirstName = await parameters["first-name"]
                var LastName = await parameters["last-name"]
                console.log(FirstName)
                console.log(LastName)

                if (FirstName !== undefined && LastName !== undefined) {
                    console.log("Customer provided full name.... LookupAppointment() \n")
                    console.log(`${FirstName} ${LastName}`)
                    const context_cancel = {
                        "entity": "name",
                        "action": "cancel"
                        }
                        
                    const fulfillmentText = await LookupName(parameters, context_cancel)
                    var jsonResponse = {
                        "fulfillmentText": fulfillmentText
                    }
                    console.log(`Sending fulfillment response: "${fulfillmentText}" to customer...`)
                    response.send(jsonResponse)

                    console.log(`Saving customer name: ${FirstName} ${LastName} to session cache...`)
                    redis_client.set("FirstName", FirstName, function(err, response) { if(err) { console.log(err)} console.log("Saved customer's first name to session cache...") })
                    redis_client.set("LastName", LastName, function(err, response) { if(err) { console.log(err) } console.log("Saved customer's lastname to session cache...") }) }
  
                }            
                
        }
    }

    if (action == "get_customer_email") {
        console.log(query)
        console.log("Displaying parameters...")
        // Run operations to check if the email was provided...
        console.log("Checking if customer email was provided...")
        console.log("Printing parameters...")
        console.log(parameters)
        if (parameters["email"].length > 0) {
            var Email = parameters["email"]     
            console.log(`Attempting to store ${Email} in session hash....`)          
            console.log("Email is: " + Email)
            const hashData = {
                "Email": Email
            }

            try {                
                const client = await new Redis()
                await client.hmset(session_id, hashData)
                const sessData = await client.hgetall(session_id)
            } catch(err) {
                console.log(err)
            }

            redis_client.set("Email", Email, function(err, response) {
                if(err) {
                    console.log(err)
                }
                console.log("Saved customer's email to session cache...")
            })
            var jsonResponse = {
                "fulfillmentText" : "Thanks! I need your phone number in order to book the appointment, we're almost finished!"
            }
            console.log("Activate'appointment-booking-getnumber'")
           
    } else {
        console.log("Email not found... Triggering 'appointment-booking-getemail' intent...")
        var jsonResponse = {
            "fulfillmentText" : "Sorry! I need your email in order to book the appointment"
        }
        
    }
        response.json(jsonResponse)
    }

    if (action == "appointment-booking-getphone") {
        console.log("Saving customer's phone number to system...")
        console.log(parameters)
        const Phone = parameters["phone-number"]
        console.log("Phone Number: " + Phone)

       
        if (Phone.replace(/\D/g,'').length !== 10) {
            console.log("Phone number is invalid")
            var jsonResponse = {
                "fulfillmentText": "Sorry, it looks like that phone number is invalid, could you tell me the full phone number, please?"
                }
                response.json(jsonResponse)
            
        } else {
            console.log("Phone number is valid...")
            var jsonResponse = {
                "fulfillmentText": "Thanks! And the address of the location for the pick-up?"
                }

        try {
            console.log("Attempting to save customer phone number to session cache...")
            const client = new Redis()
            const hashData = { "Phone": Phone }
            await client.hmset(session_id, hashData)
            const sessData = await client.hgetall(session_id)
            console.log(sessData)

            redis_client.set("Phone", Phone, function(err, response) {
                if(err) {
                    console.log(err)
                }
                console.log("Saved customer phone number to session cache")
            })
            } catch(err) {
                console.log("Error:", err)
            }      
        }
    }

    if (action == "appointment-booking-getaddress") {
        console.log(parameters)
        var Origin = "4231 Firestone Blvd, South Gate, California"
        var Address = parameters["address"]
        var ZipCode = parameters["zipcode"]
        var City = parameters["city"]
        var Destination = Address + ", " + City + ", " + ZipCode;    
        console.log(Destination)   
        
        const context = request.body.queryResult["outputContexts"]
        for (var i=0; i <context.length; i++) {
            console.log("Using the context to determine the next best action...")
            // console.log("Iterate context_list")
            var context_name = context[i]["name"]
            console.log(`Index: ${i} Context Name: ${context_name}`)

            if (context_name == session_path + '/contexts/' + 'appointment-booking-reschedule') {
                console.log('Attempting to reschedule the appointment... Verifying the provided address')
                const context_reschedule = {
                    "entity": "address",
                    "action": "reschedule"
                }
                // const fulfillmentText = await LookupAppointment(parameters, context_reschedule)
                const fulfillmentText = await LookupAddress(parameters, "reschedule", session_id)
                response.send({
                    fulfillmentText: fulfillmentText
                })
                
            }

            if (context_name == session_path + '/contexts/' + 'appointment-booking-create') {
                console.log("Calculating distance of the destination from driver location...")
                var API_KEY = process.env.DIRECTIONS_API_KEY;
                var axios = require('axios')
                var config = {
                method: 'get',
                url: `https://maps.googleapis.com/maps/api/directions/json?origin=${Origin}&destination=${Destination}&key=${API_KEY}`
                }
                // console.log("Attempting to send axios request to api...")
                axios(config).then(async function(res) {
                // console.log(JSON.stringify(response.data))
                data = res.data
                // console.log(data["routes"][0]["legs"][0]["distance"]["text"])
                distance = data["routes"][0]["legs"][0]["distance"]["text"]
                kilometers = data["routes"][0]["legs"][0]["distance"]["value"]
                console.log(`The distance between origin and destination is: ${distance}`)
                
                        if (kilometers < 160394) {
                            console.log("The destination is within range!")
                            var jsonResponse  = {
                                "fulfillmentText" : `Perfect! I just looked up the address, it's only ${distance} away, which meets the fundraiser requirements. How many bags do you plan on selling?`
                            }
                            console.log("Attempting to store DestinationAddress in memory...")
                            redis_client.set("DestinationAddress", Destination, function(err, response) {
                                if(err) {
                                    console.log(err)
                                }
                               
                            })
                            console.log("Saved destination address to session cache...")
                            const hashMap = {
                                "DestinationAddress": Destination 
                            }
                            try {
                                const client = new Redis()
                                await client.hmset(session_id, hashMap)
                                const sessData = await client.hgetall(session_id) 
                                console.log(sessData)
                            } catch(err) {
                                console.log(err)
                            }
                        
                        }
                        else {
                            console.log("The destination is out of range")
                        
                            var jsonResponse = {
                                "fulfillmentText" : "I'm so sorry, I just looked up the address on the map. It looks like that address is out of driving range, we're only allowed to book appointments that are within 100 miles of the corporate office. Would you prefer to book the appointment at a different location?"
                            }
                            console.log("Sent response from server to customer...")
                            
                        }
                        response.send(jsonResponse)
                    
                
                    }).catch(function(error) {
                        console.log(error)
                    })
                }

                if (context_name == session_path + '/contexts/' + 'appointment-booking-cancel') {
                    console.log("Attempting to verify the address provided by the customer and cancel the appointment...")
                    const context_cancel = {
                        "entity": "address",
                        "action": "cancel"
                    }
                    // const message = await LookupAppointment(parameters, context_cancel)
                    const message = await LookupAddress(parameters, "cancel", session_id)
                    var jsonResponse = { fulfillmentText: message }
                    response.send(jsonResponse)
                    
                }
            
        
            }
    }

    
    if (action == "appointment-booking-getbags") {
        console.log(parameters)
        const BagNumber = parameters['bag-quantity']
        console.log(`There are ${BagNumber} of bags...`)
        if (BagNumber.length == 1) {
            if (BagNumber >= 150) {
                console.log("Bag criteria met!")
                const hashMap = {
                    "BagQuantity": BagNumber
                }
                
                try {
                    const client = new Redis()
                    await client.hmset(session_id, hashMap)
                    const sessData = await client.hgetall(session_id)
                } catch(err) {
                    console.log(err)
                }
                var google_response = await CreateAppointment(session_id)       
                var jsonResponse = {
                    "fulfillmentText" : "That's perfect, your appointment is all set! How did this conversation go? Could you provide feedback on areas I could improve?",
                    "outputContexts": [
                        {
                            "name": session_path + 'collect-feedback'
                        }
                    ]
                }
                // Set the output context equal to 'collect-feedback'
    
            console.log("Attempting to upload appointment to spreadsheet...")
            
                    
            }
            if (BagNumber < 150) {
                console.log("Bag criteria failed... Convince customer to drop off bags")
                var jsonResponse = {
                    "fulfillmentText" : "I'm really sorry, unfortunately there is a minimum bag requirement of 150 bags for fundraisers that involve pick-up appointments. But, you can always drop off your bags Monday through Friday, from 6am to 1pm!"
                }
            }
        }

        if (BagNumber.length > 1) {
            var jsonResponse = {
                "fulfillmentText" : "Okay! How many bags of wearable clothes, in total, do you currently have? There's a 150 minimum bag requirement."
            }
        }
   

       
        response.send(jsonResponse)

    }

    // if (action == "appointment-booking-getorg") {
    //     console.log(parameters)
    //     const Organization = parameters['org-name']
    //     console.log(`Organization: ${Organization}`)
    
    //     var jsonResponse = {
    //         "fulfillmentText" : `Your appointment is set! `

    //     }
    // }

    if (action == "appointment-booking-reschedule") {
        console.log("The customer wants to reschedule their appointment...")
        console.log(parameters)
    

        
    }

    if (action == "collect-feedback") {
        console.log("The customer is attempting to provide feedback...")
        // console.log(parameters)
        const feedback = query.queryText;
        console.log(`Feedback: ${feedback}`)
        console.log(`Upload customer feedback to google sheets api, along with their name, phone number, email, etc..`)

    }



  
})



async function PlacesAPI(address) {
    var request = require("request");
    var API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    var URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}`
    // var URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${CompanyAddress}&key=${API_KEY}`
    
    console.log("Sending request ......")
    // console.log(URL)
    request(URL, function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var jsonbody = JSON.parse(body)
            console.log(jsonbody)
            var place_id = jsonbody["results"][0]["place_id"]
            console.log(`place_id: ${place_id}`)
            return place_id
        }
        else {
            console.log(error)
            console.log("The request failed... ")
        }

    })
    }



async function GetCoordinates(parameters) {
    console.log("Extracting geocoordinates of destination address..")
    var Address = parameters["address"]
    var ZipCode = parameters["zipcode"]
    var City = parameters["geo-city"]
    var Destination = Address + ", " + City + ", " + ZipCode   
    console.log(`Destination is : ${Destination}`)
    // var CompanyAddress = "4231 Firestone Blvd, South Gate, California"

    var request = require("request");
    
    var API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    var URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${Destination}&key=${API_KEY}`
    // var URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${CompanyAddress}&key=${API_KEY}`
    
    console.log("Generating coordinates...")
    // console.log(URL)
    request(URL, function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var jsonbody = JSON.parse(body)
            var results = jsonbody["results"][0]
            console.log("Printing coordinates:")
            // console.log(coordinates)
            var coordinates = results["geometry"]["location"]
            // console.log(coordinates)
            CalculateDistance(coordinates)
            
            // console.log(coordinates)
        }
        else {
            console.log(error)
            console.log("The request failed... ")
        }

    })
}

async function isValidPhone(number) {
    var phonere = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g
    var digits = number.replace(/\D/g, "");
    if (phonere.test(text)) {
        console.log("Phone number is invalid")
    } else {
        console.log("Phone number is valid...")
    }
    
}
async function CalculateDistance(parameters) {   
    var Origin = "4231 Firestone Blvd, South Gate, California"
    var Address = parameters["address"]
    var ZipCode = parameters["zipcode"]
    var City = parameters["geo-city"]
    var Destination = Address + ", " + City + ", " + ZipCode   
    
    var API_KEY = process.env.DIRECTIONS_API_KEY;
    var axios = require('axios')
    var config = {
        method: 'get',
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${Origin}&destination=${Destination}&key=${API_KEY}`
    }
    console.log("Attempting to send axios request to api...")
    axios(config).then(function(response) {
        // console.log(JSON.stringify(response.data))
        data = response.data
        // console.log(data["routes"][0]["legs"][0]["distance"]["text"])
        distance = data["routes"][0]["legs"][0]["distance"]["text"]
        kilometers = data["routes"][0]["legs"][0]["distance"]["value"]
        console.log(`The distance between origin and destination is: ${distance}`)

        if (kilometers < 160394) {
            console.log("The destination is within range!")
            return "valid"
        }
        else{
            console.log("The destination is out of range")
            return "invalid"
        }

    }).catch(function(error) {
        console.log(error)
    })
    
}

async function LookupAppointment(appointment_details, context) {
    console.log("Running LookupAppointment()...")
    
    const next_action = context["action"]
    const entity = context["entity"]
    console.log(`Appointment Details: ${appointment_details}`)
    console.log(appointment_details)
    console.log(`Context is: ${context}`)
    console.log(`Next action: ${next_action}`)
    console.log(`Entity: ${entity}`)

    if (entity == "name") {
        const message = await LookupName(appointment_details)
        console.log(`Message: ${message}`)
        return message;
    }

    if (entity == "address") {  
        const message = LookupAddress(appointment_details, next_action)
        console.log(`Message: ${message}`)
        return message;
    }    
}

async function LookupName(parameters, context, id) {
    // console.log(context)

    var FirstName = parameters["first-name"]
    var LastName =  parameters["last-name"]
    var FullName =  FirstName + " " + LastName;
    console.log(`Looking for appointments under the name: ${FirstName} ${LastName} in spreadsheet`)
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets" 
        });
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client })

        const firstname_query = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A2:A100'
         })
      
         const appointment_firstnames = firstname_query.data.values
         var matched_firstnames = []; // Get the row number of matched rows for firstname
     
         for (item of appointment_firstnames) {
          
             if (item.toString().toLowerCase().includes(FirstName.toString().toLowerCase())) {
                 console.log(`First Name Found: ${item}`)
                 var index = appointment_firstnames.indexOf(item)
                 matched_firstnames.push(index)
                //  console.log(`index of firstname: ${index}`)
             }
         }

         const lastname_query = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
           range: 'Sheet1!B2:A100'
        })
        const appointment_lastnames = lastname_query.data.values
        var matched_lastnames = [] // Get the index of any matched rows for lastname

        for (item of appointment_lastnames) {
            if (item.toString().toLowerCase().includes(LastName.toString().toLowerCase())) {
                console.log(`Last Name Found: ${item}`)
                // console.log(item)
                var index = appointment_lastnames.indexOf(item)
                matched_lastnames.push(index)
                // console.log(`index of lastname: ${index}`)
            }
        }
        // console.log(`matched_firstnames.length is ${matched_firstnames}`)
        // console.log(`matched_lastnames.length is ${matched_lastnames}`)


        if (matched_firstnames.length > 0 || matched_lastnames > 0) {
            console.log(`Found ${matched_firstnames.length} matches of firstname in appointment spreadsheet --- \n `)
            console.log(`Found ${matched_lastnames.length} matches of lastname in appointment spreadsheet --- \n `)
            
            var fulfillmentText = "Perfect! I was able to find your appointment in the system, could you please tell me the address of the event?"
           
            
        } else {
            var fulfillmentText = "Sorry, I wasn't able to find your appointment... Could you tell me the address of the event you scheduled, please?"
           
            } 
        
        return fulfillmentText;

    } catch(err) {
        console.log(`Error: \n ${err}`)
    }
}


async function ChangeAppointment(parameters, context, id) {  
    console.log("ChangeAppointment() function....using context to determine what fields to update (date, time, status) etc...")
    console.log(`ChangeAppointment() context is... ${context}`)

        try {
            const redisClient = new Redis()
            var sessionData = await redisClient.hgetall(id)
            console.log(sessionData)
            
        } catch(err) {
            console.log(err)
        }
        var Date = sessionData["AppointmentDate"]
        var Time = sessionData["AppointmentTime"]
        var Index = sessionData["AppointmentIndex"]
        var Phone = sessionData["Phone"]
        var FirstName = sessionData["FirstName"]
        var LastName = sessionData["LastName"]
        var RowNumber = Number(Index) + 2

        if (context == "reschedule") {
            try {
                const auth = new google.auth.GoogleAuth({
                    keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
                    scopes: "https://www.googleapis.com/auth/spreadsheets" 
                });
                const client = await auth.getClient();

                const sheets = google.sheets({ version: 'v4', auth: client })
                
                
            console.log("Updating appointment date and time for customer...")
            console.log(parameters)
            var date_parameter = parameters["date"][0]
            var date = moment(date_parameter).format('M/DD/YYYY') 
            var time_parameter = parameters["time"][0]    
            var time = moment(time_parameter).format('LT')

            const response = sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            // Get Row Number of Appointment
            range: `Sheet1!C${RowNumber}:D${RowNumber}`,
            valueInputOption: "USER_ENTERED",
            resource: {
            values: [[ date, time  ]]
              }
            
            })
            
        } catch(e) {
            console.log(e)
        
        }
            console.log("Attempting to send a SMS reschedule message to stakeholders in business...")
            try {
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const twilioClient = require('twilio')(accountSid, authToken)
                // twilioClient.messages.create({
                //     body: `Your Julimen fundraiser has been cancelled! We hope you're having a great day.`,
                //     from: '+16266998027',
                //     to: `+1${Phone}`
                // })
                await twilioClient.messages.create({
                    body: `${FirstName} ${LastName} has just rescheduled their appointment to ${Date} at ${Time}.`,
                    from: '+16266998027',
                    to: `+16262247156`
                })
                return "success"
            
                } catch(err) {
                    console.log(err)
                    return "fail"
                }
              
           
        }            

            if (context == "cancel") {             
                try {
                    console.log('Authenticating with google sheets api....')
                    const auth = new google.auth.GoogleAuth({
                        keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
                        scopes: "https://www.googleapis.com/auth/spreadsheets" 
                    });


                    const client = await auth.getClient();
                    console.log('Success! We connected to the google client... ')

                    const sheets = google.sheets({ version: 'v4', auth: client })   
                    
                    console.log("Marking the appointment status to 'cancelled'...")
                    const response = sheets.spreadsheets.values.update({
                        spreadsheetId: spreadsheetId,
                        // Get Row Number of Appointment
                        range: `Sheet1!I${RowNumber}`,
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: [[ "cancelled with agent"  ]]
                        }
                    })

                    return "success"
                } catch(e) {
                    console.log(`Error: ${e}`)
                    return "fail"
                }
                
            
            }        

            
    
}

async function LookupAddress(parameters, context, id) {
    console.log("Verifying fundraiser event for a customer... ")
    // console.log(`Context is: ${context}`)
    // console.log(parameters)

    try {
        const redisClient = new Redis()
        const customerData = await redisClient.hgetall(id)
        console.log(customerData)
        
    } catch (err) {
        console.log(err)
    }
    // console.log("Verifying the address of the customer's appointment...")
   var spreadsheetId = '1fvdqyH_OzOWLhxKjPa2KM43l7IA-pLR5ZJCZrJMJxfQ'   
 
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
                scopes: "https://www.googleapis.com/auth/spreadsheets"
            });
            
            // Client is a way for us to access google sheets 
            const client = await auth.getClient();        
            console.log("Successfully connected to google sheets api!")
    
            var sheets = await new google.sheets({
                version: 'v4',
                auth: client
            })        
           
            console.log("Attempting to write data into google sheets...")
   
        } catch(err) {
        console.log(err)
    }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!E2:E100'
        })

        console.log("Fetching appointment addresses from spreadsheet")
        // console.log(response)
        var address_list = response.data.values;
        var StreetAddress = parameters["address"][0]

        for (var i=0; i<address_list.length; i++) {
            console.log(`Displaying item ${i} in address_list....`)
            console.log(address_list[i])
            if (address_list[i][0].includes(StreetAddress)) {

                // console.log(`Address found: ${address_list[i]}`)
                console.log("Address found")
                console.log("Retrieving appointment details")
                if (context == "reschedule") {
                    var fulfillmentText = "Perfect! Thanks for verifying the address. Which date would you prefer to switch your appointment to? Our drivers pick up clothes on week days, from 8 to 11 am."
                    console.log(`Storing AppointmentIndex: ${i} to redis memory...`)
                    const hashMap = {
                        "AppointmentIndex": i,
                        "DestinationAddress": StreetAddress
                          }

                    try {
                        const rClient= new Redis()
                        await rClient.hmset(id, hashMap)
                        const sessData = await rClient.hgetall(id)
                        console.log(sessData)

                    } catch(err) {
                        console.log(err)
                    }
                    return fulfillmentText

               }

                if (context == "cancel") {
                    var FirstName = await redis_client.get("FirstName", function(err, response) {
                        if (err) throw err;
                        console.log(`Success! \n ${response}`)
                    })
                    var LastName = await redis_client.get("LastName", function(err, response) {
                        if (err) throw err;
                        console.log(`Success! \n ${response}`)
                    })
                    var AppointmentDate = await redis_client.get("AppointmentDate", function(err, response) {
                        if (err) throw err;
                        console.log(`Successfuly retrieved AppointmentDate to session memory... ${response}`)
                    })
                    
                    var AppointmentIndex = await redis_client.get("AppointmentIndex", function(err, response) {
                        if (err) throw err;
                        console.log(`Successfully retrieved AppointmentIndex value appointment in memory... ${response}`)
                    })
                    const message = await ChangeAppointment(parameters, context, id)
                    // var jsonResponse = { "fulfillmentText": "Perfect! Thank you for being so patient, I just cancelled your appointment. Would you need help with anything else?" }
                    console.log(`Printing response from UpdateSheet() function... ${message}`)

                    console.log(`Use response to determine the next best action`)

                    if (message == "success") {

                        var jsonResponse = "Perfect! Thank you for being so patient, I just cancelled your appointment. Would you mind providing feedback on how I could improve? I want to learn what I can to better so that I can be more helpful in the future."
                        console.log("Sending callback function response to parent function...")
                        return jsonResponse
    
                        // return jsonResponse      
                    }

              
                }
                          
            }            
        }
}

app.get('oauth2callback', async(request, response) => {
    console.log(request)
    console.log("Running OAuth2 Callback...")
    response.send("It fucking worked!")
})

async function VerifyAppointment(time_details) {
    console.log("time_details:")
    console.log(time_details)
    // Lookup appointment date in system to check for availble time slots...
    console.log("Verifying whether a requested date is available in 'julimen-appointments' spreadsheet...")
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client })
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!C2:C100'
        })
      

        console.log("Fetching appointment dates from spreadsheet...");
        console.log("spreadsheet values:")
        console.log(response.data.values)
        var date_parameter = time_details["date"][0]
        var date = moment(date_parameter).format('M/DD/YYYY')

        const appointment_list = response.data.values
        console.log(typeof(appointment_list[0][0]))
        for (var i=0; i < appointment_list.length; i++) {
            let appointment = appointment_list[i][0]
            // console.log(`appointment is: ${appointment}`)
            if (appointment == date) {
                return "not available"
            } 
        }        
        return "available"
      
    } catch(err) {
        console.log("Error: " + err)
    }
}


async function CreateAppointment(session_id) {
    console.log("Parameters of CreateAppointment...")
   
    try {
        const client = new Redis()
        var customerData = await client.hgetall(session_id)
        console.log(customerData)
} catch (err) {
        console.log(err)
    }
        var Destination = customerData['DestinationAddress']
        var Date = customerData['AppointmentDate']
        var Time = customerData['AppointmentTime']
        var FirstName = customerData['FirstName']
        var LastName = customerData['LastName']
        var Phone = customerData['Phone']
        var Email = customerData['Email']
        var BagQuantity = customerData['BagQuantity']
  
    console.log("Attempting to authenticate to google sheets api")
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: "/Users/danieldayto/Coding/node-dialogflow/google-sheets-creds.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });
        
        // Client is a way for us to access google sheets 
        const client = await auth.getClient();        
        console.log("Successfully connected to google sheets api!")

        const sheets = google.sheets({
            version: 'v4',
            auth: client
        })        
       
        console.log("Attempting to write data into google sheets...")
                
        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            // range: "Sheet1!A:D", // Sheet_Name! CellRange 
            range: "Sheet1!A:I",
            valueInputOption: "USER_ENTERED",
            resource: {
                // values: [[ FirstName, LastName, AppointmentDate, AppointmentTime ]]
                values: [[ FirstName, LastName, Date, Time, Destination, Phone, Email, BagQuantity, "booked with agent" ]]
            }
        })

        // return { sheets }
    } catch(err) {
        console.log("Error ----" + err)
    }

    console.log("Attempting to send SMS using twilio...")
    try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioClient = require('twilio')(accountSid, authToken)
    twilioClient.messages.create({
        body: `Thanks for booking with Julimen! Your appointment is at ${Date} on ${Time}. Please have all your bags ready for our driver at: ${Destination}`,
        from: '+16266998027',
        to: `+1${Phone}`
    })
    twilioClient.messages.create({
        body: `${FirstName} ${LastName} just booked a pick-up appointment on ${Date} at ${Time}! Address: ${Destination}`,
        from: '+16266998027',
        to: `+16262247156`
    })

    } catch(err) {
        console.log(err)
    }
   
}



