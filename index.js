const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;
const apikey = process.env.BSC_API_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token,{polling: false});

var newArray = Array();
var DataMessage = Array();

async function getUpdates(){
  await bot.getUpdates().then(function(res){
        res.forEach((data,index) => {
            if(data.message.chat.type === 'group'){
                newArray.push(data.message.chat.id);
            }
        });
    });
}

function convertDate(unix_timestamp){
// Create a new JavaScript Date object based on the timestamp
// multiplied by 1000 so that the argument is in milliseconds, not seconds.
var date = new Date(unix_timestamp * 1000);
// Hours part from the timestamp
var hours = date.getHours();
// Minutes part from the timestamp
var minutes = "0" + date.getMinutes();
// Seconds part from the timestamp
var seconds = "0" + date.getSeconds();

// Will display time in 10:30:23 format
var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

return formattedTime;
}

async function getTransaction(){
    axios.get('https://api.bscscan.com/api', {
        params: {
          apikey:apikey,
          sort:'asc',
          offset:10,
          page:1,
          contractaddress:process.env.CONTRACT_ADDRESS,
          address:process.env.ADDRESS,
          module:'account',
          action:'tokentx'
        }
      })
      .then(function (response) {
          let result = [];
          response.data.result.forEach((data,index) => {
            if(data.to === process.env.ADDRESS){
                // console.log(convertDate(data.timeStamp));
                result.push(data);
            }
          });
          console.log(convertDate(result[0].timeStamp));
          if(DataMessage.indexOf(result[0]) !== -1){
              console.log('not send any notification');
          }else{
            console.log('send broadcast : '+DataMessage);
            sendMessage(JSON.parse(JSON.stringify(result[0])));
            DataMessage.push(result[0]); 
          }
      })
}

async function sendMessage(msg){
    let unique = [...new Set(newArray)];
    const opts = {
        parse_mode: 'Markdown'
      };
    unique.forEach((chatId,index) => {
        console.log('send to :'+chatId);
        // bot.sendMessage(chatId, '*New Burn Detected!*\n We would like to introduce you our new [product](https://xxx.yyy/zzz)',opts);
        bot.sendMessage(chatId, '*New Burn Detected!!!* \n \n Value : _'+msg.value.slice(0,-8)+' KIND_ \n Visit : https://bscscan.com/tx/'+msg.hash+'',opts);
    });
}

async function main(){
   await getUpdates();
   getTransaction();
//    sendMessage();
}

setInterval(() => {
    main();
}, 900000);