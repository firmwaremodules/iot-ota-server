# OTA Firmware Update Server for CoAP

Over-the-air IoT device firmware update server using CoAP.

# Setup

 - Clone or download this repository to machine with Node.js installed.
 - Install the node-coap library: npm install coap
 - For console log timestamping, install log-timestamp: npm install log-timestamp
 
 # Running
 
 - start the server: node iot-ota-server-coap.js
 
 It will enumerate the contents of the updates/ directory, searching for *.fmu* firmware update files.
 
