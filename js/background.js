//============================================================//
/* User Information */
var UserInfo = {
	data: "",
	load: function(sendResponse) {
		var xhr = new XMLHttpRequest();
		var url = Constant.Path.FM_BAIDU + Constant.Path.DATA_BASE + Constant.Path.USER_INFO + (new Date).getTime() + "&_=" + ((new Date).getTime()-38000);
		xhr.open(
			"GET",
			url,
			true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				UserInfo.done(JSON.parse(xhr.responseText), sendResponse);
			}
		}
		xhr.send();
	},
	done: function(data, sendResponse) {
		UserInfo.data = data;
		if (sendResponse) {
			sendResponse({responseFromBackground: data.user_id});
		}
	},
	fail: function() {
		//TODO
	},
	loadData: function(sendResponse) {
		UserInfo.load(sendResponse);
	}
};
/* End User Information */

//============================================================//
/* Channel List */
var ChannelList = {
	channel_list: "",
	currChannelId: "",
	load: function() {
		var xhr = new XMLHttpRequest();

		var url = Constant.Path.FM_BAIDU + Constant.Path.DATA_BASE + Constant.Path.CHANNEL_LIST + (new Date).getTime() + "&_=" + ((new Date).getTime()-38000);
		xhr.open(
			"GET",
			url,
			true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				ChannelList.done(JSON.parse(xhr.responseText));
			}
		}
		xhr.send();
	},
	done: function(data) {
		ChannelList.channel_list = data.channel_list;
		//TODO 根据登录情况获取音乐列表
		if (data.user_id) {
			MusicList.loadData("private");
		} else {
			MusicList.loadData(data.channel_list[0].channel_id, false);
		}
	},
	fail: function() {
		//TODO
	},
	loadData: function() {
		ChannelList.load();
	}
};
/* End Channel List */

//============================================================//
/* Favrate Music List */
var FavrMusicList = {
	list: "",
	loadData: function() {
			MusicList.loadData("lovesongs", true);
	},
	isFavrMusic: function(songId) {
		var music = FavrMusicList.getMusicById(songId);
		if (music.length == 1) {
			return true;
		} else {
			return false;
		}
	},
	getMusicById: function(songId) {
		return FavrMusicList.list.filter(function(item){
			if(item.id == songId){
				return item;
			}
		});
	}
}
/* End Favrate Music List */

//============================================================//
/* Music List */
var MusicList = {
	list: "",
	currentMusicListPoint: 0,
	songIds: "",
	load: function(channelId, isGetFavrMusicList) {
		var xhr = new XMLHttpRequest();
		var url = Constant.Path.FM_BAIDU + Constant.Path.DATA_BASE + Constant.Path.MUSIC_LIST_1 + channelId + Constant.Path.MUSIC_LIST_2 + (new Date).getTime() + "&_=" + ((new Date).getTime()-38000);
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				MusicList.done(JSON.parse(xhr.responseText), isGetFavrMusicList);
			}
		}
		xhr.send();
	},
	done: function(data, isGetFavrMusicList) {
		if (isGetFavrMusicList) {
			FavrMusicList.list = data.list;
		} else {
			MusicList.list = data.list;
			//TODO 获取前十歌曲信息
			MusicList.currentMusicListPoint = 0;
			MusicList.next10MusicList(MusicList.currentMusicListPoint);
		}
	},
	fail: function() {
		//TODO
	},
	loadData: function(channelId, isGetFavrMusicList) {
		MusicList.load(channelId, isGetFavrMusicList);
		ChannelList.currChannelId = channelId;
	},
	next10MusicList: function(currMusicListPoint) {
		if (currMusicListPoint>=MusicList.list.length) {
			currMusicListPoint = 0;
			MusicList.currentMusicListPoint = 10;
		} else if ((currMusicListPoint+9) >= MusicList.list.length){
			MusicList.currentMusicListPoint = MusicList.list.length;
		} else {
			MusicList.currentMusicListPoint = currMusicListPoint + 10;
		}

		MusicList.songIds = "";
		for(i = currMusicListPoint; i <MusicList.currentMusicListPoint; i++){
			MusicList.songIds += (MusicList.list[i].id + ",")
		}
		MusicList.songIds = MusicList.songIds.substring(0,MusicList.songIds.length - 1);
		//TODO 获取当前列表中详细的音乐信息
		DetailSongList.loadData(MusicList.songIds);

	}
};
/* End Music List */

//============================================================//
/* Detail Song List */
var DetailSongList = {
	songList: "",
	load: function(songIds) {
		var xhr = new XMLHttpRequest();
		var url = Constant.Path.LS_PATH + Constant.Path.DETAIL_SONG_LIST_1 + songIds + Constant.Path.DETAIL_SONG_LIST_2 + (new Date).getTime() + "&_=" + ((new Date).getTime()-38000);
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				DetailSongList.done(JSON.parse(xhr.responseText));
			}
		}
		xhr.send();
	},
	done: function(data) {
		DetailSongList.songList = data.data.songList;
		//TODO 更新完成
		PlayAutoControl.updateSongList(DetailSongList.songList);

	},
	fail: function() {
		//TODO
	},
	loadData: function(songIds) {
		DetailSongList.load(songIds);
	}
};
/* End Detail Song List */

//============================================================//
/* Music Player */
var MusicPlayer = {
	audio: null,
	duration: -1,
	volume: 0.2,
	isInitial: false,
	initial: function() {
		MusicPlayer.audio = new Audio();
		// 缓冲到可以播放时：保存歌曲时长
		MusicPlayer.audio.addEventListener("canplay", function() {
			MusicPlayer.audio.volume = MusicPlayer.volume;
			MusicPlayer.duration = Math.ceil(MusicPlayer.audio.duration);
		}, false);
		// 当播放结束时：播放下一首
		MusicPlayer.audio.addEventListener("ended", function() {
			//TODO 播放下一首歌曲
			PlayAutoControl.palyNext();
		}, false);
		// 当在音频/视频加载期间发生错误时
		MusicPlayer.audio.addEventListener("error", function() {
			//TODO 播放下一首歌曲
			PlayAutoControl.palyNext();
		}, false);
		MusicPlayer.audio.isInitial = true;
	},
	play: function(url) {
		if (MusicPlayer.audio.isInitial) {
			if (url) {
				MusicPlayer.audio.src = url;
				MusicPlayer.audio.play();
			} else if (MusicPlayer.audio.paused) {
				MusicPlayer.audio.play();
			}
			PlayAutoControl.palyStatus = Constant.PlayStatus.PLAYING;
			chrome.browserAction.setIcon({ path:"img/paly.png" });
		}
	},
	pause: function() {
		if (MusicPlayer.audio.isInitial && !MusicPlayer.audio.paused) {
			MusicPlayer.audio.pause();
			PlayAutoControl.palyStatus = Constant.PlayStatus.PAUSED;
			chrome.browserAction.setIcon({ path:"img/pause.png" });
		}
	},
	load: function(url) {
		MusicPlayer.audio.src = url;
	},
	getCurrentSrc: function() {
		return MusicPlayer.audio.currentSrc;
	},
	setMute: function(mute) {
		if (MusicPlayer.audio.isInitial) {
			MusicPlayer.audio.muted = mute;
		}
	},
	turnUpVolum: function() {
		if (MusicPlayer.volume < 1) {
			MusicPlayer.volume = MusicPlayer.volume + 0.1;
			MusicPlayer.audio.volume = MusicPlayer.volume;
		}
	},
	turnDownVolum: function() {
		if (MusicPlayer.volume > 0) {
			MusicPlayer.volume = MusicPlayer.volume - 0.1;
			MusicPlayer.audio.volume = MusicPlayer.volume;
		}
	}
}
/* End Music Player */

//============================================================//
/* Constant */
var Constant = {
	Path: {
		LS_PATH: "http://music.baidu.com/data/music/fmlink",
		FM_BAIDU: "http://fm.baidu.com",
		DATA_BASE: "/dev/api/",

		USER_INFO: "?tn=usercounts&format=json&r=",
		CHANNEL_LIST: "?tn=channellist&format=channellist&r=",
		MUSIC_LIST_1: "?tn=playlist&id=",
		MUSIC_LIST_2: "&special=flash&prepend=&format=json&r=",
		DETAIL_SONG_LIST_1: "?rate=64&songIds=",
		DETAIL_SONG_LIST_2: "&_=",
		ACTION_LOVE: "?action=userop&r="
	},
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
	PlayStatus: {
		PLAYING: 0xB001,
		PAUSED: 0xB002
	}
}
/* End Constant */

//============================================================//
/* Song */
function play() {
	MusicPlayer.play(this.songLink);
}

function load() {
	MusicPlayer.load(this.songLink);
}

function Song(songInfo) {
	var _song = new Object;
	_song.songId = songInfo.songId;
	_song.songName = songInfo.songName;
	_song.artistName = songInfo.artistName;
	_song.albumName = songInfo.albumName;
	_song.songPicBig = songInfo.songPicBig;
	_song.songLink = songInfo.songLink;
	_song.lrcLink = songInfo.lrcLink;
	_song.queryId = songInfo.queryId,
	_song.play = play;
	_song.load = load;
	return _song;
}
/* End Song */

//============================================================//
/* PlayControl */
var PlayAutoControl = {
	palyStatus: Constant.PlayStatus.PAUSED,
	songList: null,
	songInfo: {
		songName: null,
		artistName: null,
		songPicBig: null,
		songLink: null,
		queryId: null,
		favrStatus: null
	},
	songPoint: -1,
	updateSongList: function(songList) {
		PlayAutoControl.songList = songList;
		PlayAutoControl.songPoint = -1;
		PlayAutoControl.palyNext();
	},
	palyNext: function() {
		if (PlayAutoControl.songList) {
			PlayAutoControl.songPoint ++;
			if (PlayAutoControl.songPoint < PlayAutoControl.songList.length) {
				var song = Song(PlayAutoControl.songList[PlayAutoControl.songPoint]);
				if (PlayAutoControl.palyStatus == Constant.PlayStatus.PLAYING) {
					song.play();
				} else {
					song.load();
				}
				PlayAutoControl.songInfo.songName = song.songName;
				PlayAutoControl.songInfo.artistName = song.artistName;
				PlayAutoControl.songInfo.songPicBig = song.songPicBig;
				PlayAutoControl.songInfo.songLink = song.songLink;
				PlayAutoControl.songInfo.queryId = song.queryId;
				PlayAutoControl.songInfo.favrStatus = FavrMusicList.isFavrMusic(song.songId);
				sendSongInfoToPopup();
			} else {
				PlayAutoControl.songPoint = -1;
				//TODO 加载下10首歌曲信息
				MusicList.next10MusicList(MusicList.currentMusicListPoint);
			}
		}
	}
}
/* End PlayControl */

function sendSongInfoToPopup() {
	chrome.extension.sendRequest({
		songInfo: PlayAutoControl.songInfo
	});
}

function markSong(markAction, sendResponse) {
	var url = Constant.Path.FM_BAIDU + Constant.Path.DATA_BASE + Constant.Path.ACTION_LOVE + (new Date).getTime();
	var xhr = new XMLHttpRequest();
    xhr.open("post", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
			sendResponse({responseFromBackground: markAction});
			FavrMusicList.loadData();
        }
    }
    var data = markAction + "|" + PlayAutoControl.songInfo.queryId + "|" + ChannelList.currChannelId;
    xhr.send("data=" + encodeURIComponent(data) + "&hashcode=" + encodeURIComponent(UserInfo.data.hash_code));
}

$(function() {
	UserInfo.loadData();
	ChannelList.loadData();
	FavrMusicList.loadData();
	MusicPlayer.initial();

	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
			
			switch (Math.ceil(request.requestFromPopup)){
				case Constant.CMD.PLAY:
					MusicPlayer.play();
					break;

				case Constant.CMD.PAUSE:
					MusicPlayer.pause();
					break;

				case Constant.CMD.SKIP:
					PlayAutoControl.palyNext();
					break;

				case Constant.CMD.CHANGECHANNEL:
					MusicList.loadData(request.channelId);
					break;

				case Constant.CMD.GETPLAYSTATUS:
					sendResponse({responseFromBackground: PlayAutoControl.palyStatus});
					break;

				case Constant.CMD.GETSONGNAME:
					sendResponse({responseFromBackground: PlayAutoControl.songInfo.songName});
					break;

				case Constant.CMD.GETARTISTNAME:
					sendResponse({responseFromBackground: PlayAutoControl.songInfo.artistName});
					break;

				case Constant.CMD.GETSONGPIC:
					sendResponse({responseFromBackground: PlayAutoControl.songInfo.songPicBig});
					break;

				case Constant.CMD.GETSONGLINK:
					sendResponse({responseFromBackground: PlayAutoControl.songInfo.songLink});
					break;

				case Constant.CMD.GETCHANNELLIST:
					sendResponse({responseFromBackground: ChannelList.channel_list});
					break;

				case Constant.CMD.GETCURRCHANNELID:
					sendResponse({responseFromBackground: ChannelList.currChannelId});
					break;

				case Constant.CMD.MARKLOVE:
					markSong(Constant.Behaviour.SONG.LOVE, sendResponse);
					break;

				case Constant.CMD.MARKDELOVE:
					markSong(Constant.Behaviour.SONG.DELOVE, sendResponse);
					break;

				case Constant.CMD.ISFAVRMUSIC:
					sendResponse({responseFromBackground: PlayAutoControl.songInfo.favrStatus});
					break;

				case Constant.CMD.GETUSERINFO:
					UserInfo.loadData(sendResponse);
					// sendResponse({responseFromBackground: UserInfo.data.user_id});
					break;
			}
		
	})

});