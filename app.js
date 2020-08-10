var express = require('express');
var app = express();
var mysql = require('./db/mysql.js');
var session = require('express-session');
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require('path');
var convert = require('xml-js');
var request = require('request');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, '/public')));
mysql.connect();
function removeTag(content){
    
    
    content = content.replace(/(<([^>]+)>)/ig,"");
    content = content.replace(/&nbsp;/gi,"");
    content = content.replace(/&gt;/gi,"");
    content = content.replace(/○/gi,"");
    content = content.replace(/\n/gi,"");
    content = content.replace(/\./gi,"");
    
    return content;
}
function getData(){
    const xmlurl = 'http://openapi.seoul.go.kr:8088/7a51596966736b733330767a6e5975/xml/GwanakNewsList/1/100/'
    request.get(xmlurl,function(err, res, body){
        if(err) console.log(err);
        else{
            if(res.statusCode == 200){
                var result = body;
                var xmlToJson = convert.xml2json(result,{
                    compact : true,
                    spaces : 4
                })

                var stationCheck = -1;
                var parseJson = JSON.parse(xmlToJson);
                var value = parseJson.GwanakNewsList;
                
                var title;
                var date;
                var content;
                var number;
                
                mysql.query('SELECT number FROM news ORDER BY number DESC LIMIT 1'
                ,function(err,result){
                    if(err) console.log(err);
                    else{
                        
                        for(var i=0; i<100; i++){
                   
                        title = value.row[i].TITLE._text;
                        date = value.row[i].WRITEDAY._text;
                        content = value.row[i].CONTENT._text;
                        number = value.row[i].SEQ._text;
                        content = removeTag(content);
                        date = date.substring(0,8);
                    
                        if(result[0].number == number){
                           console.log("not updated");
                            break;
                           
                        }
                        else{
                            mysql.query('INSERT INTO news (number,title,content,date) VALUES (?,?,?,?)'
                            ,[number,title,content,date]
                            ,function(err,result){
                                if(err) console.log(err);
                                else{
                                }
                            });
                        }
                      }
                    }
                });
                
            }
        }
    });
}

app.get('/getData',function(req,res){
    getData();
});


//open server
app.get('/', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.end(data);
});
app.listen(80, function() {
    console.log('HackerTon server on');
});

