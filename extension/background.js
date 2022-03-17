/*
TODO make the settings page
chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function(tab) {
		chrome.tabs.create({
			"url": "http://dev.opera.com"
		});
	});
});
 */

/** The ID of the tab to listen to */
let tabId = undefined;

// Set up the websocket connection
let webSocketServer = undefined;
function connect() {
    webSocketServer = new WebSocket("ws://localhost:7841");

    webSocketServer.onclose = e => {
        console.error('Socket is closed. Reconnect will be attempted in 1 second.'
            , e.reason);
        setTimeout(function() {
            connect();
        }, 1000);
    };
}

connect();

// Assign listeners
chrome.runtime.onMessage.addListener(handleMessage);
chrome.runtime.onMessageExternal.addListener(handleExternalMessage);
chrome.tabs.onRemoved.addListener(handleRemoved);

/**
 * Listens to messages from the active tab
 */
function handleExternalMessage(request, sender) {
    switch (request.message) {
        case PLAYBACK_DATA:
            console.log("Sending playback data!");
            console.log(request);
            webSocketServer.send(JSON.stringify(request));
            break;
        default:
            console.log("Invalid request header supplied: " + request.message);
    }
}

/**
 * Listens to messages from the content script
 */
function handleMessage(request, sender) {
    switch (request.message) {
        case SELECT_TAB:
            selectTab(sender.tab.id);
            break;
        default:
            console.log("Invalid request header supplied: " + request.message);
    }
}

let keepAlive = undefined;
/**
 * Stops pinging the native app when the tab is closed
 */
function handleRemoved(id, removeInfo) {
    if (tabId === id) {
        clearInterval(keepAlive);
    }
}

/**
 * Start pinging the websocket every second when
 * a tab is set.
 */
function selectTab(id) {
    tabId = id;
    console.log("Tab ID set to: " + tabId);

    // Ping the websocket connection every second
    keepAlive = setInterval(() => {
        chrome.tabs.get(tabId, tab => {

            if (webSocketServer.readyState === WebSocket.OPEN &&
            tab.url.startsWith("https://www.youtube.com/watch")) {

                webSocketServer.send(JSON.stringify(
                    {message: PING}
                ));
            }

        });
    }, 1000);
}
