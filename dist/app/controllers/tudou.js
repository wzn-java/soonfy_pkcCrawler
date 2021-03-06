"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
let rp = require('request-promise');
let moment = require('moment');
let cheerio = require('cheerio');
const movie_1 = require('../models/movie');
const count_1 = require('../models/count');
let dbInserter = function (DB, obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let data = yield DB.findOne({ _id: obj._id }).exec();
            if (data === null) {
                let _db = new DB(obj);
                yield _db.save();
            }
            else {
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let timeout = function (ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    });
};
let parseVideo = function (data) {
    let video = {};
    let $ = cheerio.load(data);
    let list_meta = $('meta');
    let type;
    let title;
    let pos = data.indexOf('iid: ');
    let pid = data.substring(pos + 5, data.indexOf('\r\n', pos + 5)).replace(/ /g, '');
    pos = data.indexOf('icode: \'');
    let vid = data.substring(pos + 8, data.indexOf('\'', pos + 8)).replace(/ /g, '');
    list_meta.each(function (index, _meta) {
        if ($(_meta).attr('name') === 'irAlbumName') {
            title = $(_meta).attr('content');
        }
        if ($(_meta).attr('name') === 'irCategory') {
            type = $(_meta).attr('content');
        }
    });
    video.pid = pid;
    video.type = type;
    video.title = title;
    video.vid = vid;
    return video;
};
let mvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let requrl = 'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + pid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let playSum = JSON.parse(body).playNum;
            let commentSum = JSON.parse(body).commentNum;
            let upSum = JSON.parse(body).digNum;
            let site = '土豆网';
            let createdAt = new Date();
            let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
            let _count = {
                _id: _id,
                filmId: filmId,
                site: site,
                playSum: playSum,
                commentSum: commentSum,
                upSum: upSum,
                createdAt: createdAt
            };
            yield dbInserter(count_1.Count, _count);
        }
        catch (error) {
            console.log(error);
        }
    });
};
let showCrawler = function (filmId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let options = {
                url: url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let fpos = url.indexOf('albumplay/') + 10;
            let lpos = url.indexOf('/', url.indexOf('albumplay/') + 10);
            let pid;
            if (lpos > fpos) {
                pid = url.substring(fpos, lpos);
            }
            else {
                pid = url.substring(fpos, url.indexOf('.', url.indexOf('albumplay/') + 10));
            }
            let requrl = 'http://www.tudou.com/tvp/getMultiTvcCodeByAreaCode.action?type=3&app=4&codes=' + pid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let showlist = JSON.parse(body).message;
            for (let show of showlist) {
                try {
                    yield timeout(1 * 1000 * 10 * (index / 20));
                    let requrl = 'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + show.iid;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2,
                        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
                        'Host': 'www.tudou.com',
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Encoding': 'gzip, deflate, sdch',
                        'Accept-Language': 'zh-Cn,zh;q=0.8',
                        'Connection': 'keep-alive',
                        'Referer': 'www.tudou.com',
                        'Cookie': 'tudou_wurfl=PC||400|400; juid=01at0ovh2t26rt; seid=01at0ovh362sca; yseid=1474273723572bSecp6; yseidcount=1; referhost=http%3A%2F%2Fwww.tudou.com; preferurl=; playMode=3; player_resume=27658z%3Dgw; seidtimeout=1474278869339; ypvid=1474277069416OppfZx; ysestep=9; yseidtimeout=1474284269419; ycid=0; ystep=9'
                    };
                    body = yield rp(options);
                    let play = JSON.parse(body).playNum;
                    let comment = JSON.parse(body).commentNum;
                    let up = JSON.parse(body).digNum;
                    let site = '土豆网';
                    let createdAt = new Date();
                    let name = show.title;
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        play: play,
                        comment: comment,
                        up: up,
                        createdAt: createdAt
                    };
                    yield dbInserter(movie_1.Movie, _movie);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let tudou = {};
exports.Tudou = tudou;
tudou.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { pid, type } = parseVideo(body);
            if (type) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(pid, obj.filmId);
                        break;
                    default:
                        yield showCrawler(obj.filmId, obj.url);
                        break;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
//# sourceMappingURL=tudou.js.map