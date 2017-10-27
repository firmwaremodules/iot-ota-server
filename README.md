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
