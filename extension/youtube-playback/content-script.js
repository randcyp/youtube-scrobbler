// Listen to playback data from the current tab
chrome.runtime.sendMessage({message: SELECT_TAB});

const snippet = `
    const EXTENSION_ID = "${chrome.runtime.id}";
    const PLAYBACK_DATA = "playback_data";
    
    document.getElementById("movie_player")
        .addEventListener("onStateChange", sendPlaybackData);
    
    sendPlaybackData(1);
    
    /**
     * Updates the native app when the player state changes.
     */
    function sendPlaybackData(playerState) {
        let player = document.getElementById("movie_player");
    
        chrome.runtime.sendMessage(EXTENSION_ID, {
            message: PLAYBACK_DATA,
            body: {
                link: document.location.href,
                playerState: playerState,
                currentTime: player.getCurrentTime(),
                videoData: player.getVideoData(),
                hasArtistBadge: hasArtistBadge(),
                metadataRows: getMetadataRows()
            }
        });
    }
    
    /**
     * @return {boolean} true if the uploader is a verified artist, false
     * otherwise.
     */
    function hasArtistBadge() {
        let badge = document
            .getElementById("upload-info")
            .getElementsByClassName
            ("badge badge-style-type-verified-artist " +
                "style-scope ytd-badge-supported-renderer")[0];
    
        return badge !== undefined;
    }
    
    /**
     * Returns a list of metadata from the video
     */
    function getMetadataRows() {
        let metadataRows;
    
        let showMore = document.getElementsByClassName
        ("more-button style-scope ytd-video-secondary-info-renderer")[0];
        let showLess = document.getElementsByClassName
        ("less-button style-scope ytd-video-secondary-info-renderer")[0];
    
        if (showMore !== undefined) {
            showMore.click();
            metadataRows = extractMetadata();
            showLess.click();
            // Very awful way to do it, I know LMAO
        } else {
            metadataRows = extractMetadata();
        }
    
        return metadataRows;
    }
    
    /**
     * Gets the song metadata from the DOM
     */
    function extractMetadata() {
        let metadata = [];
    
        let collection = document.getElementById("meta-contents")
            .getElementsByClassName("ytd-metadata-row-container-renderer");
    
        for (let i = 0; i < collection.length; i++) {
            let metadataRow = collection[i];
    
            if (metadataRow.tagName === "YTD-METADATA-ROW-RENDERER") {
                let title = metadataRow.getElementsByTagName("h4")[0]
                    .getElementsByTagName("yt-formatted-string")[0]
                    .innerHTML;
    
                let content = metadataRow.getElementsByTagName("div")[0]
                    .getElementsByTagName("yt-formatted-string")[0];
    
                let metadataObject = {
                    title: title
                };
                if (content.childElementCount !== 0) {
                    // Metadata with link
                    let anchor = content.getElementsByTagName("a")[0];
                    let text = anchor.innerHTML;
                    let link = anchor.href;
    
                    metadataObject.content = {
                        text: text,
                        link: link
                    };
                } else {
                    // Metadata without link
                    metadataObject.content = {
                        text: content.innerHTML
                    };
                }
    
                metadata.push(metadataObject);
            }
        }
    
        return metadata;
    }

`;

let element = document.createElement("script");
element.textContent = snippet;
(document.head).appendChild(element);
