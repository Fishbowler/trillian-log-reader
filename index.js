const lineReader = require('line-reader');
const parseString = require('xml2js').parseString;
const moment = require('moment');
const expandHomeDir = require('expand-home-dir');
const TableBuilder = require('table-builder')
const fs = require('fs');
const path = require('path');

let pathToLogFilesRoot = expandHomeDir('~/Library/Containers/com.ceruleanstudios.trillian.osx/Data/Library/Application Support/Trillian/users/')
const relativeLogDirectory='logs/JABBER/Channel'
const outputDirectory = './output'

let chatLogFiles = []
let users = fs.readdirSync(pathToLogFilesRoot)
users.forEach((user)=>{ // e.g. j.bloggs
    const userDir = path.join(pathToLogFilesRoot, user) //e.g. /Users/jbloggs/Library/...../users/j.bloggs/
    if (fs.existsSync(userDir) && fs.lstatSync(userDir).isDirectory()){
        const logsDirectoryRoot = path.join(userDir, relativeLogDirectory) //e.g. /Users/jbloggs/...../j.bloggs/logs/JABBER/Channel
        let logFiles = fs.readdirSync(logsDirectoryRoot)
        logFiles.forEach((file)=>{ //e.g. myroom@chat.example.com.xml
            logFile = path.join(logsDirectoryRoot, file) //Users/jbloggs/...../myroom@chat.example.com.xml
            if (fs.existsSync(logFile) && fs.lstatSync(logFile).isFile() && logFile.endsWith('.xml')){
                chatLogFiles.push({"user":user,"path":logFile})
            }
        })
    }
})

const logToHtml = (chatLog) => {
    const logFileName = path.basename(chatLog.path)
    const outputFile = path.join(outputDirectory, `log-${chatLog.user}-${logFileName}.html`)

    let outputData = []
    lineReader.eachLine(chatLog.path, function(line) {
        parseString(line, (err,result) => {
            if(!err && result && result.message && result.message.$){
                const message = result.message.$
                const msgTime = moment.unix(message.time).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)
                const msgFrom = decodeURIComponent(message.from)
                const msgText = decodeURIComponent(message.text)
                outputData.push({"date":msgTime, "from":msgFrom, "text":msgText})
            }
        })
    }, (err)=>{
        if(outputData.length == 0){
            console.log('No data found')
            return
        }
        
        const logTable = new TableBuilder()
            .setHeaders({"date":"DATE","from":"FROM","text":"TEXT"})
            .setData(outputData)
            .render()
        
        if (!fs.existsSync(outputDirectory)){
            fs.mkdirSync(outputDirectory);
        }
        
        const outputHTML = `<html>
            <head>
                <style type="text/css">
                    th { background-color:#000;color:white;}
                    td, th { padding:5px;border:1px solid #000; }
                    table { background-color:#eee; border-collapse:collapse;}
                    td.date-td, td.from-td {width:1px;white-space: nowrap;}
                </style
            </head>
            <body>
                ${logTable}
            </body>
        </html>`
        
        fs.writeFileSync(outputFile, outputHTML)
    });
}

chatLogFiles.forEach((chatLog)=>{
    logToHtml(chatLog)
})


