# Over The Air Firmware Update Server for IoT Systems Using CoAP

Over-the-air IoT device firmware update server using CoAP.

## Setup

 - Clone or download this repository to machine with Node.js installed.
 - Install the node-coap library: `npm install coap`
 - For console log timestamping, install log-timestamp: `npm install log-timestamp`
 
## Running
 
 - start the server: `node iot-ota-server-coap.js`
 
It will enumerate the contents of the updates/ directory, searching for *.fmu* firmware update files.
 
For each CoAP GET request issued by the OTA update client, it will print the following information to the console.
Because CoAP is a RESTful (stateless) protocol, the GET request for each block must be made with full information about the firmware update request.

```
[2017-10-27T18:52:50.859Z]  matching OTA-STM32L1-SPIRIT1_1_1_31_APP_0xF63D0305.fmu
[2017-10-27T18:52:50.859Z] Sending firmware binary [OTA-STM32L1-SPIRIT1_1_1_31_APP_0xF63D0305.fmu] bytes: [0, 90624]
[2017-10-27T18:52:51.343Z] ------------------------------------------------
[2017-10-27T18:52:51.343Z] Client request from: IPv4:192.168.1.72:50692
[2017-10-27T18:52:51.343Z] Client request URL: /updates
[2017-10-27T18:52:51.343Z] payload: OTA-STM32L1-SPIRIT1 
[2017-10-27T18:52:51.343Z] options:
[2017-10-27T18:52:51.343Z] Uri-Path : 75706461746573
[2017-10-27T18:52:51.343Z] Block2 : 1614
[2017-10-27T18:52:51.343Z] Parsing firmware update request...
[2017-10-27T18:52:51.343Z] { pid: 'OTA-STM32L1-SPIRIT1',
  type: 3,
  version: 16842754,
  offset: 0 }
```

## About CoAP

CoAP is "Constrained Applications Protocol".  A binary protocol designed for IoT systems.  Follows the same "REST" model that HTTP uses (GET, PUT, POST, DELETE), and simple to convert to/from HTTP, but designed from the ground up to support constrained networks like 6LoWPAN. 

CoAP runs over UDP or DTLS generally, and offers basic reliability in the form of confirmable request/response message semantics with exponential backoff. 

A good overview video of CoAP is [here](https://www.youtube.com/watch?v=4bSr5x5gKvA). 

CoAP features: 
* 4 byte header for all messages. 
* DTLS with PSK, RPK and certificates. 
* Stateless block transfer support – client is aware of number of blocks and makes requests for each one. 
* Limited to UDP max MTU of 1500 bytes per block/transfer. 
* Subscription feature is built-in to protocol with "OBSERVE" option.  In a GET OBSERVE, the server shall then send responses to client whenever observed parameter changes. 
* Resource discovery mechanisms that produce URIs. 
* A universal discovery URI that any CoAP server should implement is: GET /.well-known/core 

## CoAP For OTA Firmware Updating 
 
CoAP bills itself as a stateless protocol.  The server handles GET requests independently, however the client, while handling block transfers, will need to issue GET requests with the appropriate block2 offset fields filled in for each chunk it is requesting.  To use CoAP and especially with Contiki's Erbium client and Node.js' coap package, the following considerations must be adhered to.

* As mentioned above, each GET request is handled independently and as such, the CoAP server's request handler must find the appropriate bytes to respond with in the same manner as if it was the first or the last request.  This means that it will always slice the firmware binary at the requested offset, and that this offset must be present in the payload of each GET request. This is achieved by ensuring the coap payload array containing the offset is allocated statically and not on the stack.  The Coap block protocol is handled under-the-hood by Erbium and node.js libraries in a stateless way; they send/receive the block2 option headers that tell the server what portion of the firmware image the server request handler is providing (always at the specified offset) to send in the response chunk. 
* It is not efficient to send the firmware request info in each GET request packet.  We can create a two-step request protocol that still keeps the server stateless.  The first step is to send the firmware request info as the GET payload, including the PID, VERSION, TYPE to a root URL, e.g. /updates 
* The server responds to the intial GET request with a URL of the firmware image that matches the request.  The URL is actually a 4 byte (8 character) hash of the firmware file name, appended to the root URL, e.g. "8a6b9c2f" is provided in the response.  The client then makes a request to this URL : /updates/8a6b9c2f. 
* The second request includes just the desired offset as the payload (4 bytes) to the URL provided in the first request.  This offset is applied by the server each time it serves up the response containing the firmware binary. 
* The server must enumerate the possible firmware binary files, generate hashes then cache them in a lookup table. 

***
## Support

If you find this useful consider tossing some &#579; Satoshi our way to help fund our groundbreaking IoT efforts!

`1FFpt2zfEKZN1LXh9MUCcm532p7oUztJz8`

