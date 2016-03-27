#!/usr/bin/env node

var request  = require('request');
var inquirer = require('inquirer');

var topTenUrl = 'http://smartisian.club:5000/topten';
var basicUrl  = 'http://smartisian.club:5000/topic?';

request(topTenUrl, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        var data = JSON.parse(body);
        var titles = [];
        for (var i = 0, len = data.length; i < len; i++) {
            titles.push(data[i].title);
        }
        var questions = [
            {
                type: "list",
                name: "title",
                message: "请选择以下十大任一主题，回车以继续...",
                choices: titles
            },
            {
                type: "confirm",
                name: "askNext",
                message: "next one?",
                default: true
            }
        ];

        function askTopic() {
            inquirer.prompt(questions.slice(0, 1), function(answer) {
                var link          = null;
                var selectedTopic = JSON.stringify(answer).slice(10, -2);

                console.log('正在获取主题内容');
                for (var i = 0, len = data.length; i < len; i++) {
                    if (data[i].title === selectedTopic) {
                        link = data[i].link;
                        break;
                    }
                }
                // get the selected link
                var arrLink     = link.split('/');
                var board       = arrLink[arrLink.length - 2];
                var id          = arrLink[arrLink.length - 1];
                var currentPage = 1;

                console.log('主题:' + selectedTopic);
                console.log('版块:' + board);
                console.log('id:' + id);
                var articleUrl = 'http://smartisian.club:5000/topic?board=' + board +'&id=' + id + '&p=' + currentPage;
                request(articleUrl, function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var data            = JSON.parse(body);
                        var replyData       = data.items;
                        var current_reply   = 1;
                        var MAX_REPLY_COUNT = replyData.length;
                        var cache           = [];

                        function askNext() {
                            inquirer.prompt(questions.slice(1, 2), function(answers) {
                                if (answers.askNext) {
                                    if (current_reply < MAX_REPLY_COUNT) {
                                        console.log(replyData[current_reply++].content);
                                    } else {
                                        currentPage++;
                                        articleUrl = 'http://smartisian.club:5000/topic?board=' + board + '&id=' + id + '&p=' + currentPage;
                                        request(articleUrl, function(error, response, body) {
                                            cache.push(JSON.stringify(JSON.parse(body).items));
                                            if (cache[cache.length - 1] == cache[cache.length - 2]) {
                                                console.log('恭喜你，爬楼结束啦，目前暂无最新回复。按 n 返回十大列表');
                                                // askTopic();
                                                return;
                                            }
                                            data = JSON.parse(body);
                                            replyData = data.items;
                                            current_reply = 0;
                                            MAX_REPLY_COUNT = replyData.length;
                                        });
                                    }
                                    askNext();
                                } else {
                                    askTopic();
                                }
                            });
                        }
                        askNext();
                    }
                });
            });
        }
        askTopic();
    }
});
