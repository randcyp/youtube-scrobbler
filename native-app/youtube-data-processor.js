const Constants = require("./constants");

module.exports = {getRPData};

let song, artist, album, metadataRows;


function getRPData(playbackData, snippet) {
    console.log(playbackData);

    let official = false;
    let videoData = playbackData.videoData;
    let videoCategoryId = snippet.categoryId;
    let description = snippet.localized.description;
    metadataRows = playbackData.metadataRows;

    if (description.endsWith("Auto-generated by YouTube.") &&
        description.startsWith("Provided to YouTube by ")) {
        // Auto-generated video
        song = videoData.title;
        artist = videoData.author.replace(" - Topic", "");
        album = description.split("\n\n")[2];

        official = true;
    } else if (videoCategoryId === "10" || playbackData.hasArtistBadge) {
        // Music!
        if (metadataRows.length === 0) {
            getMetadata(videoData.title);
        } else {
            extractMetadata();
            official = true;
        }
    } else {
        // Not music!
        song = undefined;
        console.log("Not music!")
    }

    let RPObject = {
        song: song,
        artist: artist,
        album: album,
        link: playbackData.link,
        currentTime: playbackData.currentTime,
        official: official
    };

    switch (playbackData.playerState) {
        case Constants.PLAYING:
            RPObject.small_text = "Playing";
            RPObject.small_image = "playing";
            break;
        case Constants.PAUSED:
            RPObject.small_text = "Paused";
            RPObject.small_image = "pause";
            break;
        case Constants.ENDED:
            RPObject.song = undefined;
            break;
        default:
            console.log(playbackData.playerState);
            // Do nothing
    }

    return RPObject
}

function extractMetadata() {
    for (let i = 0; i < metadataRows.length; i++) {
        let row = metadataRows[i];
        assignMetadata(row.title, row.content);
    }
}

function assignMetadata(title, content) {
    switch (title) {
        case "Song":
            song = content.text;
            break;
        case "Artist":
            artist = content.text;
            break;
        case "Album":
            album = content.text;
            break;
        default:
            // Do nothing for now
    }
}

function getMetadata(videoTitle) {
    if (videoTitle.includes(" - ")) {
        let string = videoTitle.split(" - ");
        artist = string[0];
        song = string[1];

        if (song.includes(" / ")) {
            let string = song.split(" / ");
            song = string[0];

            if (song.includes("(")) {
                let string = song.split("(");
                song = string[0];
            }
        }
    }

    if (artist === "" || song === "") {
        artist = undefined;
        song = videoTitle;
    }
}