const Discord = require('discord.js');
const client = Discord.Client();
client.on('message',()=>{
  // blah blah blah
  // whatever code goes here
});
function main(token) {
  client.login(token);
}
module.exports{start:main};
