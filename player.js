function loadVideo() {
    let url = document.getElementById("videoURL").value;
    let player = document.getElementById("videoPlayer");
    let source = document.getElementById("videoSource");

    if(url.trim() === ""){
        alert("Please enter a valid video URL!");
        return;
    }

    source.src = url;
    player.load();

    let embedCode =
`<iframe src="https://${window.location.hostname}/${window.location.pathname}?video=${encodeURIComponent(url)}" 
width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

    document.getElementById("embedCode").value = embedCode;
}

// Auto-load if ?video= exists
const urlParams = new URLSearchParams(window.location.search);
const videoURL = urlParams.get("video");

if(videoURL) {
    document.getElementById("videoURL").value = videoURL;
    document.getElementById("videoSource").src = videoURL;
    document.getElementById("videoPlayer").load();
}
