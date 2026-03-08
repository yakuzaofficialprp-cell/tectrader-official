// index.js - Slash Command Discord Bot (discord.js v14)

require('dotenv').config();
const {
Client,
GatewayIntentBits,
EmbedBuilder,
PermissionsBitField,
REST,
Routes,
SlashCommandBuilder
} = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Welcome / Goodbye Channels
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL;
const GOODBYE_CHANNEL_ID = process.env.GOODBYE_CHANNEL;

let warnings = {};

const commands = [

new SlashCommandBuilder()
.setName('ban')
.setDescription('Ban a user')
.addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))
.addStringOption(o=>o.setName('reason').setDescription('Reason')),

new SlashCommandBuilder()
.setName('kick')
.setDescription('Kick a user')
.addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))
.addStringOption(o=>o.setName('reason').setDescription('Reason')),

new SlashCommandBuilder()
.setName('mute')
.setDescription('Timeout a user')
.addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))
.addIntegerOption(o=>o.setName('minutes').setDescription('Minutes').setRequired(true))
.addStringOption(o=>o.setName('reason').setDescription('Reason')),

new SlashCommandBuilder()
.setName('warn')
.setDescription('Warn a user')
.addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)),

new SlashCommandBuilder()
.setName('clear')
.setDescription('Clear messages')
.addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true)),

new SlashCommandBuilder()
.setName('msg')
.setDescription('Send embed message to channel')
.addStringOption(o=>o.setName('channel_id').setDescription('Channel ID').setRequired(true))
.addStringOption(o=>o.setName('message').setDescription('Message').setRequired(true)),

].map(cmd => cmd.toJSON());

client.once('ready', async () => {

console.log(`Logged in as ${client.user.tag}`);

const rest = new REST({version:'10'}).setToken(TOKEN);

try{
await rest.put(
Routes.applicationCommands(CLIENT_ID),
{body:commands}
);

console.log("Slash commands registered ✅");

}catch(err){
console.log(err);
}

});

client.on('interactionCreate', async interaction => {

if(!interaction.isChatInputCommand()) return;

if(interaction.commandName === 'ban'){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return interaction.reply({content:"No permission",ephemeral:true});

const user = interaction.options.getUser('user');
const reason = interaction.options.getString('reason') || "No reason";

const member = interaction.guild.members.cache.get(user.id);

await member.ban({reason}).catch(()=>{});

const embed = new EmbedBuilder()
.setColor("Red")
.setTitle("🔨 User Banned")
.addFields(
{name:"User",value:`${user.tag}`,inline:true},
{name:"By",value:`${interaction.user.tag}`,inline:true},
{name:"Reason",value:reason}
)
.setTimestamp();

interaction.reply({embeds:[embed]});
}

if(interaction.commandName === 'kick'){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
return interaction.reply({content:"No permission",ephemeral:true});

const user = interaction.options.getUser('user');
const reason = interaction.options.getString('reason') || "No reason";

const member = interaction.guild.members.cache.get(user.id);

await member.kick(reason).catch(()=>{});

interaction.reply(`👢 ${user.tag} kicked.`);
}

if(interaction.commandName === 'mute'){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
return interaction.reply({content:"No permission",ephemeral:true});

const user = interaction.options.getUser('user');
const mins = interaction.options.getInteger('minutes');
const reason = interaction.options.getString('reason') || "Muted";

const member = interaction.guild.members.cache.get(user.id);

await member.timeout(mins*60000,reason).catch(()=>{});

interaction.reply(`🔇 ${user.tag} muted for ${mins} minutes`);
}

if(interaction.commandName === 'warn'){

const user = interaction.options.getUser('user');

warnings[user.id] = (warnings[user.id]||0)+1;

interaction.reply(`⚠️ ${user.tag} warned (${warnings[user.id]} warns)`);
}

if(interaction.commandName === 'clear'){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
return interaction.reply({content:"No permission",ephemeral:true});

const amount = interaction.options.getInteger('amount');

await interaction.channel.bulkDelete(amount,true);

interaction.reply({content:`🧹 Cleared ${amount} messages`,ephemeral:true});
}

if(interaction.commandName === 'msg'){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
return interaction.reply({content:"No permission",ephemeral:true});

const channelId = interaction.options.getString('channel_id');
const message = interaction.options.getString('message');

const channel = interaction.guild.channels.cache.get(channelId);

if(!channel) return interaction.reply({content:"Channel not found",ephemeral:true});

const embed = new EmbedBuilder()
.setColor("Purple")
.setTitle("📢 Server Message")
.setDescription(message)
.setFooter({text:`Sent by ${interaction.user.tag}`})
.setTimestamp();

channel.send({embeds:[embed]});

interaction.reply({content:"✅ Message Sent",ephemeral:true});

}

});

// Welcome Message
client.on('guildMemberAdd', member => {

const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
if(!channel) return;

const embed = new EmbedBuilder()
.setColor("Green")
.setTitle("🎉 Welcome")
.setDescription(`Welcome **${member.user.tag}** to **${member.guild.name}**`)
.setThumbnail(member.user.displayAvatarURL())
.setTimestamp();

channel.send({embeds:[embed]});

});

// Goodbye Message
client.on('guildMemberRemove', member => {

const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
if(!channel) return;

const embed = new EmbedBuilder()
.setColor("Red")
.setTitle("👋 Goodbye")
.setDescription(`**${member.user.tag}** left the server`)
.setTimestamp();

channel.send({embeds:[embed]});

});

client.login(TOKEN);
