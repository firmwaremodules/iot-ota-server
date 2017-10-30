# OTA Firmware Update Server for CoAP

Over-the-air IoT device firmware update server using CoAP.

## Setup

 - Clone or download this repository to machine with Node.js installed.
 - Install the node-coap library: npm install coap
 - For console log timestamping, install log-timestamp: npm install log-timestamp
 
## Running
 
 - start the server: node iot-ota-server-coap.js
 
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

## A Bit About CoAP

CoAP - Constrained Application Protocol - works over UDP and is a stateless protocol.  The node (e.g. STM32L1) firmware may be using the stock Contiki Erbium CoAP client (er-coap).  The firmware update server in this repository is running a basic node.js script that uses the node-coap package.  The CoAP block transfer mechanism is employed to move the the firmware binary bytes to the client (node).  Because CoAP is stateless, the node issues a CoAP GET request for each block transfer, which is fixed to some amount by the client (currently 256 bytes).  All requests and responses are confirmable, which means that some reliability is added by CoAP to the inherently unreliable fire-and-forget UDP transport.  The confirmable CoAP messages require the receiver to send an acknowledgement response.  If the expected response is not received in a certain time, the request is retried. All of this is automatically handled in the CoAP client (Contiki Erbium) and server (noap-coap) libraries.
