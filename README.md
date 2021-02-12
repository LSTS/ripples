# Ripples

## How to run ripples server locally:
1. Install JDK 8+
2. Run: ./gradlew build bootRun

## How to run ripples web client locally:
1. Install [yarn](https://yarnpkg.com/lang/en/docs/install)
2. cd ripples-web
3. yarn install
4. yarn start

## Manual tests description:
### Iridium tests (each of the following tests should be executed from a browser and from Neptus):
- Send a plan to a vehicle without any plan assigned.
- Send a plan to a vehicle that is already executing a plan.
- Update the position of a waypoint that has not been reached yet.
- Delete a waypoint that has not been reached yet.
- Update the ETA of a waypoint that has not been reached yet.

### Usability tests (should be run in a smart phone browser):
- Create a new plan and send it to a vehicle.
- Wait for the plan to generate temperature profiles and open one of them.
- Use the slider to see previous and future positions of the vehicles and AIS ships.
- Change the position of a waypoint that has not been reached yet.
- Delete a waypoint that has not been reached yet.

### Risk analysis tests:
- Open the risk analysis tool and submit your phone number in the format: +yyyxxxxxxxxx where y is the country code and x is the phone number
- Open ripples and create a new plan that should have collisions with AIS ships and send it to a vehicle.
- Check on the risk analysis tool that collisions are being predicted correctly.
