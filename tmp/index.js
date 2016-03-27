#!/usr/bin/env node

var request  = require('request');
var inquirer = require('inquirer');

var topTenUrl = 'http://smartisian.club:5000/topten';
var basicUrl = 'http://smartisian.club:5000/topic?';

request(topTenUrl, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        var data = JSON.parse(body);
        var titles = [];
        for (var i = 0, len = data.length; i < len; i++) {
            titles.push(data[i].title);
        }
        inquirer.prompt([
            {
                type: "list",
                name: "title",
                message: "Which topic do you want to see?",
                choices: titles,
            },
        ], function(answer) {
            var link = null;
            answer = JSON.stringify(answer).slice(10, -2);
            console.log('selected topic:' + answer);
            for (var i = 0, len = data.length; i < len; i++) {
                if (data[i].title === answer) {
                    link = data[i].link;
                    break;
                }
            }
            // get the selected link
            var arrLink     = link.split('/');
            var board       = arrLink[arrLink.length - 2];
            var id          = arrLink[arrLink.length - 1];
            var currentPage = 1;

            console.log('board:' + board);
            console.log('id:' + id);

            var articleUrl = 'http://smartisian.club:5000/topic?board=' + board +'&id=' + id + '&p=' + currentPage;
            request(articleUrl, function(error, response, body) {
                if (!error && response.statusCode === 200) {}
                var data = JSON.parse(body);
                var replyData = data.items;

                var question = [
                    {
                        type: "confirm",
                        name: "askNext",
                        message: "下一条？",
                        default: true
                    }
                ];

                var current_reply = 1;
                var MAX_REPLY_COUNT = replyData.length;

                function ask() {
                    inquirer.prompt(question, function(answer) {
                        if (current_reply < MAX_REPLY_COUNT) {
                            console.log(replyData[current_reply++].content);
                        } else {
                            currentPage++;
                            articleUrl = 'http://smartisian.club:5000/topic?board=' + board + '&id=' + id + '&p=' + currentPage;
                            request(articleUrl, function(error, response, body) {
                                data = JSON.parse(body);
                                replyData = data.items;
                                current_reply = 0;
                                MAX_REPLY_COUNT = replyData.length;
                            });
                        }
                        if (answer.askNext) {
                            ask();
                        } else {
                            console.log('已成功推出');
                        }
                    });
                }
                console.log(replyData[0].content);
                ask();
            });
        });
    }
})
