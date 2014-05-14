$(function() {
	getChannelList();
	getCurrentChannelId();
	getPlayStatus();
	changeSongInfo();
	getUserInfo();

	$("#playerpanel-ctrl-play").click(function() {
		palyOrPause();
	});

	$("#playerpanel-ctrl-skip").click(function() {
		playNextSong();
	});

	$("#playerpanel-ctrl-save").click(function() {
		downloadSong();
	});

	$("#playerpanel-ctrl-love").click(function() {
		if (loginStatus == Constant.LoginStatus.LOGIN) {
			if ($("#playerpanel-ctrl-love").attr("class") == "glyphicon glyphicon-heart playerpanel-ctrl-item") {
				markSong(Constant.CMD.MARKDELOVE);
			} else {
				markSong(Constant.CMD.MARKLOVE);
			}
		}
	});

	$("#menu").click(function(arg) {
		loading();
		var channelId = arg.target.parentElement.id;
		changeChannel(channelId);
	});


	chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
			console.log(sender.tab ?
				"from a content script:" + sender.tab.url :
				"from the extension");
			loaded();
			var songInfo = request.songInfo;
			changeSongInfo(songInfo);
	});

	setTimeout(function() {
		$('nav#menu').mmenu({
			slidingSubmenus: true
		});
	}, 50);
	
});

//============================================================//
/* Constant */
var Constant = {
	CMD: {
		PLAY: 0xA001,
		PAUSE: 0xA002,
		CHANGECHANNEL: 0xA003,
		SKIP: 0xA004,
		GETSONGNAME: 0xA005,
		GETARTISTNAME: 0xA006,
		GETSONGPIC: 0xA007,
		GETCHANNELLIST: 0xA008,
		GETCURRCHANNELID: 0xA009,
		GETPLAYSTATUS: 0xA00A,
		GETSONGLINK: 0xA00B,
		MARKLOVE: 0xA00C,
		MARKDELOVE: 0xA00D,
		ISFAVRMUSIC: 0xA00E,
		GETUSERINFO: 0xA00F
	},
	PlayStatus: {
		PLAYING: 0xB001,
		PAUSED: 0xB002
	},
	LoginStatus: {
		LOGIN: 0xC001,
		LOGOUT: 0xC002
	},
    Behaviour: {
        SONG: {
            PREV: "1|3|1",
            SKIP: "1|4|1",
            LOVE: "1|1|1",
            DELOVE: "2|1|1",
            HATE: "1|2|1",
            DEHATE: "2|2|1",
            COMPLETE: "1|5|1"
        }
    },
};
/* End Constant */

var loginStatus = Constant.LoginStatus.LOGOUT;
var playStatus = Constant.PlayStatus.PAUSED;

function palyOrPause() {
	//TODO 播放或暂停，同时更改按钮状态
	if (playStatus == Constant.PlayStatus.PLAYING) {
		playStatus = Constant.PlayStatus.PAUSED;
		chrome.extension.sendRequest({requestFromPopup: Constant.CMD.PAUSE}, function(response) {
		});
	} else {
		playStatus = Constant.PlayStatus.PLAYING;
		chrome.extension.sendRequest({requestFromPopup: Constant.CMD.PLAY}, function(response) {
		});
	}
	changeIconPlayStatus(playStatus);
}

function playNextSong() {
	loading();
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.SKIP}, function(response) {
		changeSongInfo();
	});
}

function downloadSong() {

	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETSONGLINK}, function(response) {
		window.open(response.responseFromBackground);
	});
}

function getUserInfo() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETUSERINFO}, function(response) {
		if (!response.responseFromBackground) {
			loginStatus = Constant.LoginStatus.LOGOUT;
			$("#private").remove();
			$("#lovesongs").remove();
			$("#playerpanel-ctrl-love").parent().remove();
		} else {
			loginStatus = Constant.LoginStatus.LOGIN;
		}
	});
}

function getChannelList() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETCHANNELLIST}, function(response) {
		$.each(response.responseFromBackground,function(i,item){
			appendChannel(item)
		})
	});
}

function changeChannel(channelId) {
	chrome.extension.sendRequest({
		requestFromPopup: Constant.CMD.CHANGECHANNEL,
		channelId: channelId
	});
	changeChannelIndex(channelId);
}

function getCurrentChannelId() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETCURRCHANNELID}, function(response) {
		changeChannelIndex(response.responseFromBackground);
	});
}

function getPlayStatus() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETPLAYSTATUS}, function(response) {
		playStatus = response.responseFromBackground;
		changeIconPlayStatus(playStatus);
	});
}

function changeSongInfo(songInfo) {
	if (songInfo) {
		changeSongName(songInfo.songName);
		changeArtistName(songInfo.artistName);
		changeSongPic(songInfo.songPicBig);
		changeMusicFavrStatus (songInfo.favrStatus);
	}else {
		getSongName();
		getArtistName();
		getSongPicUrl();
		getMusicFavrStatus();
	}
}

function getSongName() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETSONGNAME}, function(response) {
		changeSongName(response.responseFromBackground);
	});
}

function getArtistName() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETARTISTNAME}, function(response) {
		changeArtistName(response.responseFromBackground);
	});
}

function getSongPicUrl() {
	chrome.extension.sendRequest({requestFromPopup: Constant.CMD.GETSONGPIC}, function(response) {
		changeSongPic(response.responseFromBackground);
	});
}

function getMusicFavrStatus() {
	chrome.extension.sendRequest({
		requestFromPopup: Constant.CMD.ISFAVRMUSIC
	}, function(response) {
		changeMusicFavrStatus(response.responseFromBackground);
	});
}

function changeIconPlayStatus(status) {
	switch ((Math.ceil(status))) {
		case Constant.PlayStatus.PLAYING:
			$("#playerpanel-ctrl-play").attr("class", "glyphicon glyphicon-pause playerpanel-ctrl-item");
			break;
		case Constant.PlayStatus.PAUSED:
			$("#playerpanel-ctrl-play").attr("class", "glyphicon glyphicon-play playerpanel-ctrl-item");
			break;
	}
}

function changeSongName(name) {
	if (name) {
		$("#song-name").text(name);
	} else {
		$("#song-name").text("未知");
	}
	
}

function changeArtistName(name) {
	if (name) {
		$("#artist-name").text(name);
	} else {
		$("#artist-name").text("未知");
	}
}

function changeSongPic(picUrl) {
	if (picUrl) {
		$("#playerpanel-songpic").children().attr("src", picUrl);
	} else {
		$("#playerpanel-songpic").children().attr("src", "img/songpic.png");
	}
}
	
function appendChannel(channel) {
	var row = $("<li></li>").attr("id",channel.channel_id);
	var content = $("<a></a>").attr("href", "#").append(channel.channel_name);
	row.append(content);
	$("#menu").children().append(row);
}

function changeChannelIndex(channelId) {
	$("#"+channelId).addClass("mm-selected");
	$("#channel-name").text($("#"+channelId).children().text());
}

function changeMusicFavrStatus (status) {;
	if (status) {
		$("#playerpanel-ctrl-love").attr("class", "glyphicon glyphicon-heart playerpanel-ctrl-item");
	} else {
		$("#playerpanel-ctrl-love").attr("class", "glyphicon glyphicon-heart-empty playerpanel-ctrl-item");
	}
}

function markSong(markAction) {
	chrome.extension.sendRequest({requestFromPopup: markAction}, function(response) {
		if (response.responseFromBackground == Constant.Behaviour.SONG.LOVE) {
			$("#playerpanel-ctrl-love").attr("class", "glyphicon glyphicon-heart playerpanel-ctrl-item");
		} else {
			$("#playerpanel-ctrl-love").attr("class", "glyphicon glyphicon-heart-empty playerpanel-ctrl-item");
		}
	});
}

function loading() {
	$("#loading").show();
}

function loaded() {
	$("#loading").hide();
}
