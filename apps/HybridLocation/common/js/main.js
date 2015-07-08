/*
 * COPYRIGHT LICENSE: This information contains sample code provided in source code form. You may copy, modify, and distribute
 * these sample programs in any form without payment to IBM® for the purposes of developing, using, marketing or distributing
 * application programs conforming to the application programming interface for the operating platform for which the sample code is written.
 * Notwithstanding anything to the contrary, IBM PROVIDES THE SAMPLE SOURCE CODE ON AN "AS IS" BASIS AND IBM DISCLAIMS ALL WARRANTIES,
 * EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, ANY IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, SATISFACTORY QUALITY,
 * FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND ANY WARRANTY OR CONDITION OF NON-INFRINGEMENT. IBM SHALL NOT BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR OPERATION OF THE SAMPLE SOURCE CODE.
 * IBM HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS OR MODIFICATIONS TO THE SAMPLE SOURCE CODE.
 */

//display the position to the user
function displayPosition(pos) {
	$('#longitude').html('<b>Longitude:</b> ' + pos.coords.longitude);
	$('#latitude').html('<b>Latitude:</b> ' + pos.coords.latitude);
	$('#timestamp').html('<b>Timestamp:</b> ' + new Date(pos.timestamp));
}

function alertOnGeoAcquisitionErr(geoErr) {
	alert('Error acquiring geolocation (' + geoErr.code + '): ' + geoErr.message);
}


function getFirstPositionAndTrack() {
	alert('Click OK to proceed to acquire starting position');

	// use GPS to get the user's location
	var geoPolicy = WL.Device.Geo.Profiles.LiveTracking();
	geoPolicy.timeout = 60000; // set timeout to 1 minute
	geoPolicy.maximumAge = 10000; // allow to use a position that is 10 seconds old
	
	// note: to see at high-accuracy, change RoughTracking above to LiveTracking
	
	// get the user's current position
	WL.Device.Geo.acquirePosition(
			function(pos) {
				// when we receive the position, we display it and start on-going acquisition
				displayPosition(pos);
				
				
				var triggers = {
					Geo: {
						posChange: { // display all movement
							type: "PositionChange",
							callback: function(deviceContext) {
									displayPosition(deviceContext.Geo);
								}
						},
						
						leftArea: { // alert when we have left the area
							type: "Exit",
							circle: {
								longitude: pos.coords.longitude,
								latitude: pos.coords.latitude,
								radius: 200
							},
							callback: function() {
								alert('Left the area');
								WL.Client.transmitEvent({ event: 'exit area'}, true);
							}
						},
						
						dwellArea: { // alert when we have stayed in the vicinity for 3 seconds
							type: "DwellInside",
							circle: {
								longitude: pos.coords.longitude,
								latitude: pos.coords.latitude,
								radius: 50
							},
							dwellingTime: 3000,
							callback: function() {
								alert('Still in the vicinity');
								WL.Client.transmitEvent({ event: 'dwell inside area'}, true);
							}
						}
					}	
				};
				
				WL.Device.startAcquisition({ Geo: geoPolicy }, triggers, { Geo: alertOnGeoAcquisitionErr } );
			},
			function(geoErr) {
				alertOnGeoAcquisitionErr(geoErr);
				// try again:
				getFirstPositionAndTrack();
			},
			geoPolicy
		); 
}

function onConnectSuccess(){
	// start up acquisition process
	getFirstPositionAndTrack();

}

function onConnectFailure(){
	WL.SimpleDialog.show("Location Services", "Failed connecting to MobileFirst server. Try again later.", 
			[{
				text : 'Reload',
				handler : WL.Client.reloadApp
			},
			{
				text: 'Close',
				handler : function() {}
			}]
		);
}

function wlCommonInit(){
	// Common initialization code goes here
	WL.Client.connect({
		onSuccess: onConnectSuccess,
		onFailure: onConnectFailure
	});
	
	// keep running while in background on Android; will show a notification
	WL.App.setKeepAliveInBackground(true);
}
