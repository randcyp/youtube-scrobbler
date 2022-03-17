const Constants = require("./constants");

// Start a WebSocket server to listen for playback data
const WebSocket = require('ws');
const webSocketServer = new WebSocket.Server({port: 7841});

webSocketServer.on('connection', webSocket => {
    // When the handshake is complete
    webSocket.on('message', message => {
        // When a message is received
        handleMessage(message);
    });
});

/**
 * Handles requests sent to the WebSocket server
 * @param message A JSON string
 */
function handleMessage(message) {
    const request = JSON.parse(message);
    switch (request.message) {
        case Constants.PING:
            resetTimeout();
            break;
        case Constants.PLAYBACK_DATA:
            updatePresence(request.body);
            break;
        default:
            console.log("Invalid request header supplied: " + request.message);
    }
}

// Connect to the local Discord instance and supply it with Rich Presence
// data
const {Client} = require('discord-rpc');
const client = new Client({transport: 'ipc'});
const Processor = require("./youtube-data-processor");

/**
 * Updates the user's Rich Presence
 */
function updatePresence(playbackData) {
    let RPData = undefined;
    const { YoutubeDataAPI } = require("youtube-v3-api");

    const api = new YoutubeDataAPI("");

    api.searchVideo(playbackData.videoData.video_id).then(data => {
        let snippet = data.items[0].snippet;
        RPData = Processor.getRPData(playbackData, snippet);

        if (RPData.song !== undefined) {
            const state = getState(RPData.artist, RPData.album, RPData.official);

            let activity = {
                details: RPData.song,
                type: 3,
                state: state,
                assets: {
                    large_text: "Youtube",
                    large_image: "youtube",
                    small_text: RPData.small_text,
                    small_image: RPData.small_image
                },
                buttons: [
                    {
                        label: "Listen on Youtube",
                        url: RPData.link
                    }
                ],
                // IDK what this is for TBH LOL
                instance: false
            }

            if (RPData.small_text === "Playing") {
                // Only show the "elapsed" part when it's playing
                activity.timestamps = {
                    start: Date.now() - (Number(RPData.currentTime) * 1000)
                }
            }

            client.request('SET_ACTIVITY', {
                pid: process.pid,
                activity: activity
            });

            console.log(activity);
        } else {
            client.clearActivity(process.pid);
            console.log("Activity cleared!");
        }
    },(err) => {
        console.error(err);
    })
}

/* Once the client is ready, call onStartup() to execute initialTasks */
client.on('ready', async () => {
    console.log(`Successfully authorised as ${client.user.username}#${client.user.discriminator}`);
});

/* Login using the user's Discord Developer Application ID */
client.login({clientId: "CLIENT_ID"}).catch(console.error);

// Clear the rich presence status if the connection
// is lost for over 5 seconds
let timeoutHandle = setTimeout(() => {
    client.clearActivity(process.pid);
    console.log("Activity cleared!");
}, 5000);

function resetTimeout() {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => {
        client.clearActivity(process.pid);
        console.log("Activity cleared!");
    }, 5000);
}

function getState(artist, album, isOfficial) {
    let stateText = "";

    if (isOfficial) {
        if (artist !== undefined) {
            stateText += "by " + artist;
        }

        if (album !== undefined) {
            stateText +="\non " + album
        }
    } else {
        return artist;
    }

    if (stateText === "") {
        return "  ";
    } else {
        return stateText;
    }
}